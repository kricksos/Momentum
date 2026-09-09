import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminUserForm } from "@/components/admin-user-form";
import { AdminPlanActions } from "@/components/admin-plan-actions";
import { isAdminUser } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ userId: string }> };

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "Sin acceso";
}

export default async function AdminUserDetailPage({ params }: Props) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) redirect("/login");
  if (!isAdminUser(auth.user)) redirect("/dashboard");
  const { userId } = await params;

  const db = createAdminClient();
  const [{ data: userData }, { data: profile }, { data: workouts }, { data: nutrition }, { data: sessions }] = await Promise.all([
    db.auth.admin.getUserById(userId),
    db.from("profiles").select("name, primary_goal, diet_preference, target_weight_kg, current_weight_kg, food_restrictions, subscription_plan, subscription_status").eq("user_id", userId).maybeSingle(),
    db.from("workout_plans").select("id, name, updated_at").eq("user_id", userId).eq("active", true).maybeSingle(),
    db.from("nutrition_plans").select("id, name, updated_at").eq("user_id", userId).eq("active", true).maybeSingle(),
    db.from("workout_sessions").select("id").eq("user_id", userId).eq("completed", true),
  ]);
  if (!userData?.user) notFound();

  return <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8"><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between"><Link href="/admin" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><ShieldCheck size={18} /></span><span className="font-semibold">Momentum Admin</span></Link><Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold text-[#68736b]"><ArrowLeft size={16} /> Usuarios</Link></header><section className="mt-14"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Ficha de usuario</p><h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em]">{profile?.name || "Sin perfil"}.</h1><p className="mt-4 text-lg text-[#68736b]">{userData.user.email}</p></section><section className="mt-10 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-5"><p className="text-xs uppercase tracking-[0.12em] text-[#819078]">Registro</p><p className="mt-2 font-semibold">{formatDate(userData.user.created_at)}</p></div><div className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-5"><p className="text-xs uppercase tracking-[0.12em] text-[#819078]">Último acceso</p><p className="mt-2 font-semibold">{formatDate(userData.user.last_sign_in_at)}</p></div><div className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-5"><p className="text-xs uppercase tracking-[0.12em] text-[#819078]">Sesiones</p><p className="mt-2 font-semibold">{sessions?.length ?? 0} completadas</p></div></section><section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><AdminUserForm userId={userId} initialName={profile?.name || ""} initialGoal={profile?.primary_goal || "Ganar masa muscular"} initialDiet={profile?.diet_preference || "Omnívoro"} initialTargetWeight={profile?.target_weight_kg ?? null} /><section className="rounded-3xl border border-[#d3dbcf] bg-[#18231f] p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b9c2b7]">Estado operativo</p><h2 className="mt-2 text-2xl font-semibold">Planes del usuario</h2><div className="mt-6 space-y-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-[#b9c2b7]">Entrenamiento</p><p className="mt-1 font-semibold">{workouts?.name || "Sin plan activo"}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-[#b9c2b7]">Nutrición</p><p className="mt-1 font-semibold">{nutrition?.name || "Sin plan activo"}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-[#b9c2b7]">Peso</p><p className="mt-1 font-semibold">{profile?.current_weight_kg ? `${profile.current_weight_kg} kg actuales` : "Sin registro"}{profile?.target_weight_kg ? ` · objetivo ${profile.target_weight_kg} kg` : ""}</p></div></div></section></section><section className="mt-4"><AdminPlanActions userId={userId} /></section></div></main>;
}
