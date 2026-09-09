import { notFound, redirect } from "next/navigation";

import { WorkoutPlayerRebuilt } from "@/components/workout-player-rebuilt";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const exerciseMedia: Record<string, [string, string]> = {
  "Sentadilla goblet": ["/exercises/goblet-squat-start.jpg", "/exercises/goblet-squat-end.jpg"],
  "Prensa de piernas": ["/exercises/leg-press-start.jpg", "/exercises/leg-press-end.jpg"],
  Sentadilla: ["/exercises/barbell-squat-start.jpg", "/exercises/barbell-squat-end.jpg"],
  "Press banca con mancuernas": ["/exercises/dumbbell-bench-press-start.jpg", "/exercises/dumbbell-bench-press-end.jpg"],
  "Press inclinado": ["/exercises/incline-bench-press-start.jpg", "/exercises/incline-bench-press-end.jpg"],
  "Press banca": ["/exercises/barbell-bench-press-start.jpg", "/exercises/barbell-bench-press-end.jpg"],
  "Jalon al pecho": ["/exercises/lat-pulldown-start.jpg", "/exercises/lat-pulldown-end.jpg"],
  "Remo con mancuerna": ["/exercises/dumbbell-row-start.jpg", "/exercises/dumbbell-row-end.jpg"],
  "Remo con barra": ["/exercises/barbell-row-start.jpg", "/exercises/barbell-row-end.jpg"],
  "Peso muerto rumano": ["/exercises/romanian-deadlift-start.jpg", "/exercises/romanian-deadlift-end.jpg"],
  Plancha: ["/exercises/plank-start.jpg", "/exercises/plank-end.jpg"],
  "Elevaciones laterales": ["/exercises/lateral-raise-start.jpg", "/exercises/lateral-raise-end.jpg"],
  "Curl femoral": ["/exercises/lying-leg-curl-start.jpg", "/exercises/lying-leg-curl-end.jpg"],
  "Press militar con mancuernas": ["/exercises/dumbbell-shoulder-press-start.jpg", "/exercises/dumbbell-shoulder-press-end.jpg"],
  "Pallof press": ["/exercises/pallof-press-start.jpg", "/exercises/pallof-press-end.jpg"],
  "Hip thrust": ["/exercises/barbell-hip-thrust-start.jpg", "/exercises/barbell-hip-thrust-end.jpg"],
  "Curl de biceps": ["/exercises/dumbbell-bicep-curl-start.jpg", "/exercises/dumbbell-bicep-curl-end.jpg"],
  Flexiones: ["/exercises/pushups-start.jpg", "/exercises/pushups-end.jpg"],
  "Aperturas en polea": ["/exercises/cable-flyes-start.jpg", "/exercises/cable-flyes-end.jpg"],
  "Fondos para pecho": ["/exercises/chest-dips-start.jpg", "/exercises/chest-dips-end.jpg"],
  Dominadas: ["/exercises/pullups-start.jpg", "/exercises/pullups-end.jpg"],
  "Remo sentado en polea": ["/exercises/seated-cable-row-start.jpg", "/exercises/seated-cable-row-end.jpg"],
  "Jalón de brazos rectos": ["/exercises/straight-arm-pulldown-start.jpg", "/exercises/straight-arm-pulldown-end.jpg"],
  "Face pull": ["/exercises/face-pull-start.jpg", "/exercises/face-pull-end.jpg"],
  "Pájaros con mancuernas": ["/exercises/rear-delt-fly-start.jpg", "/exercises/rear-delt-fly-end.jpg"],
  "Elevaciones frontales": ["/exercises/front-raise-start.jpg", "/exercises/front-raise-end.jpg"],
  "Curl con barra": ["/exercises/barbell-curl-start.jpg", "/exercises/barbell-curl-end.jpg"],
  "Curl martillo": ["/exercises/hammer-curl-start.jpg", "/exercises/hammer-curl-end.jpg"],
  "Curl predicador": ["/exercises/preacher-curl-start.jpg", "/exercises/preacher-curl-end.jpg"],
  "Fondos para tríceps": ["/exercises/triceps-dips-start.jpg", "/exercises/triceps-dips-end.jpg"],
  "Extensión de tríceps por encima de la cabeza": ["/exercises/overhead-triceps-extension-start.jpg", "/exercises/overhead-triceps-extension-end.jpg"],
  "Extensión de tríceps en polea": ["/exercises/triceps-pushdown-start.jpg", "/exercises/triceps-pushdown-end.jpg"],
  "Zancadas con barra": ["/exercises/barbell-lunge-start.jpg", "/exercises/barbell-lunge-end.jpg"],
  "Extensión de cuádriceps": ["/exercises/leg-extension-start.jpg", "/exercises/leg-extension-end.jpg"],
  "Sentadilla dividida con mancuernas": ["/exercises/dumbbell-split-squat-start.jpg", "/exercises/dumbbell-split-squat-end.jpg"],
  "Buenos días": ["/exercises/good-morning-start.jpg", "/exercises/good-morning-end.jpg"],
  "Puente de glúteos con barra": ["/exercises/barbell-glute-bridge-start.jpg", "/exercises/barbell-glute-bridge-end.jpg"],
  "Aducción de cadera en polea": ["/exercises/cable-hip-adduction-start.jpg", "/exercises/cable-hip-adduction-end.jpg"],
  "Crunch abdominal": ["/exercises/crunch-start.jpg", "/exercises/crunch-end.jpg"],
  "Elevación de piernas colgado": ["/exercises/hanging-leg-raise-start.jpg", "/exercises/hanging-leg-raise-end.jpg"],
  "Giros rusos en polea": ["/exercises/cable-russian-twist-start.jpg", "/exercises/cable-russian-twist-end.jpg"],
  "Crunch en polea": ["/exercises/cable-crunch-start.jpg", "/exercises/cable-crunch-end.jpg"],
  Hiperextensiones: ["/exercises/hyperextension-start.jpg", "/exercises/hyperextension-end.jpg"],
  "Elevación de gemelos de pie": ["/exercises/standing-calf-raise-start.jpg", "/exercises/standing-calf-raise-end.jpg"],
  "Elevación de gemelos sentado": ["/exercises/seated-calf-raise-start.jpg", "/exercises/seated-calf-raise-end.jpg"],
};
const fallbackMedia: [string, string] = ["/exercises/goblet-squat-start.jpg", "/exercises/goblet-squat-end.jpg"];

type Props = { params: Promise<{ dayId: string }> };
type PreviousLog = { exerciseId: string; setNumber: number; weightKg: number; repetitions: number };

export default async function WorkoutDayPage({ params }: Props) {
  const { dayId } = await params;
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) redirect("/login");

  const client = createAdminClient();
  const { data: day } = await client.from("workout_days").select("id, name, workout_plan_version_id").eq("id", dayId).single();
  const { data: version } = day ? await client.from("workout_plan_versions").select("workout_plan_id").eq("id", day.workout_plan_version_id).single() : { data: null };
  const { data: plan } = version ? await client.from("workout_plans").select("user_id").eq("id", version.workout_plan_id).single() : { data: null };
  if (!day || plan?.user_id !== authData.user.id) notFound();
  const { data: completedDaySession } = await client.from("workout_sessions").select("completed_at").eq("user_id", authData.user.id).eq("workout_day_id", day.id).eq("completed", true).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  if (completedDaySession?.completed_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)) redirect("/dashboard");

  const { data: workoutExercises } = await client.from("workout_exercises").select("exercise_id, sets, repetitions, rest_seconds, order_number").eq("workout_day_id", day.id).order("order_number");
  const exerciseIds = workoutExercises?.map((exercise) => exercise.exercise_id) ?? [];
  const { data: catalog } = exerciseIds.length > 0 ? await client.from("exercises").select("id, name, image_start_url, image_end_url").in("id", exerciseIds) : { data: [] };
  const exercises = (workoutExercises ?? []).map((exercise) => {
    const catalogExercise = (catalog ?? []).find((item) => item.id === exercise.exercise_id);
    const name = catalogExercise?.name ?? "Ejercicio";
    const databaseMedia = catalogExercise?.image_start_url && catalogExercise?.image_end_url ? [catalogExercise.image_start_url, catalogExercise.image_end_url] as [string, string] : null;
    return { id: exercise.exercise_id, name, sets: exercise.sets, repetitions: exercise.repetitions, restSeconds: exercise.rest_seconds, media: databaseMedia ?? exerciseMedia[name] ?? fallbackMedia };
  });
  const { data: previousSession } = await client.from("workout_sessions").select("id").eq("user_id", authData.user.id).eq("workout_day_id", day.id).eq("completed", true).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  const { data: previousLogs } = previousSession ? await client.from("exercise_logs").select("exercise_id, set_number, weight_kg, repetitions").eq("workout_session_id", previousSession.id).order("set_number") : { data: [] };
  const lastPerformance: PreviousLog[] = (previousLogs ?? []).map((log) => ({ exerciseId: log.exercise_id, setNumber: log.set_number, weightKg: log.weight_kg ?? 0, repetitions: log.repetitions }));

  return <WorkoutPlayerRebuilt workoutDayId={day.id} workoutName={day.name} exercises={exercises} lastPerformance={lastPerformance} />;
}
