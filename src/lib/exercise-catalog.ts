import { createAdminClient } from "@/lib/supabase/admin";

export type PlanningCatalogExercise = {
  name: string;
  primaryMuscle: string | null;
  muscleGroups: string[];
  restrictions: string[];
  equipment: string[];
};

export async function getPlanningExerciseCatalog() {
  const db = createAdminClient();
  const { data, error } = await db.from("exercises").select("name, primary_muscle, muscle_groups, restrictions, equipment_required").order("name");
  if (error) throw error;
  return (data ?? []).map((exercise) => ({
    name: exercise.name,
    primaryMuscle: exercise.primary_muscle,
    muscleGroups: Array.isArray(exercise.muscle_groups) ? exercise.muscle_groups.filter((group): group is string => typeof group === "string") : [],
    restrictions: Array.isArray(exercise.restrictions) ? exercise.restrictions.filter((restriction): restriction is string => typeof restriction === "string") : [],
    equipment: Array.isArray(exercise.equipment_required) ? exercise.equipment_required.filter((item): item is string => typeof item === "string") : [],
  }));
}