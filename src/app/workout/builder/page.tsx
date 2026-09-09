import { redirect } from "next/navigation";
import Link from "next/link";

import { ManualWorkoutBuilder } from "@/components/manual-workout-builder";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function WorkoutBuilderPage({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const { setup } = await searchParams;
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) redirect("/login");
  const db = createAdminClient();
  const [{ data: catalog }, { data: activePlan }, { data: archivedPlans }] = await Promise.all([
    db.from("exercises").select("id, name, primary_muscle, muscle_groups, difficulty, equipment_required").order("name"),
    db.from("workout_plans").select("id, name, source, updated_at").eq("user_id", auth.user.id).eq("active", true).maybeSingle(),
    db.from("workout_plans").select("id, name, source, updated_at").eq("user_id", auth.user.id).eq("active", false).order("updated_at", { ascending: false }).limit(6),
  ]);
  const exercises = (catalog ?? []).map((exercise) => ({ id: exercise.id, name: exercise.name, primaryMuscle: typeof exercise.primary_muscle === "string" ? exercise.primary_muscle : null, muscleGroups: Array.isArray(exercise.muscle_groups) ? exercise.muscle_groups.filter((group): group is string => typeof group === "string") : [], difficulty: exercise.difficulty, equipment: Array.isArray(exercise.equipment_required) ? exercise.equipment_required.filter((item): item is string => typeof item === "string") : [] }));
  const labelForSource = (source: string) => source === "auto" ? "Automática" : source === "manual" ? "Manual" : "Copia personalizada";
  const routines = [...(activePlan ? [{ id: activePlan.id, name: activePlan.name, source: labelForSource(activePlan.source), updatedAt: activePlan.updated_at, active: true }] : []), ...(archivedPlans ?? []).map((plan) => ({ id: plan.id, name: plan.name, source: labelForSource(plan.source), updatedAt: plan.updated_at, active: false }))];
  return <><Link href="/workout/builder?setup=chooser" className="fixed right-5 top-5 z-50 rounded-full border border-[#d3dbcf] bg-[#f8f7f1] px-4 py-2 text-sm font-semibold text-[#18231f] shadow-sm hover:bg-white sm:right-8 sm:top-7">Cambiar rutina</Link><ManualWorkoutBuilder key={setup ?? "editor"} catalog={exercises} hasActivePlan={Boolean(activePlan)} routines={routines} /></>;
}