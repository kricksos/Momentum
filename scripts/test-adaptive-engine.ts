import { createClient } from "@supabase/supabase-js";
import { runPlanAdjustment } from "../src/features/planning/adjust";

process.loadEnvFile(new URL("../.env.local", import.meta.url));

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

let passed = 0;
let failed = 0;
function assert(description: string, condition: boolean, details?: unknown) {
  if (condition) { passed += 1; console.log(`  PASS  ${description}`); }
  else { failed += 1; console.log(`  FAIL  ${description}`, details ?? ""); }
}

function daysAgoDate(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

async function createTestUser(suffix: string) {
  const email = `qa-adaptive-${Date.now()}-${suffix}@momentum.test`;
  const { data, error } = await supabase.auth.admin.createUser({ email, password: "Test1234!", email_confirm: true });
  if (error || !data.user) throw error ?? new Error("Unable to create test user.");
  return data.user.id;
}

async function seedProfile(userId: string, goal: string, weightKg: number) {
  await supabase.from("users").insert({ id: userId, email: `${userId}@momentum.test` });
  await supabase.from("profiles").insert({
    user_id: userId, name: "QA Tester", sex: "male", age: 30, height_cm: 178,
    current_weight_kg: weightKg, target_weight_kg: weightKg + 5, primary_goal: goal,
    experience: "Intermedio", daily_activity: "Moderada", sleep_hours: 7, sleep_quality: "buena",
    stress_level: "bajo", days_per_week: 3, session_duration_minutes: 60, training_place: "Gimnasio", meal_count: 3,
  });
}

async function seedWeeklyWeights(userId: string, weeks: number, weightAt: (week: number) => number) {
  const rows = Array.from({ length: weeks }, (_, week) => ({
    user_id: userId,
    measured_at: daysAgoDate(49 - week * 7).slice(0, 10),
    weight_kg: weightAt(week),
  }));
  await supabase.from("body_measurements").insert(rows);
}

async function seedPlans(userId: string, exerciseId: string, foodId: string) {
  const { data: run, error: runError } = await supabase.from("plan_generation_runs").insert({ user_id: userId, run_type: "initial_generation", status: "completed", engine_version: "qa-seed" }).select("id").single();
  if (runError) console.error("seedPlans: run insert error", runError);

  const { data: workoutPlan, error: workoutPlanError } = await supabase.from("workout_plans").insert({ user_id: userId, name: "QA plan" }).select("id").single();
  if (workoutPlanError) console.error("seedPlans: workoutPlan insert error", workoutPlanError);
  const { data: workoutVersion, error: workoutVersionError } = await supabase.from("workout_plan_versions").insert({ workout_plan_id: workoutPlan!.id, generation_run_id: run!.id, version_number: 1, reason: "onboarding" }).select("id").single();
  if (workoutVersionError) console.error("seedPlans: workoutVersion insert error", workoutVersionError);
  const { data: day, error: dayError } = await supabase.from("workout_days").insert({ workout_plan_version_id: workoutVersion!.id, name: "Full Body A", order_number: 1 }).select("id").single();
  if (dayError) console.error("seedPlans: day insert error", dayError);
  const { data: workoutExercise, error: workoutExerciseError } = await supabase.from("workout_exercises").insert({ workout_day_id: day!.id, exercise_id: exerciseId, sets: 3, repetitions: "8-12", rest_seconds: 90, order_number: 1 }).select("id").single();
  if (workoutExerciseError) console.error("seedPlans: workoutExercise insert error", workoutExerciseError);

  const { data: nutritionPlan, error: nutritionPlanError } = await supabase.from("nutrition_plans").insert({ user_id: userId, name: "QA nutrition" }).select("id").single();
  if (nutritionPlanError) console.error("seedPlans: nutritionPlan insert error", nutritionPlanError);
  const { data: nutritionVersion, error: nutritionVersionError } = await supabase.from("nutrition_plan_versions").insert({ nutrition_plan_id: nutritionPlan!.id, generation_run_id: run!.id, version_number: 1, calories: 2500, protein_grams: 160, carbs_grams: 280, fats_grams: 80, meal_count: 3, reason: "onboarding" }).select("id").single();
  if (nutritionVersionError) console.error("seedPlans: nutritionVersion insert error", nutritionVersionError);
  const { data: meal, error: mealError } = await supabase.from("nutrition_meals").insert({ nutrition_plan_version_id: nutritionVersion!.id, name: "Comida única", meal_order: 1, target_calories: 2500 }).select("id").single();
  if (mealError) console.error("seedPlans: meal insert error", mealError);
  const { error: itemsError } = await supabase.from("nutrition_meal_items").insert([
    { meal_id: meal!.id, food_id: foodId, quantity_grams: 200, role: "protein" },
    { meal_id: meal!.id, food_id: foodId, quantity_grams: 300, role: "carbohydrate" },
  ]);
  if (itemsError) console.error("seedPlans: items insert error", itemsError);

  return { workoutPlanId: workoutPlan!.id, workoutDayId: day!.id, workoutExerciseId: workoutExercise!.id, nutritionPlanId: nutritionPlan!.id, mealId: meal!.id };
}

async function seedWorkoutSessions(userId: string, dayId: string, exerciseId: string, topSets: number[]) {
  // topSets is ordered oldest -> newest; one completed session per entry, spaced 3 days apart within the 21-day compliance window.
  for (const [index, weightKg] of topSets.entries()) {
    const completedAt = daysAgoDate((topSets.length - index) * 3);
    const { data: session } = await supabase.from("workout_sessions").insert({ user_id: userId, workout_day_id: dayId, completed: true, completed_at: completedAt }).select("id").single();
    await supabase.from("exercise_logs").insert([
      { workout_session_id: session!.id, exercise_id: exerciseId, weight_kg: weightKg, repetitions: 10, set_number: 1, completed: true },
      { workout_session_id: session!.id, exercise_id: exerciseId, weight_kg: weightKg, repetitions: 10, set_number: 2, completed: true },
    ]);
  }
}

async function seedMealCompletions(userId: string, mealId: string, count: number) {
  const rows = Array.from({ length: count }, (_, index) => ({ user_id: userId, meal_id: mealId, completed_on: daysAgoDate(index + 1).slice(0, 10) }));
  await supabase.from("nutrition_meal_completions").insert(rows);
}

async function cleanup(userId: string) {
  await supabase.from("plan_generation_runs").delete().eq("user_id", userId);
  const { data: sessions } = await supabase.from("workout_sessions").select("id").eq("user_id", userId);
  await supabase.from("exercise_logs").delete().in("workout_session_id", (sessions ?? []).map((session) => session.id));
  await supabase.from("workout_sessions").delete().eq("user_id", userId);
  await supabase.from("body_measurements").delete().eq("user_id", userId);
  await supabase.from("nutrition_meal_completions").delete().eq("user_id", userId);
  await supabase.from("workout_plans").delete().eq("user_id", userId); // cascades versions/days/exercises
  await supabase.from("nutrition_plans").delete().eq("user_id", userId); // cascades versions/meals/items
  await supabase.from("profiles").delete().eq("user_id", userId);
  await supabase.from("users").delete().eq("id", userId);
  await supabase.auth.admin.deleteUser(userId);
}

async function pickCatalogIds() {
  const { data: exercise } = await supabase.from("exercises").select("id").limit(1).single();
  const { data: food } = await supabase.from("foods_catalog").select("id").limit(1).single();
  if (!exercise || !food) throw new Error("Catalog seed data (exercises/foods_catalog) is missing.");
  return { exerciseId: exercise.id as string, foodId: food.id as string };
}

async function scenarioStagnantEverything(exerciseId: string, foodId: string) {
  console.log("\n=== Escenario 1: dieta estancada (ganar masa) + ejercicio en meseta + buen cumplimiento ===");
  const userId = await createTestUser("s1");
  try {
    await seedProfile(userId, "Ganar masa muscular", 80);
    await seedWeeklyWeights(userId, 8, () => 80); // flat for 8 weeks -> stagnant + long-term stagnant
    const { workoutDayId, mealId } = await seedPlans(userId, exerciseId, foodId);
    await seedWorkoutSessions(userId, workoutDayId, exerciseId, [48, 49, 50, 50, 50, 50]); // last 3 identical -> plateau
    await seedMealCompletions(userId, mealId, 15); // 15/21 days ~ 71% compliance

    const result = await runPlanAdjustment(userId);
    console.log("  resultado:", JSON.stringify(result));
    assert("ajusta el plan (adjusted = true)", result.adjusted === true, result);
    assert("ajusta la dieta", "nutritionAdjusted" in result && result.nutritionAdjusted === true, result);
    assert("ajusta el entrenamiento", "workoutAdjusted" in result && result.workoutAdjusted === true, result);
    assert("sube las calorías un 8% (estancamiento largo) -> 2700 kcal", "calories" in result && result.calories === 2700, result);
    assert("el ejercicio estancado pasa a acción 'add_set' (nivel 0->1)", "exerciseActions" in result && Object.values(result.exerciseActions)[0] === "add_set", result);

    const { data: newWorkoutExercise } = await supabase.from("workout_exercises").select("id, workout_day_id, sets, progression_level").eq("exercise_id", exerciseId).order("created_at", { ascending: false }).limit(1).single();
    assert("el ejercicio en la nueva versión tiene una serie más (4)", newWorkoutExercise?.sets === 4, newWorkoutExercise);
    assert("el nivel de progresión sube a 1", newWorkoutExercise?.progression_level === 1, newWorkoutExercise);

    // Los workout_day_id cambian al versionar, así que para seguir viendo estancamiento (y mantener el cumplimiento >= 60%) hay que registrar nuevas sesiones bajo el día ya ajustado.
    console.log("  -> Registrando 6 sesiones más (mismo peso/reps) bajo la rutina ya ajustada, para comprobar que la escalera sube de nivel (1 -> cambio de rango de reps) ...");
    await seedWorkoutSessions(userId, newWorkoutExercise!.workout_day_id, exerciseId, [50, 50, 50, 50, 50, 50]);
    const secondRun = await runPlanAdjustment(userId);
    console.log("  resultado (2ª pasada):", JSON.stringify(secondRun));
    assert("en la 2ª pasada, el ejercicio ya no suma otra serie sino que cambia el rango de reps", "exerciseActions" in secondRun && Object.values(secondRun.exerciseActions)[0] === "change_rep_range", secondRun);
  } finally {
    await cleanup(userId);
  }
}

async function scenarioOnTrack(exerciseId: string, foodId: string) {
  console.log("\n=== Escenario 2: todo progresando bien -> no debería tocar nada ===");
  const userId = await createTestUser("s2");
  try {
    await seedProfile(userId, "Ganar masa muscular", 80);
    await seedWeeklyWeights(userId, 4, (week) => 80 + week * 0.3); // steady gain
    const { workoutDayId, mealId } = await seedPlans(userId, exerciseId, foodId);
    await seedWorkoutSessions(userId, workoutDayId, exerciseId, [48, 49, 50, 51, 52, 53]); // improving every session
    await seedMealCompletions(userId, mealId, 15);

    const result = await runPlanAdjustment(userId);
    console.log("  resultado:", JSON.stringify(result));
    assert("no ajusta nada (adjusted = false)", result.adjusted === false, result);
    assert("razón: on_track", "reason" in result && result.reason === "on_track", result);
  } finally {
    await cleanup(userId);
  }
}

async function scenarioLowCompliance(exerciseId: string, foodId: string) {
  console.log("\n=== Escenario 3: peso estancado pero sin seguir apenas el plan -> no debería ajustar, debe pedir constancia ===");
  const userId = await createTestUser("s3");
  try {
    await seedProfile(userId, "Ganar masa muscular", 80);
    await seedWeeklyWeights(userId, 8, () => 80); // flat -> would be stagnant
    const { workoutDayId, mealId } = await seedPlans(userId, exerciseId, foodId);
    await seedWorkoutSessions(userId, workoutDayId, exerciseId, [50]); // barely any sessions
    await seedMealCompletions(userId, mealId, 2); // barely any completions

    const result = await runPlanAdjustment(userId);
    console.log("  resultado:", JSON.stringify(result));
    assert("no ajusta nada (adjusted = false)", result.adjusted === false, result);
    assert("razón: low_compliance", "reason" in result && result.reason === "low_compliance", result);
  } finally {
    await cleanup(userId);
  }
}

async function main() {
  const { exerciseId, foodId } = await pickCatalogIds();
  await scenarioStagnantEverything(exerciseId, foodId);
  await scenarioOnTrack(exerciseId, foodId);
  await scenarioLowCompliance(exerciseId, foodId);

  console.log(`\n${passed} verificaciones OK, ${failed} fallidas.\n`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Error ejecutando el test de integración:", error);
  process.exitCode = 1;
});
