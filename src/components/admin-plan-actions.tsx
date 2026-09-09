"use client";

import { Apple, Dumbbell, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { userId: string };

export function AdminPlanActions({ userId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"workout" | "nutrition" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function regenerate(type: "workout" | "nutrition") {
    const label = type === "workout" ? "rutina" : "dieta";
    if (!window.confirm(`¿Regenerar la ${label} usando el perfil actual de este usuario?`)) return;
    setBusy(type);
    setMessage(null);
    const response = await fetch(`/api/admin/users/${userId}/regenerate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
    setBusy(null);
    if (!response.ok) {
      setMessage(`No se ha podido regenerar la ${label}.`);
      return;
    }
    setMessage(`${type === "workout" ? "Rutina" : "Dieta"} regenerada correctamente.`);
    router.refresh();
  }

  return <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Acciones operativas</p><h2 className="mt-2 text-2xl font-semibold">Regenerar planificación</h2><p className="mt-2 text-sm text-[#68736b]">Crea una nueva versión usando los datos actuales del usuario. La versión anterior queda archivada.</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={busy !== null} onClick={() => regenerate("workout")} className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy === "workout" ? <LoaderCircle size={16} className="animate-spin" /> : <Dumbbell size={16} />} Regenerar rutina</button><button type="button" disabled={busy !== null} onClick={() => regenerate("nutrition")} className="inline-flex items-center gap-2 rounded-full border border-[#b6c77b] bg-[#e7f5b4] px-4 py-3 text-sm font-semibold text-[#3d4a24] disabled:opacity-60">{busy === "nutrition" ? <LoaderCircle size={16} className="animate-spin" /> : <Apple size={16} />} Regenerar dieta</button></div>{message ? <p className="mt-4 text-sm font-semibold text-[#60703d]">{message}</p> : null}</section>;
}
