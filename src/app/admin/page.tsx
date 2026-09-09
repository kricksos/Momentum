import { BarChart3, CalendarClock, CheckCircle2, CreditCard, Dumbbell, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminWorkspace } from "@/components/admin-workspace";
import { isAdminUser } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AdminUser = { id: string; email?: string; created_at: string; last_sign_in_at?: string | null };
type Profile = {
  user_id: string;
  name: string;
  primary_goal: string;
  diet_preference: string | null;
  target_weight_kg: number | null;
  subscription_plan?: "free" | "monthly" | "quarterly" | "annual" | "starter" | "pro" | "elite" | null;
  subscription_status?: "pending" | "active" | "paused" | "cancelled" | null;
  subscription_started_at?: string | null;
  subscription_renews_at?: string | null;
  subscription_auto_renew?: boolean | null;
};

function formatDate(value: string | null | undefined) { return value ? new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Sin acceso"; }
function formatRelativeDate(value: string | null | undefined) { if (!value) return "Sin actividad"; const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000); if (days <= 0) return "Hoy"; if (days === 1) return "Ayer"; if (days < 7) return `Hace ${days} días`; return formatDate(value); }
function reportThresholds() { const now = Date.now(); return { now, lastWeek: now - 7 * 86400000, lastMonth: now - 30 * 86400000, nextThirtyDays: now + 30 * 86400000 }; }

export default async function AdminPage() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) redirect("/login");
  if (!isAdminUser(auth.user)) redirect("/dashboard");
  const db = createAdminClient();
  const { now, lastWeek, lastMonth, nextThirtyDays } = reportThresholds();
  const [{ data: usersData }, { data: profiles }, { data: workoutPlans }, { data: nutritionPlans }, { data: sessions }, { data: analyticsEvents }, { data: analyticsConsents }] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db.from("profiles").select("user_id, name, primary_goal, diet_preference, target_weight_kg, subscription_plan, subscription_status, subscription_started_at, subscription_renews_at, subscription_auto_renew"),
    db.from("workout_plans").select("user_id").eq("active", true),
    db.from("nutrition_plans").select("user_id").eq("active", true),
    db.from("workout_sessions").select("user_id, completed_at").eq("completed", true),
    db.from("analytics_events").select("event_name, user_id, created_at").gte("created_at", new Date(lastMonth).toISOString()),
    db.from("user_consents").select("user_id, accepted").eq("consent_type", "analytics").order("accepted_at", { ascending: false }),
  ]);
  const users = (usersData?.users ?? []) as AdminUser[];
  const profileByUserId = new Map(((profiles ?? []) as Profile[]).map((profile) => [profile.user_id, profile]));
  const workoutUserIds = new Set((workoutPlans ?? []).map((plan) => plan.user_id));
  const nutritionUserIds = new Set((nutritionPlans ?? []).map((plan) => plan.user_id));
  const profileRate = users.length ? Math.round(((profiles ?? []).length / users.length) * 100) : 0;
  const activeAnyPlanUsers = new Set([...workoutUserIds, ...nutritionUserIds]).size;
  const paidSubscriptionUsers = users.filter((user) => {
    const plan = profileByUserId.get(user.id)?.subscription_plan;
    return plan && plan !== "free";
  }).length;
  const renewalsNextThirtyDays = (profiles ?? []).filter((profile) => {
    const renewalDate = profile.subscription_renews_at ? new Date(profile.subscription_renews_at).getTime() : 0;
    return renewalDate >= now && renewalDate <= nextThirtyDays;
  }).length;
  const workspaceUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: profileByUserId.get(user.id)?.name || "Sin perfil",
    goal: profileByUserId.get(user.id)?.primary_goal || "Pendiente",
    diet: profileByUserId.get(user.id)?.diet_preference || "No indicada",
    targetWeight: profileByUserId.get(user.id)?.target_weight_kg ?? null,
    plan: profileByUserId.get(user.id)?.subscription_plan ?? "free",
    status: profileByUserId.get(user.id)?.subscription_status ?? "pending",
    startedAt: profileByUserId.get(user.id)?.subscription_started_at ?? null,
    renewsAt: profileByUserId.get(user.id)?.subscription_renews_at ?? null,
    autoRenew: profileByUserId.get(user.id)?.subscription_auto_renew ?? false,
    complete: workoutUserIds.has(user.id) && nutritionUserIds.has(user.id),
    createdAt: formatDate(user.created_at),
    lastAccess: formatRelativeDate(user.last_sign_in_at),
  }));
  const recentSessionCount = (sessions ?? []).filter((session) => session.completed_at && new Date(session.completed_at).getTime() >= lastWeek).length;
  const monthlySessionCount = (sessions ?? []).filter((session) => session.completed_at && new Date(session.completed_at).getTime() >= lastMonth).length;
  const newThisWeek = users.filter((user) => new Date(user.created_at).getTime() >= lastWeek).length;
  const newThisMonth = users.filter((user) => new Date(user.created_at).getTime() >= lastMonth).length;
  const weeklySummary = [
    [Users, "Nuevos registros", newThisWeek, "Últimos 7 días"],
    [CreditCard, "Suscripciones activas", paidSubscriptionUsers, `${Math.round((paidSubscriptionUsers / Math.max(users.length, 1)) * 100)}% del total`],
    [CalendarClock, "Renovaciones próximas", renewalsNextThirtyDays, "Próximos 30 días"],
    [Dumbbell, "Usuarios sin planificación", users.length - activeAnyPlanUsers, `${Math.round(((users.length - activeAnyPlanUsers) / Math.max(users.length, 1)) * 100)}% del total`],
  ] as Array<[typeof Users, string, number, string]>;
  const monthlySummary = [
    [Users, "Nuevos registros", newThisMonth, "Últimos 30 días"],
    [BarChart3, "Sesiones completadas", monthlySessionCount, `+${recentSessionCount} esta semana`],
    [CheckCircle2, "Perfiles completos", (profiles ?? []).length, `${profileRate}% activación`],
    [Dumbbell, "Planes activos", activeAnyPlanUsers, `${workoutUserIds.size} entrenamiento • ${nutritionUserIds.size} nutrición`],
  ] as Array<[typeof Users, string, number, string]>;
  const latestAnalyticsConsent = new Map<string, boolean>();
  for (const consent of analyticsConsents ?? []) if (!latestAnalyticsConsent.has(consent.user_id)) latestAnalyticsConsent.set(consent.user_id, consent.accepted);
  const analytics = {
    consentedUsers: [...latestAnalyticsConsent.values()].filter(Boolean).length,
    events: (analyticsEvents ?? []).length,
    uniqueUsers: new Set((analyticsEvents ?? []).map((event) => event.user_id).filter(Boolean)).size,
    byEvent: ["signup_completed", "plan_generated", "workout_started", "workout_completed", "weight_logged"].map((eventName) => ({ eventName, count: (analyticsEvents ?? []).filter((event) => event.event_name === eventName).length })),
  };
  const overview = (
    <div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {weeklySummary.map(([Icon, label, value, detail]) => (
          <section key={label} className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-5">
            <Icon className="text-[#72873f]" size={20} />
            <p className="mt-7 text-sm text-[#819078]">{label}</p>
            <p className="mt-1 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-xs font-semibold text-[#60703d]">{detail}</p>
          </section>
        ))}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#18231f] p-6 text-[#f6f4ed]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b9c2b7]">Resumen semanal</p>
              <h2 className="mt-3 text-2xl font-semibold">Crecimiento y acceso</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#c8d0c5]">
                Métricas clave para revisar la adquisición, el acceso activo y la salud del cohort.
              </p>
            </div>
            <CheckCircle2 className="text-[#d7f36b]" size={24} />
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-xs text-[#b9c2b7]">
                <span>Nuevos registros</span>
                <span>{newThisWeek}</span>
              </div>
              <div className="h-2 rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#d7f36b]"
                  style={{ width: `${Math.min(100, (newThisWeek / Math.max(users.length, 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs text-[#b9c2b7]">
                <span>Acceso activo</span>
                <span>{Math.round((activeAnyPlanUsers / Math.max(users.length, 1)) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#d7f36b]"
                  style={{ width: `${Math.min(100, (activeAnyPlanUsers / Math.max(users.length, 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Resumen mensual</p>
          <h2 className="mt-3 text-2xl font-semibold">Cohorte operativo</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {monthlySummary.map(([Icon, label, value, detail]) => (
              <div key={label} className="rounded-2xl bg-white p-4">
                <Icon className="text-[#72873f]" size={18} />
                <p className="mt-3 text-xs text-[#819078]">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#60703d]">{detail}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
  return <main className="min-h-screen bg-[#f4f1e9] text-[#18231f]"><div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8 lg:px-12"><header className="flex items-center justify-between"><Link href="/dashboard" className="text-sm font-semibold text-[#68736b] hover:text-[#18231f]">Volver al dashboard</Link><span className="rounded-full border border-[#d3dbcf] bg-[#f8f7f1] px-3 py-2 text-xs font-semibold text-[#60703d]">Modo administrador</span></header><section className="mt-10 overflow-hidden rounded-[2rem] bg-[#18231f] p-6 text-[#f6f4ed] shadow-[0_24px_50px_rgba(24,35,31,0.16)] sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d7f36b]">Momentum / Operaciones</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Centro de control.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#c8d0c5]">Una lectura precisa de usuarios, suscripciones y planificación para tomar decisiones con contexto.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right"><p className="text-[10px] uppercase tracking-[0.16em] text-[#9eaba0]">Estado del sistema</p><p className="mt-1 text-sm font-semibold text-[#d7f36b]">Operativo</p></div></div></section><AdminWorkspace overview={overview} users={workspaceUsers} analytics={analytics} /></div></main>;
}
