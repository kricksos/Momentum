import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const checks = {
    supabase: false,
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };

  try {
    const db = createAdminClient();
    const { error } = await db.from("profiles").select("id").limit(1);
    checks.supabase = !error;
  } catch {
    checks.supabase = false;
  }

  const healthy = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok: healthy, checks }, { status: healthy ? 200 : 503 });
}