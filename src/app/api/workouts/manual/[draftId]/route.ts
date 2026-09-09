import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const draftSchema = z.object({
  name: z.string().trim().min(1).max(80),
  days: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(80),
    exercises: z.array(z.object({ exerciseId: z.string().uuid(), sets: z.number().int().min(1).max(20), repetitions: z.string().trim().min(1).max(30), restSeconds: z.number().int().min(0).max(900) })).min(1).max(12),
  })).min(1).max(7),
});

type Context = { params: Promise<{ draftId: string }> };

async function draftForUser(db: ReturnType<typeof createAdminClient>, draftId: string, userId: string) {
  const { data: draft } = await db.from("manual_workout_drafts").select("id, name, source").eq("id", draftId).eq("user_id", userId).single();
  return draft;
}

export async function GET(_: Request, { params }: Context) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { draftId } = await params;
  const db = createAdminClient();
  const draft = await draftForUser(db, draftId, auth.user.id);
  if (!draft) return NextResponse.json({ error: "Workout draft not found." }, { status: 404 });
  const { data: days } = await db.from("manual_workout_draft_days").select("id, name, order_number").eq("draft_id", draft.id).order("order_number");
  const dayIds = (days ?? []).map((day) => day.id);
  const { data: exercises } = dayIds.length ? await db.from("manual_workout_draft_exercises").select("draft_day_id, exercise_id, sets, repetitions, rest_seconds, order_number").in("draft_day_id", dayIds).order("order_number") : { data: [] };
  return NextResponse.json({ draft: { ...draft, days: (days ?? []).map((day) => ({ id: day.id, name: day.name, exercises: (exercises ?? []).filter((exercise) => exercise.draft_day_id === day.id).map((exercise) => ({ exerciseId: exercise.exercise_id, sets: exercise.sets, repetitions: exercise.repetitions, restSeconds: exercise.rest_seconds })) })) } });
}

export async function PATCH(request: Request, { params }: Context) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = draftSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "La rutina necesita al menos un día con un ejercicio." }, { status: 400 });
  const { draftId } = await params;
  const db = createAdminClient();
  const draft = await draftForUser(db, draftId, auth.user.id);
  if (!draft) return NextResponse.json({ error: "Workout draft not found." }, { status: 404 });

  const { error: updateError } = await db.from("manual_workout_drafts").update({ name: parsed.data.name, updated_at: new Date().toISOString() }).eq("id", draft.id);
  if (updateError) return NextResponse.json({ error: "Unable to save workout draft." }, { status: 500 });
  const { error: deleteError } = await db.from("manual_workout_draft_days").delete().eq("draft_id", draft.id);
  if (deleteError) return NextResponse.json({ error: "Unable to save workout days." }, { status: 500 });
  const { data: days, error: daysError } = await db.from("manual_workout_draft_days").insert(parsed.data.days.map((day, index) => ({ draft_id: draft.id, name: day.name, order_number: index + 1 }))).select("id, order_number");
  if (daysError || !days) return NextResponse.json({ error: "Unable to save workout days." }, { status: 500 });
  const draftDayByOrder = new Map(days.map((day) => [day.order_number, day.id]));
  const exercises = parsed.data.days.flatMap((day, dayIndex) => day.exercises.map((exercise, exerciseIndex) => ({ draft_day_id: draftDayByOrder.get(dayIndex + 1)!, exercise_id: exercise.exerciseId, sets: exercise.sets, repetitions: exercise.repetitions, rest_seconds: exercise.restSeconds, order_number: exerciseIndex + 1 })));
  const { error: exercisesError } = await db.from("manual_workout_draft_exercises").insert(exercises);
  if (exercisesError) return NextResponse.json({ error: "Unable to save workout exercises." }, { status: 500 });
  return NextResponse.json({ saved: true });
}