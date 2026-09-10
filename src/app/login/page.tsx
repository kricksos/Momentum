"use client";

import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [needsProfileRecovery, setNeedsProfileRecovery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const message = error ?? (params.get("confirmed") === "1" ? "Email confirmado. Ya puedes iniciar sesión." : null);
    if (!message) return;
    const timer = window.setTimeout(() => setStatus(message), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    setNeedsProfileRecovery(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsSubmitting(false);
      setStatus("No hemos podido iniciar sesión. Comprueba tu email y contraseña.");
      return;
    }

    const queryToken = new URLSearchParams(window.location.search).get("onboarding_token");
    const sessionToken = queryToken ?? window.sessionStorage.getItem("momentum_onboarding_token") ?? window.localStorage.getItem("momentum_onboarding_token");
    const conversionResponse = await fetch("/api/onboarding/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionToken ? { sessionToken } : {}),
    });
    const conversionResult = (await conversionResponse.json().catch(() => ({}))) as { converted?: boolean; planningMode?: "auto" | "manual"; error?: string };

    if (!conversionResponse.ok) {
      setIsSubmitting(false);
      setNeedsProfileRecovery(true);
      setStatus(conversionResult.error ?? "Has iniciado sesión, pero todavía tenemos que terminar de guardar tu perfil.");
      return;
    }

    if (conversionResult.converted) {
      window.sessionStorage.removeItem("momentum_onboarding_token");
      window.localStorage.removeItem("momentum_onboarding_token");
      if (conversionResult.planningMode !== "manual") {
        setStatus("Perfil guardado. Preparando tu rutina y tu dieta...");
        const planResponse = await fetch("/api/plans/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        if (!planResponse.ok) {
          setIsSubmitting(false);
          setStatus("Tu cuenta está confirmada, pero no hemos podido preparar todavía tu plan. Puedes intentarlo desde el dashboard.");
          return;
        }
      }
    }

    router.push(conversionResult.converted && conversionResult.planningMode === "manual" ? "/workout/builder" : "/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header><Link href="/" className="flex items-center gap-3" aria-label="Volver a Momentum"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><Sparkles size={18} /></span><span className="font-semibold">Momentum</span></Link></header>
        <section className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Bienvenido de nuevo</p><h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.07em] sm:text-7xl">Tu progreso sigue aquí.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#68736b]">Accede a tu cuenta para continuar con el plan que empezamos a construir contigo.</p></div>
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[#d3dbcf] bg-[#f8f7f1] p-6 shadow-[0_24px_70px_rgba(50,65,49,0.09)] sm:p-8"><h2 className="text-2xl font-semibold tracking-[-0.04em]">Iniciar sesión</h2><div className="mt-7 space-y-4"><label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white/60 px-4 py-3 outline-none focus:border-[#72873f]" /></label><label className="block text-sm font-medium">Contraseña<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white/60 px-4 py-3 outline-none focus:border-[#72873f]" /></label></div>{status && <p className="mt-5 text-sm font-medium text-[#60703d]">{status}</p>}{needsProfileRecovery && <Link href="/onboarding" className="mt-4 inline-flex text-sm font-semibold text-[#60703d] underline underline-offset-4">Repetir onboarding para completar mi perfil</Link>}<button type="submit" disabled={isSubmitting} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed] disabled:opacity-50">{isSubmitting ? <LoaderCircle size={17} className="animate-spin" /> : <>Continuar <ArrowRight size={17} /></>}</button><div className="mt-4 text-center text-sm text-[#68736b]"><Link href="/forgot-password" className="font-semibold text-[#60703d] underline underline-offset-4">He olvidado mi contraseña</Link></div><p className="mt-5 text-center text-sm text-[#68736b]">¿Aún no tienes cuenta? <Link href="/register" className="font-semibold text-[#60703d]">Crear cuenta</Link></p></form>
        </section>
      </div>
    </main>
  );
}
