import { NextResponse } from "next/server";
import { z } from "zod";

import { cardioRecommendations } from "@/features/planning/cardio";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const completionSchema = z.object({
  sessionKey: z.string().min(1).max(50),
  workoutDayId: z.string().uuid(),
  modality: z.enum(["Cinta", "Elíptica", "Bicicleta", "Remo", "Caminar al aire libre"]),
  durationMinutes: z.number().int().min(5).max(180),
  intensity: z.enum(["Suave", "Moderada", "Intervalos"]),
});

export async function GET() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const db = createAdminClient();
  const { data: profile, error } = await db.from("profiles").select("primary_goal, experience").eq("user_id", auth.user.id).single();
  if (error || !profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const { data: preferences } = await db.from("cardio_preferences").select("session_key, workout_day_id, modality, duration_minutes, intensity, enabled").eq("user_id", auth.user.id);
  return NextResponse.json({ recommendations: cardioRecommendations(profile.primary_goal, profile.experience), preferences: preferences ?? [] });
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = completionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid cardio session." }, { status: 400 });
  const db = createAdminClient();
  const configuration = { user_id: auth.user.id, session_key: parsed.data.sessionKey, workout_day_id: parsed.data.workoutDayId, modality: parsed.data.modality, duration_minutes: parsed.data.durationMinutes, intensity: parsed.data.intensity, enabled: true, updated_at: new Date().toISOString() };
  const { error: preferenceError } = await db.from("cardio_preferences").upsert(configuration, { onConflict: "user_id,session_key" });
  if (preferenceError) return NextResponse.json({ error: "Unable to save cardio configuration." }, { status: 500 });
  return NextResponse.json({ configured: true });
}

export async function DELETE(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = z.object({ sessionKey: z.string().min(1).max(50), workoutDayId: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid cardio configuration." }, { status: 400 });
  const db = createAdminClient();
  const { data: updatedRows, error: updateError } = await db.from("cardio_preferences").update({ enabled: false, updated_at: new Date().toISOString() }).eq("user_id", auth.user.id).eq("session_key", parsed.data.sessionKey).select("id");
  if (updateError) return NextResponse.json({ error: "Unable to remove cardio configuration." }, { status: 500 });
  const result = updatedRows.length > 0
    ? { error: null }
    : await db.from("cardio_preferences").insert({ user_id: auth.user.id, session_key: parsed.data.sessionKey, workout_day_id: parsed.data.workoutDayId, modality: "Bicicleta", duration_minutes: 20, intensity: "Suave", enabled: false });
  const error = result.error;
  if (error) return NextResponse.json({ error: "Unable to remove cardio configuration." }, { status: 500 });
  return NextResponse.json({ removed: true });
}