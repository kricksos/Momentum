"use client";

import { LoaderCircle, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AccountPrivacyFormProps = {
  initialAnalytics: boolean;
  initialHealthData: boolean;
};

export function AccountPrivacyForm({ initialAnalytics, initialHealthData }: AccountPrivacyFormProps) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [healthData, setHealthData] = useState(initialHealthData);
  const [saving, setSaving] = useState<"analytics" | "health" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function updateConsent(consentType: "analytics" | "health_data", accepted: boolean) {
    setSaving(consentType === "analytics" ? "analytics" : "health");
    setMessage(null);
    const response = await fetch("/api/account/consents", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consentType, accepted }) });
    setSaving(null);
    if (!response.ok) {
      setMessage("No hemos podido actualizar tus preferencias.");
      return;
    }
    if (consentType === "analytics") setAnalytics(accepted);
    else setHealthData(accepted);
    setMessage("Preferencias actualizadas.");
  }

  async function deleteAccount() {
    setDeleting(true);
    setMessage(null);
    const response = await fetch("/api/account/delete", { method: "DELETE" });
    if (!response.ok) {
      setDeleting(false);
      setMessage("No hemos podido eliminar la cuenta.");
      return;
    }
    await createClient().auth.signOut();
    router.push("/");
  }

  return <div className="mt-8 space-y-6">
    <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-[#72873f]" size={20} /><div><h2 className="text-lg font-semibold">Privacidad y datos</h2><p className="mt-2 text-sm leading-6 text-[#68736b]">Puedes retirar estos consentimientos cuando quieras. La personalización puede verse limitada si retiras el uso de datos de salud.</p></div></div>
      <div className="mt-5 divide-y divide-[#e3e7dd] rounded-2xl border border-[#e3e7dd] bg-white">
        <label className="flex items-center justify-between gap-4 p-4 text-sm"><span><strong className="block text-[#18231f]">Analítica no esencial</strong><span className="text-xs text-[#68736b]">Ayuda a mejorar el producto con métricas agregadas.</span></span><input type="checkbox" checked={analytics} disabled={saving === "analytics"} onChange={(event) => updateConsent("analytics", event.target.checked)} className="size-5 accent-[#72873f]" /></label>
        <label className="flex items-center justify-between gap-4 p-4 text-sm"><span><strong className="block text-[#18231f]">Datos de salud</strong><span className="text-xs text-[#68736b]">Permite adaptar recomendaciones a lesiones y restricciones.</span></span><input type="checkbox" checked={healthData} disabled={saving === "health"} onChange={(event) => updateConsent("health_data", event.target.checked)} className="size-5 accent-[#72873f]" /></label>
      </div>
      {message ? <p className="mt-4 text-sm font-semibold text-[#60703d]">{message}</p> : null}
    </section>
    <section className="rounded-3xl border border-[#e4cfc5] bg-[#fffaf7] p-6"><div className="flex items-start gap-3"><Trash2 className="mt-0.5 text-[#a64e3c]" size={20} /><div><h2 className="text-lg font-semibold">Eliminar cuenta</h2><p className="mt-2 text-sm leading-6 text-[#68736b]">Elimina tu cuenta y los datos asociados de Momentum. Esta acción no se puede deshacer.</p></div></div><button type="button" disabled={deleting} onClick={deleteAccount} className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#c58c78] px-4 py-2.5 text-sm font-semibold text-[#8f4434] disabled:opacity-60">{deleting ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />} {deleting ? "Eliminando..." : "Eliminar mi cuenta"}</button></section>
  </div>;
}
