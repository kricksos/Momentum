import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const slots = ["breakfast", "mid_morning", "lunch", "afternoon_snack", "dinner"] as const;
const requestSchema = z.object({ slots: z.array(z.enum(slots)) });

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sameSet(left: string[], right: string[]) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

export async function PATCH(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid meal slots." }, { status: 400 });

  const db = createAdminClient();
  const [{ data: profile, error: profileError }, { data: nutritionPlan }] = await Promise.all([
    db.from("profiles").select("food_restrictions").eq("user_id", auth.user.id).single(),
    db.from("nutrition_plans").select("id").eq("user_id", auth.user.id).eq("active", true).maybeSingle(),
  ]);
  if (profileError || !profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { data: activeVersion } = nutritionPlan
    ? await db.from("nutrition_plan_versions").select("profile_snapshot").eq("nutrition_plan_id", nutritionPlan.id).eq("active", true).maybeSingle()
    : { data: null };
  const snapshot = activeVersion?.profile_snapshot as Record<string, unknown> | null;
  const nutritionReviewNeeded = !sameSet(stringArray(snapshot?.food_restrictions), stringArray(profile.food_restrictions));
  const { error: updateError } = await db.from("profiles").update({ meals_out_slots: parsed.data.slots, nutrition_plan_review_needed: nutritionReviewNeeded, updated_at: new Date().toISOString() }).eq("user_id", auth.user.id);
  if (updateError) return NextResponse.json({ error: "Unable to save meal slots." }, { status: 500 });

  return NextResponse.json({ saved: true });
}