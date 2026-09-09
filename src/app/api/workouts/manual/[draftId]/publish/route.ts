import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ draftId: string }> };

export async function POST(_: Request, { params }: Context) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { draftId } = await params;
  const db = createAdminClient();
  try {
    const { data: draft } = await db.from("manual_workout_drafts").select("id, name, source").eq("id", draftId).eq("user_id", auth.user.id).single();
    if (!draft) return NextResponse.json({ error: "Workout draft not found." }, { status: 404 });
    const { data: draftDays } = await db.from("manual_workout_draft_days").select("id, name, order_number").eq("draft_id", draft.id).order("order_number");
    if (!draftDays?.length) return NextResponse.json({ error: "Añade al menos un día a tu rutina." }, { status: 400 });
    const { data: draftExercises } = await db.from("manual_workout_draft_exercises").select("draft_day_id, exercise_id, sets, repetitions, rest_seconds, order_number").in("draft_day_id", draftDays.map((day) => day.id)).order("order_number");
    if (!draftExercises?.length || draftDays.some((day) => !draftExercises.some((exercise) => exercise.draft_day_id === day.id))) return NextResponse.json({ error: "Cada día debe tener al menos un ejercicio." }, { status: 400 });

    const { data: profile } = await db.from("profiles").select("*").eq("user_id", auth.user.id).single();
    if (!profile) return NextResponse.json({ error: "Complete your profile first." }, { status: 400 });
    const { data: run, error: runError } = await db.from("plan_generation_runs").insert({ user_id: auth.user.id, run_type: "manual_regeneration", status: "pending", input_snapshot: profile, engine_version: "manual-builder-v1" }).select("id").single();
    if (runError || !run) throw runError ?? new Error("Unable to create manual routine.");
    const { data: plan, error: planError } = await db.from("workout_plans").insert({ user_id: auth.user.id, name: draft.name, description: "Rutina creada y personalizada por ti.", source: draft.source, active: false }).select("id").single();
    if (planError || !plan) throw planError ?? new Error("Unable to publish workout plan.");
    const { data: version, error: versionError } = await db.from("workout_plan_versions").insert({ workout_plan_id: plan.id, generation_run_id: run.id, version_number: 1, profile_snapshot: profile, reason: "goal_change" }).select("id").single();
    if (versionError || !version) throw versionError ?? new Error("Unable to publish workout version.");
    for (const day of draftDays) {
      const { data: savedDay, error: dayError } = await db.from("workout_days").insert({ workout_plan_version_id: version.id, name: day.name, order_number: day.order_number }).select("id").single();
      if (dayError || !savedDay) throw dayError ?? new Error("Unable to publish workout day.");
      const exercises = draftExercises.filter((exercise) => exercise.draft_day_id === day.id).map((exercise) => ({ workout_day_id: savedDay.id, exercise_id: exercise.exercise_id, sets: exercise.sets, repetitions: exercise.repetitions, rest_seconds: exercise.rest_seconds, order_number: exercise.order_number }));
      const { error: exercisesError } = await db.from("workout_exercises").insert(exercises);
      if (exercisesError) throw exercisesError;
    }
    const { error: archiveError } = await db.from("workout_plans").update({ active: false, updated_at: new Date().toISOString() }).eq("user_id", auth.user.id).eq("active", true);
    if (archiveError) throw archiveError;
    const { error: activateError } = await db.from("workout_plans").update({ active: true, updated_at: new Date().toISOString() }).eq("id", plan.id);
    if (activateError) throw activateError;
    await db.from("plan_generation_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", run.id);
    return NextResponse.json({ published: true });
  } catch (error) {
    console.error("Unable to publish manual workout", error);
    return NextResponse.json({ error: "No hemos podido activar tu rutina. Inténtalo de nuevo." }, { status: 500 });
  }
}