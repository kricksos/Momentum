import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const checkinSchema = z.object({
  energyScore: z.number().int().min(1).max(5),
  sleepScore: z.number().int().min(1).max(5),
  stressScore: z.number().int().min(1).max(5),
  sorenessScore: z.number().int().min(1).max(5),
  trainingAdherence: z.enum(["low", "medium", "high"]),
  nutritionAdherence: z.enum(["low", "medium", "high"]),
  painPresent: z.boolean(),
  painArea: z.string().trim().min(2).max(120).optional(),
  painSeverity: z.number().int().min(1).max(10).optional(),
  notes: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  if (value.painPresent && (!value.painArea || value.painSeverity === undefined)) {
    context.addIssue({ code: "custom", message: "Pain details are required when pain is reported." });
  }
  if (!value.painPresent && (value.painArea || value.painSeverity !== undefined)) {
    context.addIssue({ code: "custom", message: "Pain details are not allowed when pain is not reported." });
  }
});

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = checkinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa las respuestas del check-in." }, { status: 400 });

  const db = createAdminClient();
  const values = parsed.data;

  if (values.painPresent) {
    const { data: consent } = await db
      .from("user_consents")
      .select("accepted")
      .eq("user_id", auth.user.id)
      .eq("consent_type", "health_data")
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!consent?.accepted) {
      return NextResponse.json({ error: "Activa el consentimiento de datos de salud para guardar una molestia." }, { status: 403 });
    }
  }

  const { data, error } = await db
    .from("progress_checkins")
    .upsert({
      user_id: auth.user.id,
      checked_in_at: new Date().toISOString().slice(0, 10),
      energy_score: values.energyScore,
      sleep_score: values.sleepScore,
      stress_score: values.stressScore,
      soreness_score: values.sorenessScore,
      training_adherence: values.trainingAdherence,
      nutrition_adherence: values.nutritionAdherence,
      pain_present: values.painPresent,
      pain_area: values.painArea ?? null,
      pain_severity: values.painSeverity ?? null,
      notes: values.notes || null,
      questionnaire_version: "1.0",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,checked_in_at" })
    .select("checked_in_at, energy_score, sleep_score, stress_score, soreness_score, training_adherence, nutrition_adherence, pain_present, pain_area, pain_severity, notes")
    .single();

  if (error) {
    console.error("Unable to save progress check-in", error.message);
    return NextResponse.json({ error: "No hemos podido guardar tu check-in." }, { status: 500 });
  }

  return NextResponse.json({ saved: true, checkin: data });
}
