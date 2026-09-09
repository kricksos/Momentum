import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({ source: z.enum(["manual", "copy", "history"]), planId: z.string().uuid().optional() });

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid workout source." }, { status: 400 });

  const db = createAdminClient();
  try {
    if (parsed.data.source === "history" && !parsed.data.planId) return NextResponse.json({ error: "Selecciona una rutina anterior." }, { status: 400 });
    const source = parsed.data.source === "manual" ? "manual" : "copied";
    const { data: draft, error: draftError } = await db
      .from("manual_workout_drafts")
      .insert({ user_id: auth.user.id, name: source === "copied" ? "Copia de mi rutina" : "Mi rutina", source })
      .select("id")
      .single();
    if (draftError || !draft) throw draftError ?? new Error("Unable to create draft.");

    if (parsed.data.source !== "manual") {
      const planQuery = db.from("workout_plans").select("id, name").eq("user_id", auth.user.id);
      const { data: plan } = parsed.data.source === "copy"
        ? await planQuery.eq("active", true).maybeSingle()
        : await planQuery.eq("id", parsed.data.planId as string).eq("active", false).maybeSingle();
      if (!plan) return NextResponse.json({ error: "La rutina seleccionada ya no está disponible." }, { status: 404 });
      await db.from("manual_workout_drafts").update({ name: `Copia de ${plan.name}` }).eq("id", draft.id);
      const { data: version } = plan ? await db.from("workout_plan_versions").select("id").eq("workout_plan_id", plan.id).eq("active", true).maybeSingle() : { data: null };
      const { data: days } = version ? await db.from("workout_days").select("id, name, order_number").eq("workout_plan_version_id", version.id).order("order_number") : { data: [] };
      if (!days?.length) return NextResponse.json({ draftId: draft.id });

      const { data: draftDays, error: daysError } = await db.from("manual_workout_draft_days").insert(days.map((day) => ({ draft_id: draft.id, name: day.name, order_number: day.order_number }))).select("id, order_number");
      if (daysError || !draftDays) throw daysError ?? new Error("Unable to copy workout days.");
      const draftDayByOrder = new Map(draftDays.map((day) => [day.order_number, day.id]));
      const exercisesByDay = await Promise.all(days.map(async (day) => ({ order: day.order_number, rows: (await db.from("workout_exercises").select("exercise_id, sets, repetitions, rest_seconds, order_number").eq("workout_day_id", day.id).order("order_number")).data ?? [] })));
      const copiedExercises = exercisesByDay.flatMap(({ order, rows }) => rows.map((exercise) => ({ draft_day_id: draftDayByOrder.get(order)!, exercise_id: exercise.exercise_id, sets: exercise.sets, repetitions: exercise.repetitions, rest_seconds: exercise.rest_seconds, order_number: exercise.order_number })));
      if (copiedExercises.length) {
        const { error: exercisesError } = await db.from("manual_workout_draft_exercises").insert(copiedExercises);
        if (exercisesError) throw exercisesError;
      }
    }

    return NextResponse.json({ draftId: draft.id });
  } catch (error) {
    console.error("Unable to create manual workout draft", error);
    return NextResponse.json({ error: "Unable to create workout draft." }, { status: 500 });
  }
}