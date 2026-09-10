import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const onboardingToken = requestUrl.searchParams.get("onboarding_token");

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Unable to exchange Supabase confirmation code", error.message);
      return NextResponse.redirect(new URL(`/login?confirmed=0&error=${encodeURIComponent("No se pudo confirmar el enlace. Solicita un correo nuevo e inténtalo otra vez.")}`, requestUrl.origin));
    }

    if (onboardingToken && sessionData.session?.user.id) {
      const db = createAdminClient();
      const tokenHash = createHash("sha256").update(onboardingToken).digest("hex");
      await db.from("onboarding_sessions").update({ auth_user_id: sessionData.session.user.id }).eq("session_token_hash", tokenHash).in("status", ["completed", "converted"]);
    }
  } else {
    return NextResponse.redirect(new URL(`/login?confirmed=0&error=${encodeURIComponent("El enlace de confirmación está incompleto o ha caducado.")}`, requestUrl.origin));
  }

  const loginUrl = new URL("/login?confirmed=1", requestUrl.origin);
  const response = NextResponse.redirect(loginUrl);
  if (onboardingToken) {
    response.cookies.set("momentum_onboarding_token", onboardingToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }
  return response;
}
