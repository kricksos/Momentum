import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackAnalyticsEvent } from "@/lib/analytics";

const measurementSchema = z.object({
  weightKg: z.number().min(20).max(400),
  measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  waistCm: z.number().positive().max(300).optional(),
  chestCm: z.number().positive().max(300).optional(),
  armCm: z.number().positive().max(100).optional(),
  thighCm: z.number().positive().max(150).optional(),
  bodyFatPercentage: z.number().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = measurementSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid measurement." }, { status: 400 });

  const measuredAt = parsed.data.measuredAt ?? new Date().toISOString().slice(0, 10);

  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase.from("body_measurements").select("id, waist_cm, chest_cm, arm_cm, thigh_cm, body_fat_percentage").eq("user_id", authData.user.id).eq("measured_at", measuredAt).maybeSingle();

    const row = {
      user_id: authData.user.id,
      measured_at: measuredAt,
      weight_kg: parsed.data.weightKg,
      waist_cm: parsed.data.waistCm ?? existing?.waist_cm ?? null,
      chest_cm: parsed.data.chestCm ?? existing?.chest_cm ?? null,
      arm_cm: parsed.data.armCm ?? existing?.arm_cm ?? null,
      thigh_cm: parsed.data.thighCm ?? existing?.thigh_cm ?? null,
      body_fat_percentage: parsed.data.bodyFatPercentage ?? existing?.body_fat_percentage ?? null,
    };

    const { error } = existing
      ? await supabase.from("body_measurements").update(row).eq("id", existing.id)
      : await supabase.from("body_measurements").insert(row);
    if (error) throw error;

    await supabase.from("profiles").update({ current_weight_kg: parsed.data.weightKg }).eq("user_id", authData.user.id);
    void trackAnalyticsEvent(authData.user.id, "weight_logged");

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to save body measurement", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to save measurement." }, { status: 500 });
  }
}
