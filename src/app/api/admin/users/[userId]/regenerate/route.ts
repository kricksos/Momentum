import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminUser } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateInitialPlan, parsePlanningProfile } from "@/features/planning/engine";
import { getPlanningExerciseCatalog } from "@/lib/exercise-catalog";

const schema = z.object({ type: z.enum(["workout", "nutrition"]) });
type Context = { params: Promise<{ userId: string }> };

export async function POST(request: Request, context: Context) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { userId } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid regeneration type." }, { status: 400 });

  try {
    const db = createAdminClient();
    const { data: profile } = await db.from("profiles").select("*").eq("user_id", userId).single();
    if (!profile) return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    const { data: run, error: runError } = await db.from("plan_generation_runs").insert({ user_id: userId, run_type: "manual_regeneration", status: "pending", input_snapshot: profile, engine_version: "admin-v1" }).select("id").single();
    if (runError || !run) throw runError ?? new Error("Unable to create generation run.");
    const current = generateInitialPlan(parsePlanningProfile(profile), await getPlanningExerciseCatalog());

    if (parsed.data.type === "nutrition") {
      const { data: nutritionPlan } = await db.from("nutrition_plans").select("id").eq("user_id", userId).eq("active", true).maybeSingle();
      if (!nutritionPlan) throw new Error("Nutrition plan not found.");
      const { data: oldVersion } = await db.from("nutrition_plan_versions").select("id, version_number").eq("nutrition_plan_id", nutritionPlan.id).eq("active", true).maybeSingle();
      if (oldVersion) await db.from("nutrition_plan_versions").update({ active: false }).eq("id", oldVersion.id);
      const { data: version, error: versionError } = await db.from("nutrition_plan_versions").insert({ nutrition_plan_id: nutritionPlan.id, generation_run_id: run.id, version_number: (oldVersion?.version_number ?? 0) + 1, profile_snapshot: profile, calories: current.calories, protein_grams: current.proteinGrams, carbs_grams: current.carbsGrams, fats_grams: current.fatsGrams, meal_count: current.mealCount, precision_mode: "precise", reason: "onboarding" }).select("id").single();
      if (versionError || !version) throw versionError ?? new Error("Unable to create nutrition version.");
      const foodNames = [...new Set(current.meals.flatMap((meal) => meal.items.map((item) => item.name)))];
      const { data: foods } = await db.from("foods_catalog").select("id, name").in("name", foodNames);
      const foodByName = new Map((foods ?? []).map((food) => [food.name, food.id]));
      for (const [index, meal] of current.meals.entries()) {
        const { data: savedMeal } = await db.from("nutrition_meals").insert({ nutrition_plan_version_id: version.id, name: meal.name, meal_order: index + 1, suggested_time: meal.suggestedTime, target_calories: meal.targetCalories }).select("id").single();
        if (!savedMeal) throw new Error("Unable to create nutrition meal.");
        const items = meal.items.map((item) => ({ meal_id: savedMeal.id, food_id: foodByName.get(item.name)!, quantity_grams: item.quantityGrams, role: item.role, alternative_group: item.alternativeGroup ?? null, substitution_group: item.alternativeGroup ?? null, weight_basis: item.weightBasis }));
        if (items.some((item) => !item.food_id)) throw new Error("Generated food is missing from catalog.");
        await db.from("nutrition_meal_items").insert(items);
      }
    } else {
      const { data: workoutPlan } = await db.from("workout_plans").select("id").eq("user_id", userId).eq("active", true).single();
      const { data: oldVersion } = workoutPlan ? await db.from("workout_plan_versions").select("id, version_number").eq("workout_plan_id", workoutPlan.id).eq("active", true).maybeSingle() : { data: null };
      if (!workoutPlan) throw new Error("Workout plan not found.");
      if (oldVersion) await db.from("workout_plan_versions").update({ active: false }).eq("id", oldVersion.id);
      const { data: version } = await db.from("workout_plan_versions").insert({ workout_plan_id: workoutPlan.id, generation_run_id: run.id, version_number: (oldVersion?.version_number ?? 0) + 1, profile_snapshot: profile, reason: "goal_change" }).select("id").single();
      if (!version) throw new Error("Unable to create workout version.");
      const exerciseNames = [...new Set(current.days.flatMap((day) => day.exercises.map((exercise) => exercise.name)))];
      const { data: exercises } = await db.from("exercises").select("id, name").in("name", exerciseNames);
      const exerciseByName = new Map((exercises ?? []).map((exercise) => [exercise.name, exercise.id]));
      for (const [index, day] of current.days.entries()) {
        const { data: savedDay } = await db.from("workout_days").insert({ workout_plan_version_id: version.id, name: day.name, order_number: index + 1 }).select("id").single();
        if (!savedDay) throw new Error("Unable to create workout day.");
        await db.from("workout_exercises").insert(day.exercises.map((exercise, exerciseIndex) => ({ workout_day_id: savedDay.id, exercise_id: exerciseByName.get(exercise.name)!, sets: exercise.sets, repetitions: exercise.repetitions, rest_seconds: exercise.restSeconds, order_number: exerciseIndex + 1 })));
      }
    }

    await db.from("plan_generation_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", run.id);
    await db.from("audit_events").insert({ user_id: userId, entity_type: `${parsed.data.type}_plan`, action: "update", metadata: { actor_user_id: auth.user.id, actor_email: auth.user.email, source: "admin_panel", action: "regenerate" } });
    return NextResponse.json({ regenerated: true, type: parsed.data.type });
  } catch (error) {
    console.error("Unable to regenerate plan from admin", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to regenerate plan." }, { status: 500 });
  }
}
