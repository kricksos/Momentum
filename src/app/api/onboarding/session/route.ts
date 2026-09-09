import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const sessionToken = randomBytes(32).toString("hex");
  const sessionTokenHash = createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("onboarding_sessions")
      .insert({ session_token_hash: sessionTokenHash })
      .select("id, expires_at")
      .single();

    if (error) {
      console.error("Unable to create onboarding session", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: "Unable to create onboarding session." },
        { status: 500 },
      );
    }

    const response = NextResponse.json(
      {
        sessionId: data.id,
        sessionToken,
        expiresAt: data.expires_at,
      },
      { status: 201 },
    );
    response.cookies.set("momentum_onboarding_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Supabase server credentials are not configured." },
      { status: 503 },
    );
  }
}
