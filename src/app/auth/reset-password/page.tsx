"use client";

import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setStatus("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setStatus("No hemos podido actualizar tu contraseña. Vuelve a pedir el enlace de recuperación.");
      return;
    }

    setStatus("Tu contraseña ha sido actualizada correctamente.");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-[#d3dbcf] bg-[#f8f7f1] p-6 shadow-[0_24px_70px_rgba(50,65,49,0.09)] sm:p-8">
          <div className="inline-flex rounded-full bg-[#e7f5b4] p-3 text-[#2f4a16]">
            <ShieldCheck size={20} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.05em]">Nueva contraseña</h1>
          <p className="mt-3 text-base leading-7 text-[#68736b]">Crea una contraseña segura para volver a entrar en Momentum.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm font-medium">
              Nueva contraseña
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white/60 px-4 py-3 outline-none focus:border-[#72873f]"
                placeholder="Mínimo 8 caracteres"
              />
            </label>

            <label className="block text-sm font-medium">
              Repetir contraseña
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white/60 px-4 py-3 outline-none focus:border-[#72873f]"
              />
            </label>

            {status ? <p className="text-sm font-medium text-[#60703d]">{status}</p> : null}

            <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed] disabled:opacity-50">
              {isSubmitting ? <LoaderCircle size={17} className="animate-spin" /> : <>Guardar contraseña <ArrowRight size={17} /></>}
            </button>
          </form>

          {searchParams.get("code") ? null : <p className="mt-5 text-sm text-[#68736b]">Este enlace se usa para recuperar la contraseña. Si acabas de recibirlo, puedes continuar con el cambio.</p>}

          <div className="mt-6 text-center text-sm text-[#68736b]">
            <Link href="/login" className="font-semibold text-[#60703d] underline underline-offset-4">Volver al login</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
