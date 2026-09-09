import { ArrowLeft, Apple, Dumbbell, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type User = { id: string; email?: string };
type Profile = { user_id: string; name: string; primary_goal: string };

export default async function AdminPlansPage() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) redirect("/login");
  if (!isAdminUser(auth.user)) redirect("/dashboard");

  const db = createAdminClient();
  const [{ data: userData }, { data: profiles }, { data: workouts }, { data: nutrition }] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db.from("profiles").select("user_id, name, primary_goal"),
    db.from("workout_plans").select("user_id, name, updated_at").eq("active", true),
    db.from("nutrition_plans").select("user_id, name, updated_at").eq("active", true),
  ]);
  const users = (userData?.users ?? []) as User[];
  const profileByUserId = new Map(((profiles ?? []) as Profile[]).map((profile) => [profile.user_id, profile]));
  const nutritionByUserId = new Map((nutrition ?? []).map((plan) => [plan.user_id, plan]));

  return <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8"><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between"><Link href="/admin" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><ShieldCheck size={18} /></span><span className="font-semibold">Momentum Admin</span></Link><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[#68736b]"><ArrowLeft size={16} /> Vista general</Link></header><section className="mt-14"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Planificación</p><h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em] sm:text-6xl">Planes.</h1><p className="mt-5 max-w-xl text-lg text-[#68736b]">Estado de las planificaciones activas de entrenamiento y nutrición.</p></section><section className="mt-10 grid gap-4 sm:grid-cols-2"><div className="rounded-3xl border border-[#d3dbcf] bg-[#18231f] p-6 text-white"><Dumbbell className="text-[#d7f36b]" size={22} /><p className="mt-8 text-sm text-[#b9c2b7]">Planes de entrenamiento</p><p className="mt-2 text-4xl font-semibold">{workouts?.length ?? 0}</p><p className="mt-2 text-sm text-[#c8d0c5]">Planificaciones activas</p></div><div className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6"><Apple className="text-[#72873f]" size={22} /><p className="mt-8 text-sm text-[#819078]">Planes de nutrición</p><p className="mt-2 text-4xl font-semibold">{nutrition?.length ?? 0}</p><p className="mt-2 text-sm text-[#68736b]">Orientaciones activas</p></div></section><section className="mt-8 overflow-hidden rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1]"><div className="border-b border-[#d3dbcf] p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Estado actual</p><h2 className="mt-2 text-2xl font-semibold">Planes por usuario</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#d3dbcf] text-xs uppercase tracking-[0.12em] text-[#819078]"><tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Objetivo</th><th className="px-6 py-4">Entrenamiento</th><th className="px-6 py-4">Nutrición</th></tr></thead><tbody>{users.map((user) => { const profile = profileByUserId.get(user.id); const workout = workouts?.find((plan) => plan.user_id === user.id); const nutritionPlan = nutritionByUserId.get(user.id); return <tr key={user.id} className="border-b border-[#e3e7dd] last:border-0"><td className="px-6 py-4"><p className="font-semibold">{profile?.name || "Sin perfil"}</p><p className="mt-1 text-xs text-[#819078]">{user.email}</p></td><td className="px-6 py-4 text-[#68736b]">{profile?.primary_goal || "Pendiente"}</td><td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${workout ? "bg-[#e7f5b4] text-[#60703d]" : "bg-[#f7ead9] text-[#7a5326]"}`}>{workout ? "Activo" : "Sin plan"}</span></td><td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${nutritionPlan ? "bg-[#e7f5b4] text-[#60703d]" : "bg-[#f7ead9] text-[#7a5326]"}`}>{nutritionPlan ? "Activo" : "Sin plan"}</span></td></tr>; })}</tbody></table></div></section></div></main>;
}
