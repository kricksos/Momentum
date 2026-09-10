import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInitialPlan, parsePlanningProfile } from "@/features/planning/engine";

const requestSchema = z.object({ mealCount: z.number().int().min(3).max(6).optional() }).default({});

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Unable to regenerate nutrition.";
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Meal count must be between 3 and 6." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", authData.user.id).single();
    if (profileError || !profile) return NextResponse.json({ error: "Complete your profile first." }, { status: 400 });

    const mealCount = parsed.data.mealCount ?? profile.meal_count ?? 4;
    const plan = generateInitialPlan(parsePlanningProfile({ ...profile, meal_count: mealCount }));
    const { data: run, error: runError } = await supabase.from("plan_generation_runs").insert({ user_id: authData.user.id, run_type: "manual_regeneration", status: "pending", input_snapshot: { ...profile, meal_count: mealCount }, engine_version: "rules-v1" }).select("id").single();
    if (runError || !run) throw runError ?? new Error("Unable to start nutrition generation.");

    const { data: nutritionPlan } = await supabase.from("nutrition_plans").select("id").eq("user_id", authData.user.id).eq("active", true).maybeSingle();
    const planId = nutritionPlan?.id ?? (await supabase.from("nutrition_plans").insert({ user_id: authData.user.id, name: "Orientación nutricional inicial" }).select("id").single()).data?.id;
    if (!planId) throw new Error("Unable to find or create nutrition plan.");

    const [{ data: oldVersion }, { data: latestVersion }] = await Promise.all([
      supabase.from("nutrition_plan_versions").select("id").eq("nutrition_plan_id", planId).eq("active", true).maybeSingle(),
      supabase.from("nutrition_plan_versions").select("version_number").eq("nutrition_plan_id", planId).order("version_number", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const { data: version, error: versionError } = await supabase.from("nutrition_plan_versions").insert({ nutrition_plan_id: planId, generation_run_id: run.id, version_number: (latestVersion?.version_number ?? 0) + 1, profile_snapshot: { ...profile, meal_count: mealCount }, calories: plan.calories, protein_grams: plan.proteinGrams, carbs_grams: plan.carbsGrams, fats_grams: plan.fatsGrams, meal_count: plan.mealCount, precision_mode: "precise", reason: "restriction_change", active: false }).select("id").single();
    if (versionError || !version) throw versionError ?? new Error("Unable to create nutrition version.");

    const foodNames = [...new Set(plan.meals.flatMap((meal) => meal.items.map((item) => item.name)))];
    const { data: foods, error: foodsError } = await supabase.from("foods_catalog").select("id, name").in("name", foodNames);
    if (foodsError || !foods) throw foodsError ?? new Error("Food catalog is empty.");
    const foodByName = new Map(foods.map((food) => [food.name, food.id]));
    for (const [index, meal] of plan.meals.entries()) {
      const { data: savedMeal, error: mealError } = await supabase.from("nutrition_meals").insert({ nutrition_plan_version_id: version.id, name: meal.name, meal_order: index + 1, suggested_time: meal.suggestedTime, target_calories: meal.targetCalories }).select("id").single();
      if (mealError || !savedMeal) throw mealError ?? new Error("Unable to create meal.");
      const items = meal.items.map((item) => ({ meal_id: savedMeal.id, food_id: foodByName.get(item.name)!, quantity_grams: item.quantityGrams, role: item.role, alternative_group: item.alternativeGroup ?? null, substitution_group: item.alternativeGroup ?? null, weight_basis: item.weightBasis }));
      if (items.some((item) => !item.food_id)) throw new Error("Generated food is missing from catalog.");
      const { error: itemsError } = await supabase.from("nutrition_meal_items").insert(items);
      if (itemsError) throw itemsError;
    }

    if (oldVersion) {
      const { error: deactivateError } = await supabase.from("nutrition_plan_versions").update({ active: false }).eq("id", oldVersion.id);
      if (deactivateError) throw deactivateError;
    }
    const { error: activateError } = await supabase.from("nutrition_plan_versions").update({ active: true }).eq("id", version.id);
    if (activateError) throw activateError;
    await supabase.from("plan_generation_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", run.id);
    await supabase.from("profiles").update({ nutrition_plan_review_needed: false, updated_at: new Date().toISOString() }).eq("user_id", authData.user.id);
    return NextResponse.json({ regenerated: true, type: "nutrition", mealCount: plan.mealCount });
  } catch (error) {
    console.error("Unable to regenerate nutrition", errorMessage(error));
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
