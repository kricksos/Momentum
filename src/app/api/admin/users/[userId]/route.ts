import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminUser } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  primaryGoal: z.string().trim().min(1).max(120).optional(),
  dietPreference: z.string().trim().min(1).max(60).optional(),
  targetWeightKg: z.number().min(20).max(400).nullable().optional(),
  subscriptionPlan: z.enum(["free", "monthly", "quarterly", "annual", "starter", "pro", "elite"]).optional(),
  subscriptionStatus: z.enum(["pending", "active", "paused", "cancelled"]).optional(),
});

type RouteContext = { params: Promise<{ userId: string }> };

function getRenewalDate(plan: string, startedAt: Date) {
  const renewal = new Date(startedAt);
  if (plan === "monthly" || plan === "starter") renewal.setUTCMonth(renewal.getUTCMonth() + 1);
  if (plan === "quarterly" || plan === "pro") renewal.setUTCMonth(renewal.getUTCMonth() + 3);
  if (plan === "annual" || plan === "elite") renewal.setUTCFullYear(renewal.getUTCFullYear() + 1);
  return plan === "free" ? null : renewal.toISOString();
}

export async function PATCH(request: Request, context: RouteContext) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { userId } = await context.params;
  if (!z.string().uuid().safeParse(userId).success) return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });

  try {
    const db = createAdminClient();
    const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = { updated_at: new Date().toISOString() };
    if (parsed.data.name !== undefined) profileUpdate.name = parsed.data.name;
    if (parsed.data.primaryGoal !== undefined) profileUpdate.primary_goal = parsed.data.primaryGoal;
    if (parsed.data.dietPreference !== undefined) profileUpdate.diet_preference = parsed.data.dietPreference;
    if (parsed.data.targetWeightKg !== undefined) profileUpdate.target_weight_kg = parsed.data.targetWeightKg;
    if (parsed.data.subscriptionPlan !== undefined) {
      const startedAt = new Date();
      profileUpdate.subscription_plan = parsed.data.subscriptionPlan;
      profileUpdate.subscription_status = "active";
      profileUpdate.subscription_started_at = startedAt.toISOString();
      profileUpdate.subscription_renews_at = getRenewalDate(parsed.data.subscriptionPlan, startedAt);
      profileUpdate.subscription_auto_renew = parsed.data.subscriptionPlan !== "free";
    } else if (parsed.data.subscriptionStatus !== undefined) {
      profileUpdate.subscription_status = parsed.data.subscriptionStatus;
    }

    const { error: profileError } = await db.from("profiles").update(profileUpdate).eq("user_id", userId);
    if (profileError) throw profileError;

    const { error: auditError } = await db.from("audit_events").insert({
      user_id: userId,
      entity_type: "profile",
      entity_id: userId,
      action: "update",
      metadata: { actor_user_id: auth.user.id, actor_email: auth.user.email, source: "admin_panel", fields: Object.keys(parsed.data) },
    });
    if (auditError) throw auditError;

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to update user profile from admin", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to update user profile." }, { status: 500 });
  }
}
