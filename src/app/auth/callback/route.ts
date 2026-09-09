import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Unable to exchange Supabase confirmation code", error.message);
      return NextResponse.redirect(new URL(`/login?confirmed=0&error=${encodeURIComponent("No se pudo confirmar el enlace. Solicita un correo nuevo e inténtalo otra vez.")}`, requestUrl.origin));
    }
  } else {
    return NextResponse.redirect(new URL(`/login?confirmed=0&error=${encodeURIComponent("El enlace de confirmación está incompleto o ha caducado.")}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/login?confirmed=1", requestUrl.origin));
}
