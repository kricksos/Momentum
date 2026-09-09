import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInitialPlan, parsePlanningProfile } from "@/features/planning/engine";
import { getPlanningExerciseCatalog } from "@/lib/exercise-catalog";

const generateSchema = z.object({ mealCount: z.number().int().min(3).max(5).optional() }).default({});

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = generateSchema.parse(await request.json().catch(() => ({})));
    const supabase = createAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Complete your profile before generating a plan." }, { status: 400 });
    }

    const { data: existingPlan } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("active", true)
      .maybeSingle();

    if (existingPlan) {
      const { data: existingVersion } = await supabase
        .from("workout_plan_versions")
        .select("id")
        .eq("workout_plan_id", existingPlan.id)
        .eq("active", true)
        .maybeSingle();
      const { data: existingNutrition } = await supabase
        .from("nutrition_plans")
        .select("id")
        .eq("user_id", authData.user.id)
        .eq("active", true)
        .maybeSingle();

      let workoutIsComplete = false;
      if (existingVersion) {
        const { data: days } = await supabase.from("workout_days").select("id").eq("workout_plan_version_id", existingVersion.id);
        if (days && days.length > 0) {
          const { count } = await supabase.from("workout_exercises").select("id", { count: "exact", head: true }).in("workout_day_id", days.map((day) => day.id));
          workoutIsComplete = (count ?? 0) > 0;
        }
      }

      let nutritionIsComplete = false;
      if (existingNutrition) {
        const { data: nutritionVersion } = await supabase.from("nutrition_plan_versions").select("id").eq("nutrition_plan_id", existingNutrition.id).eq("active", true).maybeSingle();
        if (nutritionVersion) {
          const { count } = await supabase.from("nutrition_meals").select("id", { count: "exact", head: true }).eq("nutrition_plan_version_id", nutritionVersion.id);
          nutritionIsComplete = (count ?? 0) > 0;
        }
      }

      if (workoutIsComplete && nutritionIsComplete) {
        return NextResponse.json({ generated: false, reason: "active_plan_exists" });
      }

      await supabase.from("workout_plans").delete().eq("id", existingPlan.id);
      if (existingNutrition) await supabase.from("nutrition_plans").delete().eq("id", existingNutrition.id);
    }

    const profileWithMealCount = { ...profile, meal_count: body.mealCount ?? profile.meal_count ?? 4 };
    const generatedPlan = generateInitialPlan(parsePlanningProfile(profileWithMealCount), await getPlanningExerciseCatalog());
    const { data: run, error: runError } = await supabase
      .from("plan_generation_runs")
      .insert({
        user_id: authData.user.id,
        run_type: "initial_generation",
        status: "pending",
        input_snapshot: profile,
        engine_version: "rules-v1",
      })
      .select("id")
      .single();

    if (runError || !run) return NextResponse.json({ error: "Unable to start plan generation." }, { status: 500 });

    const { error: decisionError } = await supabase.from("plan_rule_decisions").insert([
      { generation_run_id: run.id, rule_name: "structure_selection", input_data: { days: profile.days_per_week, experience: profile.experience }, output_data: { structure: generatedPlan.structure } },
      { generation_run_id: run.id, rule_name: "nutrition_calculation", input_data: { goal: profile.primary_goal, weight: profile.current_weight_kg, mealCount: generatedPlan.mealCount }, output_data: { calories: generatedPlan.calories, protein: generatedPlan.proteinGrams, carbs: generatedPlan.carbsGrams, fats: generatedPlan.fatsGrams } },
    ]);
    if (decisionError) throw decisionError;

    const { data: workoutPlan, error: workoutPlanError } = await supabase
      .from("workout_plans")
      .insert({ user_id: authData.user.id, name: `Plan ${generatedPlan.structure}`, description: "Plan inicial generado a partir de tu perfil." })
      .select("id")
      .single();
    if (workoutPlanError || !workoutPlan) throw workoutPlanError ?? new Error("Unable to create workout plan.");

    const { data: workoutVersion, error: workoutVersionError } = await supabase
      .from("workout_plan_versions")
      .insert({ workout_plan_id: workoutPlan.id, generation_run_id: run.id, version_number: 1, profile_snapshot: profile, reason: "onboarding" })
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

    const { data: nutritionPlan, error: nutritionPlanError } = await supabase
      .from("nutrition_plans")
      .insert({ user_id: authData.user.id, name: "Orientación nutricional inicial" })
      .select("id")
      .single();
    if (nutritionPlanError || !nutritionPlan) throw nutritionPlanError ?? new Error("Unable to create nutrition plan.");

    const { data: nutritionVersion, error: nutritionVersionError } = await supabase.from("nutrition_plan_versions").insert({
      nutrition_plan_id: nutritionPlan.id,
      generation_run_id: run.id,
      version_number: 1,
      profile_snapshot: profile,
      calories: generatedPlan.calories,
      protein_grams: generatedPlan.proteinGrams,
      carbs_grams: generatedPlan.carbsGrams,
      fats_grams: generatedPlan.fatsGrams,
      meal_count: generatedPlan.mealCount,
      precision_mode: "precise",
      reason: "onboarding",
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
    return NextResponse.json({ generated: true, structure: generatedPlan.structure });
  } catch (error) {
    console.error("Unable to generate initial plan", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to generate initial plan." }, { status: 500 });
  }
}
