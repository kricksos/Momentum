"use client";

import { ArrowRight, Check, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

type SubscriptionPlan = "free" | "monthly" | "quarterly" | "annual" | "starter" | "pro" | "elite";
type SubscriptionStatus = "pending" | "active" | "paused" | "cancelled";

const planLabels: Record<SubscriptionPlan, string> = {
  free: "Free",
  monthly: "Mensual",
  quarterly: "Cada 3 meses",
  annual: "Anual",
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

const planOptions = [
  { value: "free", label: "Free", price: 0, description: "Acceso básico" },
  { value: "monthly", label: "Mensual", price: 39, description: "Ideal para empezar" },
  { value: "quarterly", label: "Cada 3 meses", price: 99, description: "Ahorro del 15%" },
  { value: "annual", label: "Anual", price: 299, description: "Ahorro del 30%" },
] as const;

const features = [
  "Rutinas automáticas adaptadas a tu objetivo",
  "Nutrición personalizada con seguimiento semanal",
  "Progreso, medidas y evolución en un solo lugar",
  "Asesoramiento premium y experiencia guiada",
];

function normalizePlan(plan: SubscriptionPlan): SubscriptionPlan {
  if (plan === "starter") return "monthly";
  if (plan === "pro") return "quarterly";
  if (plan === "elite") return "annual";
  return plan;
}

export function PremiumPlanCard({ plan = "free", status = "pending", startedAt, renewsAt, autoRenew = false, email }: { plan?: SubscriptionPlan; status?: SubscriptionStatus; startedAt?: string | null; renewsAt?: string | null; autoRenew?: boolean; email?: string }) {
  const initialPlan = normalizePlan(plan);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(initialPlan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [manageMessage, setManageMessage] = useState<string | null>(null);
  const [currentRenewsAt, setCurrentRenewsAt] = useState(renewsAt);
  const [currentAutoRenew, setCurrentAutoRenew] = useState(autoRenew);
  const hasSubscription = Boolean(selectedPlan !== "free" && (status === "active" || (status === "cancelled" && currentRenewsAt && new Date(currentRenewsAt) > new Date())));
  const hasLockedSubscription = Boolean(initialPlan !== "free" && hasSubscription);
  const isPremiumPlan = selectedPlan !== "free";

  async function startCheckout() {
    if (selectedPlan === "free") return;
    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "No se pudo iniciar el checkout.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "No se pudo iniciar el checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function manageSubscription(action: "cancel" | "reactivate") {
    setIsManaging(true);
    setManageMessage(null);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/stripe/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; renewsAt?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo actualizar la suscripción.");
      setCurrentAutoRenew(action === "reactivate");
      if (payload.renewsAt) setCurrentRenewsAt(payload.renewsAt);
      setManageMessage(action === "cancel" ? "Renovación cancelada. Mantendrás el acceso hasta el final del periodo." : "Renovación reactivada correctamente.");
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "No se pudo actualizar la suscripción.");
    } finally {
      setIsManaging(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#2d403b] bg-gradient-to-br from-[#18231f] via-[#1e2d27] to-[#243e35] p-4 text-white shadow-[0_18px_40px_rgba(11,18,16,0.24)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d7f36b]">Suscripción</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">{selectedPlan === "free" ? "Free" : planLabels[selectedPlan]}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7f36b]/40 bg-[#d7f36b]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e9f8a5]">
          <Sparkles size={10} /> {isPremiumPlan ? "Premium" : "Free"}
        </span>
      </div>

      {hasSubscription ? (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d7f36b]/30 bg-[#d7f36b]/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ecf9b3]">
          <ShieldCheck size={12} className="text-[#d7f36b]" />
          Suscrito al plan {planLabels[selectedPlan].toLowerCase()}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {planOptions.map((option) => {
          const isSelected = selectedPlan === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={hasLockedSubscription && option.value !== initialPlan}
              onClick={() => setSelectedPlan(option.value)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-2.5 py-2.5 text-left transition ${
                isSelected ? "border-[#d7f36b] bg-[#d7f36b]/12 shadow-[0_0_0_1px_rgba(215,243,107,0.2)]" : "border-white/10 bg-white/5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{option.label}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#cbd7cc]">{option.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#edf2eb]">{option.price}€</span>
                {isSelected ? <span className="rounded-full bg-[#d7f36b] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#18231f]">Seleccionado</span> : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" disabled={isSubmitting || selectedPlan === "free" || hasLockedSubscription} onClick={startCheckout} className="inline-flex items-center gap-2 rounded-full bg-[#d7f36b] px-3.5 py-2 text-xs font-semibold text-[#18231f] shadow-[0_8px_18px_rgba(215,243,107,0.25)] disabled:cursor-not-allowed disabled:opacity-80">
          {isSubmitting ? <><LoaderCircle size={13} className="animate-spin" /> Redirigiendo...</> : selectedPlan === "free" ? "Continuar con Free" : "Pagar ahora"}
          {!isSubmitting ? <ArrowRight size={13} /> : null}
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-2 text-[10px] font-medium text-[#edf2eb]">
          <ShieldCheck size={12} className="text-[#d7f36b]" />
          {selectedPlan === "free" ? "Incluido" : "Activo"}
        </div>
      </div>

      {checkoutError ? <p className="mt-3 text-[11px] font-medium text-[#ffd8d8]">{checkoutError}</p> : null}

      {hasLockedSubscription ? <p className="mt-3 text-[11px] leading-5 text-[#cbd7cc]">Tu suscripción está activa hasta {currentRenewsAt ? new Date(currentRenewsAt).toLocaleDateString("es-ES") : "la fecha indicada"}. Podrás cambiar de plan o pasar a Free cuando finalice este periodo.</p> : null}

      {hasSubscription && email ? <button type="button" disabled={isManaging} onClick={() => manageSubscription(currentAutoRenew ? "cancel" : "reactivate")} className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[#edf2eb] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">{isManaging ? "Actualizando..." : currentAutoRenew ? "Cancelar renovación" : "Reactivar renovación"}</button> : null}

      {manageMessage ? <p className="mt-3 text-[11px] leading-5 text-[#d7f36b]">{manageMessage}</p> : null}

      {isPremiumPlan ? <p className="mt-3 text-[11px] leading-5 text-[#cbd7cc]">El pago se gestiona con Stripe en modo sandbox. Cuando esté activo el webhook, la suscripción se sincroniza automáticamente.</p> : null}

      {startedAt ? <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-[#cbd7cc]"><div><p className="uppercase tracking-[0.1em] text-[#9eaba0]">Activado</p><p className="mt-1 font-semibold text-white">{new Date(startedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p></div><div><p className="uppercase tracking-[0.1em] text-[#9eaba0]">Próxima renovación</p><p className="mt-1 font-semibold text-[#d7f36b]">{currentRenewsAt ? new Date(currentRenewsAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "No aplica"}</p><p className="mt-1 text-[10px]">{currentAutoRenew && currentRenewsAt ? "Auto-renovación activa" : "Sin renovación"}</p></div></div> : null}

      <div className="mt-4 grid gap-2">
        {features.slice(0, 3).map((feature) => (
          <div key={feature} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-sm">
            <span className="mt-0.5 inline-flex rounded-full bg-[#d7f36b] p-1 text-[#18231f]">
              <Check size={10} />
            </span>
            <p className="text-xs leading-5 text-[#edf2eb]">{feature}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
