import { NextResponse } from "next/server";

import { generateInitialPlan, parsePlanningProfile } from "@/features/planning/engine";
import { getPlanningExerciseCatalog } from "@/lib/exercise-catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const db = createAdminClient();
    const { data: profile, error: profileError } = await db.from("profiles").select("*").eq("user_id", auth.user.id).single();
    if (profileError || !profile) return NextResponse.json({ error: "Complete your profile first." }, { status: 400 });

    const { data: workoutPlan } = await db.from("workout_plans").select("id").eq("user_id", auth.user.id).eq("active", true).maybeSingle();
    if (!workoutPlan) return NextResponse.json({ error: "No active workout plan found." }, { status: 400 });
    const [{ data: previousVersion }, { data: latestVersion }] = await Promise.all([
      db.from("workout_plan_versions").select("id").eq("workout_plan_id", workoutPlan.id).eq("active", true).maybeSingle(),
      db.from("workout_plan_versions").select("version_number").eq("workout_plan_id", workoutPlan.id).order("version_number", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const generatedPlan = generateInitialPlan(parsePlanningProfile(profile), await getPlanningExerciseCatalog());
    const { data: run, error: runError } = await db.from("plan_generation_runs").insert({ user_id: auth.user.id, run_type: "manual_regeneration", status: "pending", input_snapshot: profile, engine_version: "rules-v1" }).select("id").single();
    if (runError || !run) throw runError ?? new Error("Unable to start workout generation.");

    const { data: version, error: versionError } = await db.from("workout_plan_versions").insert({ workout_plan_id: workoutPlan.id, generation_run_id: run.id, version_number: (latestVersion?.version_number ?? 0) + 1, profile_snapshot: profile, reason: "injury_change", active: false }).select("id").single();
    if (versionError || !version) throw versionError ?? new Error("Unable to create workout version.");

    const exerciseNames = [...new Set(generatedPlan.days.flatMap((day) => day.exercises.map((exercise) => exercise.name)))];
    const { data: exercises, error: exercisesError } = await db.from("exercises").select("id, name").in("name", exerciseNames);
    if (exercisesError || !exercises) throw exercisesError ?? new Error("Exercise catalog is unavailable.");
    const exerciseByName = new Map(exercises.map((exercise) => [exercise.name, exercise.id]));

    for (const [dayIndex, day] of generatedPlan.days.entries()) {
      const { data: savedDay, error: dayError } = await db.from("workout_days").insert({ workout_plan_version_id: version.id, name: day.name, order_number: dayIndex + 1 }).select("id").single();
      if (dayError || !savedDay) throw dayError ?? new Error("Unable to create workout day.");
      const exercisesToInsert = day.exercises.map((exercise, exerciseIndex) => ({ workout_day_id: savedDay.id, exercise_id: exerciseByName.get(exercise.name)!, sets: exercise.sets, repetitions: exercise.repetitions, rest_seconds: exercise.restSeconds, order_number: exerciseIndex + 1 }));
      if (exercisesToInsert.some((exercise) => !exercise.exercise_id)) throw new Error("Generated exercise is missing from catalog.");
      const { error: insertError } = await db.from("workout_exercises").insert(exercisesToInsert);
      if (insertError) throw insertError;
    }

    if (previousVersion) {
      const { error: deactivateError } = await db.from("workout_plan_versions").update({ active: false }).eq("id", previousVersion.id);
      if (deactivateError) throw deactivateError;
    }
    const { error: activateError } = await db.from("workout_plan_versions").update({ active: true }).eq("id", version.id);
    if (activateError) throw activateError;
    await db.from("plan_generation_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", run.id);
    await db.from("profiles").update({ workout_plan_review_needed: false }).eq("user_id", auth.user.id);
    return NextResponse.json({ regenerated: true, type: "workout" });
  } catch (error) {
    console.error("Unable to regenerate workout", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to regenerate workout." }, { status: 500 });
  }
}