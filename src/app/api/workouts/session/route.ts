import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { computeStreaks } from "@/features/gamification/xp";
import { trackAnalyticsEvent } from "@/lib/analytics";

const startSchema = z.object({ action: z.literal("start"), workoutDayId: z.string().uuid() });
const completeSchema = z.object({
  action: z.literal("complete"),
  sessionId: z.string().uuid(),
  durationMinutes: z.number().int().min(1).max(600),
  logs: z.array(z.object({ exerciseId: z.string().uuid(), setNumber: z.number().int().positive(), weightKg: z.number().min(0), repetitions: z.number().int().min(0) })),
});
const saveSchema = z.object({
  action: z.literal("save"),
  sessionId: z.string().uuid(),
  logs: z.array(z.object({ exerciseId: z.string().uuid(), setNumber: z.number().int().positive(), weightKg: z.number().min(0), repetitions: z.number().int().min(0) })),
});
const requestSchema = z.discriminatedUnion("action", [startSchema, saveSchema, completeSchema]);

async function userOwnsWorkoutDay(client: ReturnType<typeof createAdminClient>, userId: string, workoutDayId: string) {
  const { data: day } = await client.from("workout_days").select("workout_plan_version_id").eq("id", workoutDayId).single();
  const { data: version } = day ? await client.from("workout_plan_versions").select("workout_plan_id").eq("id", day.workout_plan_version_id).single() : { data: null };
  const { data: plan } = version ? await client.from("workout_plans").select("user_id").eq("id", version.workout_plan_id).single() : { data: null };
  return plan?.user_id === userId;
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid workout request." }, { status: 400 });
  const client = createAdminClient();

  try {
    if (parsed.data.action === "start") {
      const ownsDay = await userOwnsWorkoutDay(client, authData.user.id, parsed.data.workoutDayId);
      if (!ownsDay) return NextResponse.json({ error: "Workout is not available for this user." }, { status: 403 });
      const { data: completedDaySession } = await client.from("workout_sessions").select("completed_at").eq("user_id", authData.user.id).eq("workout_day_id", parsed.data.workoutDayId).eq("completed", true).order("completed_at", { ascending: false }).limit(1).maybeSingle();
      if (completedDaySession?.completed_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)) {
        return NextResponse.json({ error: "Este día de entrenamiento ya está completado hoy." }, { status: 409 });
      }
      const { data: session, error } = await client.from("workout_sessions").insert({ user_id: authData.user.id, workout_day_id: parsed.data.workoutDayId }).select("id, started_at").single();
      if (error || !session) throw error ?? new Error("Unable to start workout.");
      void trackAnalyticsEvent(authData.user.id, "workout_started");
      return NextResponse.json({ sessionId: session.id, startedAt: session.started_at });
    }

    const { data: session } = await client.from("workout_sessions").select("id, user_id, completed").eq("id", parsed.data.sessionId).single();
    if (!session || session.user_id !== authData.user.id || session.completed) return NextResponse.json({ error: "Workout session is not available." }, { status: 403 });
    const { error: logsError } = await client.from("exercise_logs").upsert(parsed.data.logs.map((log) => ({ workout_session_id: session.id, exercise_id: log.exerciseId, weight_kg: log.weightKg, repetitions: log.repetitions, set_number: log.setNumber, completed: true })), { onConflict: "workout_session_id,exercise_id,set_number" });
    if (logsError) throw logsError;
    if (parsed.data.action === "save") return NextResponse.json({ saved: true });
    const { error: completeError } = await client.from("workout_sessions").update({ completed: true, completed_at: new Date().toISOString(), duration_minutes: parsed.data.durationMinutes }).eq("id", session.id);
    if (completeError) throw completeError;

    const exerciseIds = [...new Set(parsed.data.logs.map((log) => log.exerciseId))];
    const currentBestByExercise = new Map<string, number>();
    for (const log of parsed.data.logs) currentBestByExercise.set(log.exerciseId, Math.max(currentBestByExercise.get(log.exerciseId) ?? 0, log.weightKg));
    const { data: previousSessions } = await client.from("workout_sessions").select("id").eq("user_id", authData.user.id).eq("completed", true).neq("id", session.id);
    const previousSessionIds = (previousSessions ?? []).map((previousSession) => previousSession.id);
    const { data: previousLogs } = previousSessionIds.length && exerciseIds.length
      ? await client.from("exercise_logs").select("exercise_id, weight_kg").in("workout_session_id", previousSessionIds).in("exercise_id", exerciseIds).eq("completed", true)
      : { data: [] };
    const previousBestByExercise = new Map<string, number>();
    for (const log of previousLogs ?? []) previousBestByExercise.set(log.exercise_id, Math.max(previousBestByExercise.get(log.exercise_id) ?? 0, log.weight_kg ?? 0));
    const recordExerciseIds = exerciseIds.filter((exerciseId) => (previousBestByExercise.get(exerciseId) ?? 0) > 0 && (currentBestByExercise.get(exerciseId) ?? 0) > (previousBestByExercise.get(exerciseId) ?? 0));
    const { data: completedSessions } = await client.from("workout_sessions").select("completed_at").eq("user_id", authData.user.id).eq("completed", true);
    const streak = computeStreaks((completedSessions ?? []).map((completedSession) => completedSession.completed_at?.slice(0, 10)).filter((date): date is string => Boolean(date)));
    void trackAnalyticsEvent(authData.user.id, "workout_completed", { duration_minutes: parsed.data.durationMinutes });

    return NextResponse.json({ completed: true, recordExerciseIds, streak: streak.current });
  } catch (error) {
    console.error("Unable to manage workout session", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to save workout session." }, { status: 500 });
  }
}
