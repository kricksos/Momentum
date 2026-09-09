import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { foodRestrictionsFromLabels } from "@/lib/food-restrictions";
import { restrictionsFromInjuryLabels } from "@/lib/injuries";
import { generateInitialPlan, parsePlanningProfile } from "@/features/planning/engine";
import { getPlanningExerciseCatalog } from "@/lib/exercise-catalog";
import { runPlanAdjustment } from "@/features/planning/adjust";

const checkinSchema = z.object({
  goal: z.string().min(1),
  daysPerWeek: z.number().int().min(2).max(6),
  sessionDuration: z.number().int().min(30).max(180),
  trainingPlace: z.string().min(1),
  foodRestrictions: z.array(z.string()).default([]),
  injuries: z.array(z.string()),
  selfReport: z.enum(["bien", "estancado"]),
});

function sameSet(a: string[], b: string[]) {
  const left = [...a].sort();
  const right = [...b].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = checkinSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid check-in data." }, { status: 400 });

  const supabase = createAdminClient();
  const userId = authData.user.id;

  try {
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (!profile) return NextResponse.json({ error: "Complete your profile first." }, { status: 400 });

    const nextRestrictions = restrictionsFromInjuryLabels(parsed.data.injuries);
    const nextFoodRestrictions = foodRestrictionsFromLabels(parsed.data.foodRestrictions);
    const currentRestrictions = Array.isArray(profile.restrictions) ? (profile.restrictions as string[]) : [];
    const currentFoodRestrictions = Array.isArray(profile.food_restrictions) ? (profile.food_restrictions as string[]) : [];

    // Compare against the same fallbacks the check-in page pre-fills, so an unset field doesn't look like a false "change".
    const goalChanged = (profile.primary_goal ?? "") !== parsed.data.goal;
    const daysChanged = (profile.days_per_week ?? 3) !== parsed.data.daysPerWeek;
    const durationChanged = (profile.session_duration_minutes ?? 60) !== parsed.data.sessionDuration;
    const placeChanged = (profile.training_place ?? "Gimnasio completo") !== parsed.data.trainingPlace;
    const restrictionsChanged = !sameSet(currentRestrictions, nextRestrictions);
    const foodRestrictionsChanged = !sameSet(currentFoodRestrictions, nextFoodRestrictions);
    const structuralChange = goalChanged || daysChanged || durationChanged || placeChanged || restrictionsChanged || foodRestrictionsChanged || profile.nutrition_plan_review_needed || profile.workout_plan_review_needed;

    const updatedProfile = {
      ...profile,
      primary_goal: parsed.data.goal,
      days_per_week: parsed.data.daysPerWeek,
      session_duration_minutes: parsed.data.sessionDuration,
      training_place: parsed.data.trainingPlace,
      restrictions: nextRestrictions,
      food_restrictions: nextFoodRestrictions,
    };
    const { error: profileError } = await supabase.from("profiles").update({
      primary_goal: updatedProfile.primary_goal,
      days_per_week: updatedProfile.days_per_week,
      session_duration_minutes: updatedProfile.session_duration_minutes,
      training_place: updatedProfile.training_place,
      restrictions: updatedProfile.restrictions,
      food_restrictions: updatedProfile.food_restrictions,
    }).eq("user_id", userId);
    if (profileError) throw profileError;

    if (!structuralChange) {
      if (parsed.data.selfReport === "estancado") {
        const result = await runPlanAdjustment(userId);
        return NextResponse.json({ action: "adjusted", changed: [], result });
      }
      return NextResponse.json({ action: "no_change", changed: [] });
    }

    const { data: workoutPlan } = await supabase.from("workout_plans").select("id").eq("user_id", userId).eq("active", true).maybeSingle();
    const { data: nutritionPlan } = await supabase.from("nutrition_plans").select("id").eq("user_id", userId).eq("active", true).maybeSingle();
    if (!workoutPlan || !nutritionPlan) return NextResponse.json({ action: "profile_updated_only", changed: [] });

    const { data: currentWorkoutVersion } = await supabase.from("workout_plan_versions").select("id, version_number").eq("workout_plan_id", workoutPlan.id).eq("active", true).maybeSingle();
    const { data: currentNutritionVersion } = await supabase.from("nutrition_plan_versions").select("id, version_number, meal_count").eq("nutrition_plan_id", nutritionPlan.id).eq("active", true).maybeSingle();
    if (!currentWorkoutVersion || !currentNutritionVersion) return NextResponse.json({ action: "profile_updated_only", changed: [] });

    const reason = goalChanged ? "goal_change" : placeChanged ? "equipment_change" : restrictionsChanged ? "injury_change" : "goal_change";
    const profileForEngine = { ...updatedProfile, meal_count: currentNutritionVersion.meal_count ?? updatedProfile.meal_count ?? 4 };
    const generatedPlan = generateInitialPlan(parsePlanningProfile(profileForEngine), await getPlanningExerciseCatalog());

    const { data: run, error: runError } = await supabase
      .from("plan_generation_runs")
      .insert({ user_id: userId, run_type: "manual_regeneration", status: "pending", input_snapshot: profileForEngine, engine_version: "checkin-v1" })
      .select("id")
      .single();
    if (runError || !run) throw runError ?? new Error("Unable to start plan regeneration.");

    await supabase.from("workout_plan_versions").update({ active: false }).eq("id", currentWorkoutVersion.id);
    const { data: workoutVersion, error: workoutVersionError } = await supabase
      .from("workout_plan_versions")
      .insert({ workout_plan_id: workoutPlan.id, generation_run_id: run.id, version_number: currentWorkoutVersion.version_number + 1, profile_snapshot: profileForEngine, reason })
      .select("id")
      .single();
    if (workoutVersionError || !workoutVersion) throw workoutVersionError ?? new Error("Unable to create workout version.");

    const exerciseNames = [...new Set(generatedPlan.days.flatMap((day) => day.exercises.map((exercise) => exercise.name)))];
    const { data: exercises, error: exercisesError } = await supabase.from("exercises").select("id, name").in("name", exerciseNames);
    if (exercisesError || !exercises) throw exercisesError ?? new Error("Exercise catalog is empty.");
    const exerciseByName = new Map(exercises.map((exercise) => [exercise.name, exercise.id]));

    for (const [dayIndex, day] of generatedPlan.days.entries()) {
      const { data: workoutDay, error: dayError } = await supabase
        .from("workout_days")
        .insert({ workout_plan_version_id: workoutVersion.id, name: day.name, order_number: dayIndex + 1 })
        .select("id")
        .single();
      if (dayError || !workoutDay) throw dayError ?? new Error("Unable to create workout day.");

      const exercisesToInsert = day.exercises.map((exercise, exerciseIndex) => ({
        workout_day_id: workoutDay.id,
        exercise_id: exerciseByName.get(exercise.name)!,
        sets: exercise.sets,
        repetitions: exercise.repetitions,
        rest_seconds: exercise.restSeconds,
        order_number: exerciseIndex + 1,
      }));
      if (exercisesToInsert.some((exercise) => !exercise.exercise_id)) throw new Error("Generated exercise is missing from catalog.");
      const { error: workoutExerciseError } = await supabase.from("workout_exercises").insert(exercisesToInsert);
      if (workoutExerciseError) throw workoutExerciseError;
    }

    await supabase.from("nutrition_plan_versions").update({ active: false }).eq("id", currentNutritionVersion.id);
    const { data: nutritionVersion, error: nutritionVersionError } = await supabase.from("nutrition_plan_versions").insert({
      nutrition_plan_id: nutritionPlan.id,
      generation_run_id: run.id,
      version_number: currentNutritionVersion.version_number + 1,
      profile_snapshot: profileForEngine,
      calories: generatedPlan.calories,
      protein_grams: generatedPlan.proteinGrams,
      carbs_grams: generatedPlan.carbsGrams,
      fats_grams: generatedPlan.fatsGrams,
      meal_count: generatedPlan.mealCount,
      precision_mode: "precise",
      reason,
    }).select("id").single();
    if (nutritionVersionError || !nutritionVersion) throw nutritionVersionError ?? new Error("Unable to create nutrition version.");

    const mealFoodNames = [...new Set(generatedPlan.meals.flatMap((meal) => meal.items.map((item) => item.name)))];
    const { data: mealFoods, error: mealFoodsError } = await supabase.from("foods_catalog").select("id, name").in("name", mealFoodNames);
    if (mealFoodsError || !mealFoods) throw mealFoodsError ?? new Error("Food catalog is empty.");
    const foodByName = new Map(mealFoods.map((food) => [food.name, food.id]));

    for (const [mealIndex, meal] of generatedPlan.meals.entries()) {
      const { data: nutritionMeal, error: mealError } = await supabase.from("nutrition_meals").insert({
        nutrition_plan_version_id: nutritionVersion.id,
        name: meal.name,
        meal_order: mealIndex + 1,
        suggested_time: meal.suggestedTime,
        target_calories: meal.targetCalories,
      }).select("id").single();
      if (mealError || !nutritionMeal) throw mealError ?? new Error("Unable to create nutrition meal.");

      const mealItems = meal.items.map((item) => ({
        meal_id: nutritionMeal.id,
        food_id: foodByName.get(item.name)!,
        quantity_grams: item.quantityGrams,
        role: item.role,
        alternative_group: item.alternativeGroup ?? null,
        substitution_group: item.alternativeGroup ?? null,
        weight_basis: item.weightBasis,
      }));
      if (mealItems.some((item) => !item.food_id)) throw new Error("Generated food is missing from catalog.");
      const { error: mealItemsError } = await supabase.from("nutrition_meal_items").insert(mealItems);
      if (mealItemsError) throw mealItemsError;
    }

    await supabase.from("plan_generation_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", run.id);
    await supabase.from("profiles").update({ nutrition_plan_review_needed: false, workout_plan_review_needed: false }).eq("user_id", userId);

    const changed = [
      goalChanged ? "objetivo" : null,
      daysChanged ? "días de entrenamiento" : null,
      durationChanged ? "duración de la sesión" : null,
      placeChanged ? "lugar de entreno" : null,
      foodRestrictionsChanged ? "alergias/intolerancias alimentarias" : null,
      restrictionsChanged ? "lesiones/molestias" : null,
    ].filter((value): value is string => Boolean(value));

    return NextResponse.json({ action: "regenerated", changed, reason, structure: generatedPlan.structure, calories: generatedPlan.calories });
  } catch (error) {
    console.error("Unable to process check-in", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to process check-in." }, { status: 500 });
  }
}
