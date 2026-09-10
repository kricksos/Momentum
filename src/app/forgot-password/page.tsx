"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    setEmailSent(false);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setStatus("No hemos podido enviar el correo de recuperación. Comprueba el email e inténtalo de nuevo.");
      return;
    }

    setStatus("Te hemos enviado un correo para restablecer tu contraseña.");
    setEmailSent(true);
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-[#d3dbcf] bg-[#f8f7f1] p-6 shadow-[0_24px_70px_rgba(50,65,49,0.09)] sm:p-8">
          <div className="inline-flex rounded-full bg-[#e7f5b4] p-3 text-[#2f4a16]">
            <Mail size={20} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.05em]">Recuperar contraseña</h1>
          <p className="mt-3 text-base leading-7 text-[#68736b]">Escribe el email asociado a tu cuenta y te enviaremos un enlace para restablecerla.</p>

          {emailSent ? <section className="mt-7 rounded-2xl border border-[#d3dbcf] bg-white/70 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-[#72873f]" size={20} /><div><p className="font-semibold text-[#18231f]">Revisa tu correo</p><p className="mt-2 text-sm leading-6 text-[#68736b]">Hemos enviado el enlace a <strong className="break-all text-[#18231f]">{email}</strong>. Cuando lo abras podrás crear una nueva contraseña.</p><p className="mt-3 text-xs leading-5 text-[#819078]">Por seguridad, no puedes solicitar otro enlace desde esta pantalla.</p></div></div><Link href="/login" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed]">Volver al login <ArrowRight size={17} /></Link></section> : <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white/60 px-4 py-3 outline-none focus:border-[#72873f]"
                placeholder="tu@email.com"
              />
            </label>

            {status ? <p className="text-sm font-medium text-[#60703d]">{status}</p> : null}

            <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed] disabled:opacity-50">
              {isSubmitting ? <LoaderCircle size={17} className="animate-spin" /> : <>Enviar enlace <ArrowRight size={17} /></>}
            </button>
          </form>}

          <div className="mt-6 text-center text-sm text-[#68736b]">
            <Link href="/login" className="font-semibold text-[#60703d] underline underline-offset-4">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
