import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const completeSchema = z.object({
  sessionToken: z.string().min(32),
});

export async function POST(request: Request) {
  const parsedBody = completeSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid onboarding session." }, { status: 400 });
  }

  const sessionTokenHash = createHash("sha256")
    .update(parsedBody.data.sessionToken)
    .digest("hex");

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("onboarding_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("session_token_hash", sessionTokenHash)
      .eq("status", "active")
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Unable to complete onboarding session." }, { status: 500 });
    }

    return NextResponse.json({ completed: true });
  } catch {
    return NextResponse.json({ error: "Supabase server credentials are not configured." }, { status: 503 });
  }
}
