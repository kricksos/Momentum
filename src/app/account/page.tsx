import Link from "next/link";

import { AccountForm } from "@/components/account-form";
import { AccountPrivacyForm } from "@/components/account-privacy-form";
import { AppHeader } from "@/components/app-header";
import { PremiumPlanCard } from "@/components/premium-plan-card";
import { isAdminUser } from "@/lib/admin-access";
import { getDaysSinceLastMeasurement } from "@/lib/last-measurement";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();

  if (!auth.user) return <main className="grid min-h-screen place-items-center bg-[#f4f1e9] text-center text-[#18231f]"><div><h1 className="text-3xl font-semibold">Necesitas iniciar sesión</h1><Link href="/login" className="mt-6 inline-flex rounded-full bg-[#18231f] px-5 py-3 text-sm font-semibold text-white">Ir al acceso</Link></div></main>;

  const db = createAdminClient();
  const { data: profile } = await db.from("profiles").select("name, primary_goal, current_weight_kg, target_weight_kg, diet_preference, experience, subscription_plan, subscription_status, subscription_started_at, subscription_renews_at, subscription_auto_renew, created_at").eq("user_id", auth.user.id).maybeSingle();
  const { data: consentRows } = await db.from("user_consents").select("consent_type, accepted, accepted_at").eq("user_id", auth.user.id).order("accepted_at", { ascending: false });
  const latestConsent = new Map<string, boolean>();
  for (const consent of consentRows ?? []) if (!latestConsent.has(consent.consent_type)) latestConsent.set(consent.consent_type, consent.accepted);
  const initialName = profile?.name ?? (typeof auth.user.user_metadata?.name === "string" ? auth.user.user_metadata.name : "");
  const subscriptionPlan = profile?.subscription_plan ?? "free";
  const normalizedPlan = subscriptionPlan === "starter" ? "monthly" : subscriptionPlan === "pro" ? "quarterly" : subscriptionPlan === "elite" ? "annual" : subscriptionPlan;
  const subscriptionPlanLabel = normalizedPlan === "free" ? "Free" : normalizedPlan === "monthly" ? "Mensual" : normalizedPlan === "quarterly" ? "Cada 3 meses" : normalizedPlan === "annual" ? "Anual" : "Plan";
  const profileGoal = profile?.primary_goal || "Sin objetivo";
  const currentWeight = profile?.current_weight_kg ? `${Number(profile.current_weight_kg).toFixed(1)} kg` : "Sin registro";
  const targetWeight = profile?.target_weight_kg ? `${Number(profile.target_weight_kg).toFixed(1)} kg` : "No definida";
  const dietPreference = profile?.diet_preference || "No indicada";
  const experience = profile?.experience || "No indicada";
  const createdAt = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Sin fecha";
  const daysSinceLastMeasurement = await getDaysSinceLastMeasurement(db, auth.user.id);

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <AppHeader email={auth.user.email ?? ""} name={initialName || "Mi cuenta"} daysSinceLastMeasurement={daysSinceLastMeasurement} hasProfile={Boolean(profile)} />
        <Link href="/dashboard" className="mt-6 inline-block text-sm font-semibold text-[#68736b] hover:text-[#18231f]">← Volver al panel</Link>

        {isAdminUser(auth.user) ? (
          <section className="mt-6 overflow-hidden rounded-[1.8rem] border border-[#d3dbcf] bg-gradient-to-br from-[#18231f] via-[#1d2b27] to-[#243833] p-5 text-[#f6f4ed] shadow-[0_20px_30px_rgba(24,35,31,0.18)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d7f36b]">Acceso de administrador</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Panel operativo de Momentum</h2>
              </div>
              <Link href="/admin" className="inline-flex items-center justify-center rounded-full bg-[#d7f36b] px-4 py-2.5 text-sm font-semibold text-[#18231f] transition hover:brightness-95">
                Abrir panel admin
              </Link>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d1d7d2]">Gestiona usuarios, revisa suscripciones y corrige perfiles si hay algún problema manual en el proceso de alta o pago.</p>
          </section>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-[#d3dbcf] bg-[#f8f7f1] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl bg-[#18231f] text-lg font-semibold text-[#d7f36b] shadow-sm">
                    {initialName ? initialName.charAt(0).toUpperCase() : "M"}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#819078]">Perfil</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{initialName || "Mi cuenta"}</h1>
                  </div>
                </div>
                <div className="rounded-full border border-[#d3dbcf] bg-white px-3 py-1.5 text-xs font-semibold text-[#60703d]">
                  Miembro desde {createdAt}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[#e9eddf]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#819078]">Objetivo</p>
                  <p className="mt-2 text-sm font-semibold text-[#18231f]">{profileGoal}</p>
                </div>
                <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[#e9eddf]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#819078]">Peso actual</p>
                  <p className="mt-2 text-sm font-semibold text-[#18231f]">{currentWeight}</p>
                </div>
                <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[#e9eddf]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#819078]">Meta</p>
                  <p className="mt-2 text-sm font-semibold text-[#18231f]">{targetWeight}</p>
                </div>
                <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[#e9eddf]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#819078]">Dieta</p>
                  <p className="mt-2 text-sm font-semibold text-[#18231f]">{dietPreference}</p>
                </div>
              </div>
            </div>

            <AccountForm initialName={initialName} initialEmail={auth.user.email ?? ""} />
            <AccountPrivacyForm initialAnalytics={latestConsent.get("analytics") ?? false} initialHealthData={latestConsent.get("health_data") ?? false} />
          </section>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-[#d3dbcf] bg-white p-4 shadow-sm ring-1 ring-[#edf1ea]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#819078]">Datos de cuenta</p>
              <div className="mt-4 space-y-3 text-sm text-[#68736b]">
                <div className="flex items-center justify-between border-b border-[#edf1ea] pb-2">
                  <span>Email</span>
                  <span className="max-w-[12rem] truncate font-semibold text-[#18231f]">{auth.user.email ?? "Sin email"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#edf1ea] pb-2">
                  <span>Experiencia</span>
                  <span className="font-semibold text-[#18231f]">{experience}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#edf1ea] pb-2">
                  <span>Plan</span>
                  <span className="font-semibold text-[#18231f]">{subscriptionPlanLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Acceso</span>
                  <span className="rounded-full bg-[#edf5d5] px-2.5 py-1 text-[11px] font-semibold text-[#60703d]">{normalizedPlan === "free" ? "Incluido" : "Activo"}</span>
                </div>
              </div>
            </div>

            <PremiumPlanCard plan={normalizedPlan as "free" | "monthly" | "quarterly" | "annual"} status={(profile?.subscription_status as "pending" | "active" | "paused" | "cancelled") ?? "pending"} startedAt={profile?.subscription_started_at} renewsAt={profile?.subscription_renews_at} autoRenew={profile?.subscription_auto_renew ?? false} email={auth.user.email ?? undefined} />
          </aside>
        </div>
      </div>
    </main>
  );
}
