import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const bindSchema = z.object({
  sessionToken: z.string().min(32),
  userId: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = bindSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid onboarding binding." }, { status: 400 });

  try {
    const db = createAdminClient();
    const tokenHash = createHash("sha256").update(parsed.data.sessionToken).digest("hex");
    const { data: user, error: userError } = await db.auth.admin.getUserById(parsed.data.userId);
    if (userError || !user.user) return NextResponse.json({ error: "User was not found." }, { status: 404 });

    const { data, error } = await db
      .from("onboarding_sessions")
      .update({ auth_user_id: parsed.data.userId })
      .eq("session_token_hash", tokenHash)
      .in("status", ["completed", "converted"])
      .gt("expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();

    if (error || !data) return NextResponse.json({ error: "Onboarding session was not found or expired." }, { status: 404 });
    return NextResponse.json({ bound: true });
  } catch {
    return NextResponse.json({ error: "Unable to bind onboarding session." }, { status: 503 });
  }
}