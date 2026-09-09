import { ArrowLeft, Edit3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type User = { id: string; email?: string; created_at: string; last_sign_in_at?: string | null };
type Profile = { user_id: string; name: string; primary_goal: string; diet_preference: string | null };

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Sin acceso";
}

export default async function AdminUsersPage() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) redirect("/login");
  if (!isAdminUser(auth.user)) redirect("/dashboard");

  const db = createAdminClient();
  const [{ data: userData }, { data: profiles }, { data: workoutPlans }, { data: nutritionPlans }] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db.from("profiles").select("user_id, name, primary_goal, diet_preference"),
    db.from("workout_plans").select("user_id").eq("active", true),
    db.from("nutrition_plans").select("user_id").eq("active", true),
  ]);
  const users = (userData?.users ?? []) as User[];
  const profileByUserId = new Map(((profiles ?? []) as Profile[]).map((profile) => [profile.user_id, profile]));
  const workoutIds = new Set((workoutPlans ?? []).map((plan) => plan.user_id));
  const nutritionIds = new Set((nutritionPlans ?? []).map((plan) => plan.user_id));

  return <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8"><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between"><Link href="/admin" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><ShieldCheck size={18} /></span><span className="font-semibold">Momentum Admin</span></Link><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[#68736b]"><ArrowLeft size={16} /> Vista general</Link></header><section className="mt-14"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Directorio</p><h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em] sm:text-6xl">Usuarios.</h1><p className="mt-5 text-lg text-[#68736b]">Perfiles, objetivos y estado de activación.</p></section><section className="mt-10 overflow-hidden rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1]"><div className="border-b border-[#d3dbcf] p-6"><p className="text-sm text-[#68736b]">{users.length} usuarios registrados</p></div><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="border-b border-[#d3dbcf] text-xs uppercase tracking-[0.12em] text-[#819078]"><tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Objetivo</th><th className="px-6 py-4">Alimentación</th><th className="px-6 py-4">Estado del plan</th><th className="px-6 py-4">Registro</th><th className="px-6 py-4">Último acceso</th></tr></thead><tbody>{users.map((user) => { const profile = profileByUserId.get(user.id); const complete = workoutIds.has(user.id) && nutritionIds.has(user.id); return <tr key={user.id} className="border-b border-[#e3e7dd] last:border-0"><td className="px-6 py-4"><p className="font-semibold"><a href={`/admin/users/${user.id}`} className="inline-flex items-center gap-2 hover:text-[#72873f]">{profile?.name || "Sin perfil"}<Edit3 size={14} className="text-[#819078]" /></a></p><p className="mt-1 text-xs text-[#819078]">{user.email}</p></td><td className="px-6 py-4 text-[#68736b]">{profile?.primary_goal || "Pendiente"}</td><td className="px-6 py-4 text-[#68736b]">{profile?.diet_preference || "No indicada"}</td><td className="px-6 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${complete ? "bg-[#e7f5b4] text-[#60703d]" : "bg-[#f7ead9] text-[#7a5326]"}`}>{complete ? "Completo" : "Pendiente"}</span></td><td className="px-6 py-4 text-[#68736b]">{formatDate(user.created_at)}</td><td className="px-6 py-4 text-[#68736b]">{formatDate(user.last_sign_in_at)}</td></tr>; })}</tbody></table></div></section></div></main>;
}
