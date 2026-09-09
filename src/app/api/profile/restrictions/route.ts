import { NextResponse } from "next/server";
import { z } from "zod";

import { foodRestrictionsFromLabels } from "@/lib/food-restrictions";
import { restrictionsFromInjuryLabels } from "@/lib/injuries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({ foodRestrictions: z.array(z.string()), injuries: z.array(z.string()) });

function sameSet(left: string[], right: string[]) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function PATCH(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid restrictions." }, { status: 400 });

  const foodRestrictions = foodRestrictionsFromLabels(parsed.data.foodRestrictions);
  const injuries = restrictionsFromInjuryLabels(parsed.data.injuries);
  const db = createAdminClient();
  const [{ data: currentProfile, error: profileError }, { data: nutritionPlan }, { data: workoutPlan }] = await Promise.all([
    db.from("profiles").select("food_restrictions, restrictions").eq("user_id", auth.user.id).single(),
    db.from("nutrition_plans").select("id").eq("user_id", auth.user.id).eq("active", true).maybeSingle(),
    db.from("workout_plans").select("id").eq("user_id", auth.user.id).eq("active", true).maybeSingle(),
  ]);
  if (profileError || !currentProfile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const [{ data: nutritionVersion }, { data: workoutVersion }] = await Promise.all([
    nutritionPlan ? db.from("nutrition_plan_versions").select("profile_snapshot").eq("nutrition_plan_id", nutritionPlan.id).eq("active", true).maybeSingle() : Promise.resolve({ data: null }),
    workoutPlan ? db.from("workout_plan_versions").select("profile_snapshot").eq("workout_plan_id", workoutPlan.id).eq("active", true).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const currentFoodRestrictions = stringArray(currentProfile.food_restrictions);
  const currentInjuries = stringArray(currentProfile.restrictions);
  const foodRestrictionsChanged = !sameSet(currentFoodRestrictions, foodRestrictions);
  const injuriesChanged = !sameSet(currentInjuries, injuries);
  const changed = foodRestrictionsChanged || injuriesChanged;
  const nutritionSnapshot = nutritionVersion?.profile_snapshot as Record<string, unknown> | null;
  const workoutSnapshot = workoutVersion?.profile_snapshot as Record<string, unknown> | null;
  const nutritionPlanNeedsReview = !sameSet(stringArray(nutritionSnapshot?.food_restrictions), foodRestrictions);
  const workoutPlanNeedsReview = !sameSet(stringArray(workoutSnapshot?.restrictions), injuries);

  const { error: updateError } = await db
    .from("profiles")
    .update({
      food_restrictions: foodRestrictions,
      restrictions: injuries,
      nutrition_plan_review_needed: nutritionPlanNeedsReview,
      workout_plan_review_needed: workoutPlanNeedsReview,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", auth.user.id);
  if (updateError) return NextResponse.json({ error: "Unable to save restrictions." }, { status: 500 });

  return NextResponse.json({
    updated: changed,
    foodRestrictionsChanged,
    injuriesChanged,
    nutritionPlanNeedsReview,
    workoutPlanNeedsReview,
  });
}