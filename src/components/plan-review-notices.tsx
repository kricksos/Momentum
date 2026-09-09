import { Dumbbell, Utensils } from "lucide-react";
import Link from "next/link";

type PlanReviewNoticesProps = { nutritionPending: boolean; workoutPending: boolean };

export function PlanReviewNotices({ nutritionPending, workoutPending }: PlanReviewNoticesProps) {
  if (!nutritionPending && !workoutPending) return null;

  if (nutritionPending && workoutPending) {
    return <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#e5c66e] bg-[#fff1c6] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#795d10]">Tu plan completo necesita una actualización</p><p className="mt-1 text-sm text-[#795d10]">Tus intolerancias y lesiones han cambiado. Revisa tus datos antes de actualizar dieta y rutina.</p></div><Link href="/checkin" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#18231f] px-4 py-2 text-sm font-semibold text-[#f6f4ed]">Actualizar mi plan</Link></section>;
  }

  const notice = nutritionPending
    ? { icon: Utensils, title: "Tu dieta necesita una actualización", text: "Tus intolerancias o alergias han cambiado. Actualiza solo tu dieta para aplicar comidas compatibles.", href: "/update-plan/nutrition", action: "Actualizar dieta" }
    : { icon: Dumbbell, title: "Tu rutina necesita una actualización", text: "Tus lesiones o molestias han cambiado. Actualiza solo tu rutina para adaptar los ejercicios.", href: "/update-plan/workout", action: "Actualizar rutina" };
  const Icon = notice.icon;

  return <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#e5c66e] bg-[#fff1c6] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><Icon className="mt-0.5 shrink-0 text-[#795d10]" size={20} /><div><p className="text-sm font-semibold text-[#795d10]">{notice.title}</p><p className="mt-1 text-sm text-[#795d10]">{notice.text}</p></div></div><Link href={notice.href} className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#18231f] px-4 py-2 text-sm font-semibold text-[#f6f4ed]">{notice.action}</Link></section>;
}