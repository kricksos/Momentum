"use client";

import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acceptedTerms) {
      setStatus("Acepta la política de privacidad y los términos para continuar.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, accepted_terms: true, consent_version: "1.0", consent_language: "es" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsSubmitting(false);
    if (error) {
      setStatus("No hemos podido crear tu cuenta. Comprueba los datos e inténtalo de nuevo.");
      return;
    }

    const sessionToken = window.sessionStorage.getItem("momentum_onboarding_token");
    if (sessionToken) {
      const conversionResponse = await fetch("/api/onboarding/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });

      if (conversionResponse.ok) {
        window.sessionStorage.removeItem("momentum_onboarding_token");
          setStatus("Cuenta creada y perfil guardado. Revisa tu correo para confirmar el acceso.");
        return;
      }
    }

      setStatus("Cuenta creada. Revisa tu correo para confirmar el acceso y después inicia sesión para terminar de preparar tu perfil.");
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header><Link href="/" className="flex items-center gap-3" aria-label="Volver a Momentum"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><Sparkles size={18} /></span><span className="font-semibold">Momentum</span></Link></header>
        <section className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Tu planificación te espera</p><h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.07em] sm:text-7xl">Guarda tu punto de partida.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#68736b]">Crea tu cuenta gratuita para conservar tu propuesta y empezar a registrar tu progreso.</p></div>
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[#d3dbcf] bg-[#f8f7f1] p-6 shadow-[0_24px_70px_rgba(50,65,49,0.09)] sm:p-8"><h2 className="text-2xl font-semibold tracking-[-0.04em]">Crear cuenta gratuita</h2><div className="mt-7 space-y-4"><label className="block text-sm font-medium">Nombre<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white/60 px-4 py-3 outline-none focus:border-[#72873f]" /></label><label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white/60 px-4 py-3 outline-none focus:border-[#72873f]" /></label><label className="block text-sm font-medium">Contraseña<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white/60 px-4 py-3 outline-none focus:border-[#72873f]" /></label></div><label className="mt-6 flex gap-3 text-sm leading-6 text-[#68736b]"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 size-4 accent-[#72873f]" />Acepto la política de privacidad y los términos de Momentum.</label>{status && <p className="mt-5 text-sm font-medium text-[#60703d]">{status}</p>}<button type="submit" disabled={isSubmitting} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed] disabled:opacity-50">{isSubmitting ? <LoaderCircle size={17} className="animate-spin" /> : <>Crear mi cuenta <ArrowRight size={17} /></>}</button></form>
        </section>
      </div>
    </main>
  );
}
