"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const goals = ["Ganar masa muscular", "Perder grasa", "Recomposición corporal", "Mantener peso", "Mejorar rendimiento", "Mejorar salud general"];
const diets = ["Omnívoro", "Vegetariano", "Vegano", "Otra"];

type SubscriptionPlan = "free" | "monthly" | "quarterly" | "annual" | "starter" | "pro" | "elite";

const subscriptionPlanLabels: Record<SubscriptionPlan, string> = {
  free: "Free",
  monthly: "Mensual",
  quarterly: "Cada 3 meses",
  annual: "Anual",
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

type AdminUserFormProps = {
  userId: string;
  initialName: string;
  initialGoal: string;
  initialDiet: string;
  initialTargetWeight: number | null;
  initialPlan?: SubscriptionPlan;
};

export function AdminUserForm({
  userId,
  initialName,
  initialGoal,
  initialDiet,
  initialTargetWeight,
  initialPlan,
}: AdminUserFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [goal, setGoal] = useState(initialGoal);
  const [diet, setDiet] = useState(initialDiet);
  const [targetWeight, setTargetWeight] = useState(initialTargetWeight ? String(initialTargetWeight) : "");
  const canEditSubscription = initialPlan !== undefined;
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(initialPlan ?? "free");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setIsSaving(true);
    setMessage(null);
    setError(null);
    const parsedTarget = targetWeight.trim() ? Number(targetWeight.replace(",", ".")) : null;
    if (parsedTarget !== null && (!Number.isFinite(parsedTarget) || parsedTarget < 20 || parsedTarget > 400)) {
      setError("Introduce un peso objetivo válido.");
      setIsSaving(false);
      return;
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        primaryGoal: goal,
        dietPreference: diet,
        targetWeightKg: parsedTarget,
        ...(canEditSubscription ? { subscriptionPlan, subscriptionStatus: "active" } : {}),
      }),
    });
    setIsSaving(false);
    if (!response.ok) {
      setError("No hemos podido guardar los cambios.");
      return;
    }
    setMessage("Perfil actualizado correctamente.");
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Edición segura</p>
        <h2 className="mt-2 text-2xl font-semibold">Datos del perfil</h2>
        <p className="mt-2 text-sm text-[#68736b]">Los cambios se aplican al perfil, no al correo ni a la contraseña.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-[#68736b]">Nombre<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white px-3 py-2.5 text-[#18231f]" /></label>
        <label className="text-sm font-medium text-[#68736b]">Objetivo<select value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white px-3 py-2.5 text-[#18231f]">{goals.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="text-sm font-medium text-[#68736b]">Alimentación<select value={diet} onChange={(event) => setDiet(event.target.value)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white px-3 py-2.5 text-[#18231f]">{diets.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="text-sm font-medium text-[#68736b]">Peso objetivo (kg)<input value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} inputMode="decimal" placeholder="Opcional" className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white px-3 py-2.5 text-[#18231f]" /></label>
        {canEditSubscription ? <label className="text-sm font-medium text-[#68736b]">Plan activo<select value={subscriptionPlan} onChange={(event) => setSubscriptionPlan(event.target.value as SubscriptionPlan)} className="mt-2 w-full rounded-xl border border-[#cfd7c8] bg-white px-3 py-2.5 text-[#18231f]">{Object.entries(subscriptionPlanLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : null}
      </div>

      {message ? <p className="mt-4 text-sm font-semibold text-[#3f611d]">{message}</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-[#a64e3c]">{error}</p> : null}

      <button type="button" onClick={save} disabled={isSaving} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#18231f] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </button>
    </section>
  );
}
