import { Check, Dumbbell, Flame, Scale } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { AssistantChat } from "@/components/assistant-chat";
import { CardioPanel } from "@/components/cardio-panel";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { GamificationPanel } from "@/components/gamification-panel";
import { GeneratePlanButton } from "@/components/generate-plan-button";
import { NutritionPlan } from "@/components/nutrition-plan";
import { NextStepPanel } from "@/components/next-step-panel";
import { PlanReviewNotices } from "@/components/plan-review-notices";
import { PersonalizationStatus } from "@/components/personalization-status";
import { ProgressPanel } from "@/components/progress-panel";
import { TrainingDaysPanel } from "@/components/training-days-panel";
import { WorkoutHistoryPanel } from "@/components/workout-history-panel";
import {
  computeGamification,
  computeStreaks,
} from "@/features/gamification/xp";
import {
  cardioByWorkoutDay,
  cardioRecommendations,
} from "@/features/planning/cardio";
import { foodAllowedForPlan } from "@/lib/food-restrictions";
import { foodRestrictionLabelsFromRestrictions } from "@/lib/food-restrictions";
import { injuryLabelsFromRestrictions } from "@/lib/injuries";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Day = {
  id: string;
  name: string;
  exerciseCount: number;
  muscleSummary: string;
  cardio?: { key: string; title: string; modalities: string[]; modality: string; durationMinutes: number; intensity: "Suave" | "Moderada" | "Intervalos"; effort: string };
};
type Meal = {
  id: string;
  name: string;
  suggestedTime: string | null;
  targetCalories: number;
  items: Array<{
    id: string;
    name: string;
    quantityGrams: number;
    role: string;
    alternativeGroup: string | null;
    selectedFoodName?: string;
    selectedQuantityGrams?: number;
  }>;
};
type Item = {
  id: string;
  meal_id: string;
  food_id: string;
  quantity_grams: number;
  role: string;
  alternative_group: string | null;
};

export const dynamic = "force-dynamic";

function nameFor(value: string) {
  return value.startsWith("Full Body")
    ? "Cuerpo completo"
    : value.startsWith("Upper")
      ? "Tren superior"
      : value.startsWith("Lower")
        ? "Tren inferior"
        : value;
}
function variantFor(value: string) {
  const match = value.match(/[A-Z]$/);
  return match ? `Variante ${match[0]}` : value;
}

export default async function DashboardPage() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1e9] text-center text-[#18231f]">
        <div>
          <h1 className="text-3xl font-semibold">Necesitas iniciar sesión</h1>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#18231f] px-5 py-3 text-sm font-semibold text-white"
          >
            Ir al acceso
          </Link>
        </div>
      </main>
    );
  void trackAnalyticsEvent(auth.user.id, "dashboard_viewed");
  const db = createAdminClient();
  const now = new Date();
  const [
    { data: profile },
    { data: activePlan },
    { data: nutrition },
    { data: measurements },
  ] = await Promise.all([
    db
      .from("profiles")
      .select(
        "primary_goal, experience, current_weight_kg, target_weight_kg, created_at, food_restrictions, restrictions, diet_preference, meals_out_slots, nutrition_plan_review_needed, workout_plan_review_needed",
      )
      .eq("user_id", auth.user.id)
      .maybeSingle(),
    db
      .from("workout_plans")
      .select("id, name")
      .eq("user_id", auth.user.id)
      .eq("active", true)
      .maybeSingle(),
    db
      .from("nutrition_plans")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("active", true)
      .maybeSingle(),
    db
      .from("body_measurements")
      .select(
        "id, measured_at, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm",
      )
      .eq("user_id", auth.user.id)
      .order("measured_at", { ascending: true }),
  ]);
  const cardioPlan = cardioRecommendations(
    typeof profile?.primary_goal === "string" ? profile.primary_goal : "",
    typeof profile?.experience === "string" ? profile.experience : "",
  );
  const { data: cardioPreferences } = await db
    .from("cardio_preferences")
    .select("session_key, workout_day_id, modality, duration_minutes, intensity, enabled")
    .eq("user_id", auth.user.id);
  const cardioPreferenceByKey = new Map(
    (cardioPreferences ?? []).map((preference) => [
      preference.session_key,
      preference,
    ]),
  );
  const plan =
    activePlan ??
    (
      await db
        .from("workout_plans")
        .select("id, name")
        .eq("user_id", auth.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data;
  let days: Day[] = [];
  let completedCount = 0;
  let completedToday = false;
  let planProfileSnapshot: Record<string, unknown> | null = null;
  if (plan) {
    const activeVersion = await db
      .from("workout_plan_versions")
      .select("id, profile_snapshot")
      .eq("workout_plan_id", plan.id)
      .eq("active", true)
      .maybeSingle();
    const version =
      activeVersion.data ??
      (
        await db
          .from("workout_plan_versions")
          .select("id, profile_snapshot")
          .eq("workout_plan_id", plan.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data;
    if (version) {
      planProfileSnapshot =
        version.profile_snapshot && typeof version.profile_snapshot === "object"
          ? (version.profile_snapshot as Record<string, unknown>)
          : null;
      const { data: savedDays } = await db
        .from("workout_days")
        .select("id, name")
        .eq("workout_plan_version_id", version.id)
        .order("order_number");
      const cardioSchedule = cardioByWorkoutDay(
        cardioPlan,
        savedDays?.length ?? 0,
      );
      const ids = savedDays?.map((day) => day.id) ?? [];
      const { data: exerciseRows } = await db
        .from("workout_exercises")
        .select("workout_day_id")
        .in("workout_day_id", ids);
      days = (savedDays ?? []).map((day, index) => {
        const cardio = cardioSchedule[index];
        const dayPreference = (cardioPreferences ?? []).find((item) => item.workout_day_id === day.id);
        const keyPreference = cardio ? cardioPreferenceByKey.get(cardio.key) : null;
        const preference = dayPreference ?? keyPreference;
        const cardioDisabled = preference?.enabled === false;
        const activePreference = preference?.enabled !== false ? preference : null;
        const configuredCardio = cardio && !cardioDisabled
          ? {
              ...cardio,
              modalities: [activePreference?.modality ?? cardio.modalities[0]],
              durationMinutes: activePreference?.duration_minutes ?? cardio.durationMinutes,
              intensity: ((activePreference?.intensity as typeof cardio.intensity | undefined) ?? cardio.intensity) as "Suave" | "Moderada" | "Intervalos",
            }
          : !cardio && activePreference
            ? {
                key: activePreference.session_key,
                title: "Cardio adicional",
                modalities: [activePreference.modality],
                durationMinutes: activePreference.duration_minutes,
                intensity: activePreference.intensity as "Suave" | "Moderada" | "Intervalos",
                effort: "Configuración añadida a este día de entrenamiento.",
              }
            : null;
        return {
          id: day.id,
          name: day.name,
          exerciseCount: (exerciseRows ?? []).filter(
            (row) => row.workout_day_id === day.id,
          ).length,
          muscleSummary: `Fuerza${configuredCardio ? ` · Cardio: ${configuredCardio.modalities[0]} ${configuredCardio.durationMinutes} min (${configuredCardio.intensity.toLowerCase()})` : ""}`,
          cardio: configuredCardio
            ? {
                key: configuredCardio.key,
                title: configuredCardio.title,
                modalities: configuredCardio.modalities,
                modality: configuredCardio.modalities[0],
                durationMinutes: configuredCardio.durationMinutes,
                intensity: configuredCardio.intensity,
                effort: configuredCardio.effort,
              }
            : undefined,
        };
      });
      const { data: sessions } = await db
        .from("workout_sessions")
        .select("completed_at")
        .eq("user_id", auth.user.id)
        .eq("completed", true)
        .in("workout_day_id", ids)
        .order("completed_at", { ascending: false });
      // El ciclo avanza por sesiones completadas, no por semana natural.
      completedCount = sessions?.length ?? 0;
      completedToday =
        sessions?.[0]?.completed_at?.slice(0, 10) ===
        now.toISOString().slice(0, 10);
    }
  }
  let nutritionVersion: {
    id: string;
    calories: number;
    protein_grams: number;
    carbs_grams: number;
    fats_grams: number;
    meal_count: number;
  } | null = null;
  let meals: Meal[] = [];
  let foodIds: Record<string, string> = {};
  let todayMealIds: string[] = [];
  let completedDates: string[] = [];
  if (nutrition) {
    const { data: version } = await db
      .from("nutrition_plan_versions")
      .select(
        "id, calories, protein_grams, carbs_grams, fats_grams, meal_count",
      )
      .eq("nutrition_plan_id", nutrition.id)
      .eq("active", true)
      .maybeSingle();
    nutritionVersion = version;
    if (version) {
      const [{ data: foods }, { data: savedMeals }] = await Promise.all([
        db.from("foods_catalog").select("id, name"),
        db
          .from("nutrition_meals")
          .select("id, name, suggested_time, target_calories")
          .eq("nutrition_plan_version_id", version.id)
          .order("meal_order"),
      ]);
      const foodMap = Object.fromEntries(
        (foods ?? []).map((food) => [food.id, food.name]),
      );
      foodIds = Object.fromEntries(
        (foods ?? []).map((food) => [food.name, food.id]),
      );
      const mealIds = savedMeals?.map((meal) => meal.id) ?? [];
      const { data: savedItems } = await db
        .from("nutrition_meal_items")
        .select("id, meal_id, food_id, quantity_grams, role, alternative_group")
        .in("meal_id", mealIds);
      const items = (savedItems ?? []) as Item[];
      const itemIds = items.map((item) => item.id);
      const { data: selections } = itemIds.length
        ? await db
            .from("nutrition_item_selections")
            .select("meal_item_id, selected_food_id, quantity_grams")
            .eq("user_id", auth.user.id)
            .in("meal_item_id", itemIds)
        : { data: [] };
      const selectionByItemId = new Map(
        (selections ?? []).map((selection) => [
          selection.meal_item_id,
          selection,
        ]),
      );
      meals = (savedMeals ?? []).map((meal) => ({
        id: meal.id,
        name: meal.name,
        suggestedTime: meal.suggested_time,
        targetCalories: meal.target_calories,
        items: items
          .filter((item) => item.meal_id === meal.id)
          .map((item) => {
            const selection = selectionByItemId.get(item.id);
            return {
              id: item.id,
              name: foodMap[item.food_id] ?? "Alimento",
              quantityGrams: item.quantity_grams,
              role: item.role,
              alternativeGroup: item.alternative_group,
              selectedFoodName: selection
                ? foodMap[selection.selected_food_id]
                : undefined,
              selectedQuantityGrams: selection?.quantity_grams,
            };
          }),
      }));
      const { data: completions } = await db
        .from("nutrition_meal_completions")
        .select("meal_id, completed_on")
        .eq("user_id", auth.user.id);
      const today = new Date().toISOString().slice(0, 10);
      todayMealIds = (completions ?? [])
        .filter((item) => item.completed_on === today)
        .map((item) => item.meal_id);
      const countByDate = new Map<string, number>();
      for (const item of completions ?? [])
        countByDate.set(
          item.completed_on,
          (countByDate.get(item.completed_on) ?? 0) + 1,
        );
      completedDates = [...countByDate.entries()]
        .filter(([, count]) => count >= meals.length)
        .map(([date]) => date);
    }
  }
  const scheduled = days.length ? days[completedCount % days.length] : null;
  const scheduledIndex = scheduled
    ? days.findIndex((day) => day.id === scheduled.id)
    : 0;
  const accountName =
    typeof auth.user.user_metadata?.name === "string"
      ? auth.user.user_metadata.name
      : "Mi cuenta";
  const foodRestrictions = Array.isArray(profile?.food_restrictions)
    ? profile.food_restrictions.filter(
        (restriction): restriction is string => typeof restriction === "string",
      )
    : [];
  const dietPreference =
    typeof profile?.diet_preference === "string"
      ? profile.diet_preference
      : "Omnívoro";
  const alternatives = {
    carb_base: [
      "Arroz cocido",
      "Pasta cocida",
      "Patata cocida",
      "Boniato cocido",
      "Quinoa cocida",
      "Cuscús cocido",
      "Tortitas de arroz",
    ],
    protein: [
      "Pechuga de pollo",
      "Pavo",
      "Ternera magra",
      "Salmón",
      "Atún al natural",
      "Tofu firme",
      "Tempeh",
      "Huevos",
      "Lentejas cocidas",
      "Garbanzos cocidos",
      "Yogur griego",
      "Skyr natural",
    ],
    vegetable: [
      "Brocoli",
      "Espinaca",
      "Calabacín",
      "Judías verdes",
      "Zanahoria",
      "Tomate",
      "Champiñones",
      "Espárragos",
    ],
    fat: [
      "Aceite de oliva",
      "Aguacate",
      "Almendras",
      "Crema de cacahuete",
      "Semillas de chía",
    ],
  };
  const safeAlternatives = Object.fromEntries(
    Object.entries(alternatives).map(([group, foods]) => [
      group,
      foods.filter((food) =>
        foodAllowedForPlan(food, foodRestrictions, dietPreference),
      ),
    ]),
  ) as Record<string, string[]>;
  const { data: loggedSessions } = await db
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("user_id", auth.user.id)
    .eq("completed", true)
    .order("completed_at", { ascending: true })
    .limit(200);
  const loggedSessionIds = (loggedSessions ?? []).map((session) => session.id);
  const { data: allLogs } = loggedSessionIds.length
    ? await db
        .from("exercise_logs")
        .select("workout_session_id, exercise_id, weight_kg, repetitions")
        .in("workout_session_id", loggedSessionIds)
        .eq("completed", true)
    : { data: [] };
  const sessionDateById = new Map(
    (loggedSessions ?? []).map((session) => [
      session.id,
      session.completed_at ?? "",
    ]),
  );
  const exerciseIdsWithLogs = [
    ...new Set((allLogs ?? []).map((log) => log.exercise_id)),
  ];
  const { data: exerciseNames } = exerciseIdsWithLogs.length
    ? await db
        .from("exercises")
        .select("id, name, muscle_groups")
        .in("id", exerciseIdsWithLogs)
    : { data: [] };
  const exerciseMetaById = new Map(
    (exerciseNames ?? []).map((exercise) => [
      exercise.id,
      {
        name: exercise.name,
        muscleGroups: Array.isArray(exercise.muscle_groups)
          ? exercise.muscle_groups.filter(
              (group): group is string => typeof group === "string",
            )
          : [],
      },
    ]),
  );
  const bestSetBySession = new Map<
    string,
    Map<string, { weightKg: number | null; reps: number | null; date: string }>
  >();
  for (const log of allLogs ?? []) {
    const sessionsForExercise =
      bestSetBySession.get(log.exercise_id) ??
      new Map<
        string,
        { weightKg: number | null; reps: number | null; date: string }
      >();
    const existing = sessionsForExercise.get(log.workout_session_id);
    if (!existing || (log.weight_kg ?? 0) > (existing.weightKg ?? 0))
      sessionsForExercise.set(log.workout_session_id, {
        weightKg: log.weight_kg,
        reps: log.repetitions,
        date: sessionDateById.get(log.workout_session_id) ?? "",
      });
    bestSetBySession.set(log.exercise_id, sessionsForExercise);
  }
  const exerciseProgress = [...bestSetBySession.entries()]
    .map(([exerciseId, sessionsMap]) => {
      const ordered = [...sessionsMap.values()].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      const latest = ordered[ordered.length - 1] ?? null;
      const previous = ordered.length > 1 ? ordered[ordered.length - 2] : null;
      const exerciseMeta = exerciseMetaById.get(exerciseId);
      return {
        exerciseId,
        name: exerciseMeta?.name ?? "Ejercicio",
        latestWeightKg: latest?.weightKg ?? null,
        latestReps: latest?.reps ?? null,
        previousWeightKg: previous?.weightKg ?? null,
        sessionsLogged: ordered.length,
        muscleGroups: exerciseMeta?.muscleGroups ?? [],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const measurementEntries =
    (measurements ?? []).length > 0
      ? (measurements ?? []).map((entry) => ({
          id: entry.id,
          measuredAt: entry.measured_at,
          weightKg: entry.weight_kg,
          waistCm: entry.waist_cm,
          chestCm: entry.chest_cm,
          armCm: entry.arm_cm,
          thighCm: entry.thigh_cm,
        }))
      : profile?.current_weight_kg
        ? [
            {
              id: "onboarding",
              measuredAt: (profile.created_at ?? now.toISOString()).slice(
                0,
                10,
              ),
              weightKg: profile.current_weight_kg,
              waistCm: null,
              chestCm: null,
              armCm: null,
              thighCm: null,
            },
          ]
        : [];
  const sortedMeasurements = [...measurementEntries].sort((a, b) =>
    a.measuredAt.localeCompare(b.measuredAt),
  );
  const firstMeasurement = sortedMeasurements[0] ?? null;
  const latestMeasurement =
    sortedMeasurements[sortedMeasurements.length - 1] ?? null;
  const displayedPrimaryGoal =
    typeof profile?.primary_goal === "string" && profile.primary_goal.trim()
      ? profile.primary_goal
      : typeof planProfileSnapshot?.primary_goal === "string"
        ? planProfileSnapshot.primary_goal
        : "";
  const displayedTargetWeightKg =
    profile?.target_weight_kg ??
    (typeof planProfileSnapshot?.target_weight_kg === "number"
      ? planProfileSnapshot.target_weight_kg
      : null);
  const weightDelta =
    firstMeasurement && latestMeasurement && sortedMeasurements.length > 1
      ? latestMeasurement.weightKg - firstMeasurement.weightKg
      : 0;
  const lastMeasuredAt = latestMeasurement?.measuredAt ?? null;
  const daysSinceLastMeasurement = lastMeasuredAt
    ? Math.floor(
        (now.getTime() - new Date(`${lastMeasuredAt}T00:00:00Z`).getTime()) /
          86400000,
      )
    : null;
  const { count: workoutSessionsCount } = await db
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("completed", true);
  const activityDates = [
    ...(loggedSessions ?? []).map((session) =>
      (session.completed_at ?? "").slice(0, 10),
    ),
    ...(measurements ?? []).map((entry) => entry.measured_at),
  ];
  const { current: currentStreak, best: bestStreak } =
    computeStreaks(activityDates);
  const gamification = computeGamification({
    workoutSessionsCount: workoutSessionsCount ?? 0,
    measurementsCount: (measurements ?? []).length,
    bestStreak,
    weightDeltaKg: sortedMeasurements.length > 1 ? weightDelta : null,
  });
  const overview = (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl bg-[#18231f] p-6 text-white">
          <Dumbbell className="text-[#d7f36b]" />
          <p className="mt-10 text-sm text-[#b9c2b7]">
            {completedToday ? "Completado hoy" : "Entrenamiento de hoy"}
          </p>
          {scheduled ? (
            <>
              <span className="mt-3 inline-flex rounded-full bg-[#d7f36b] px-3 py-1 text-xs font-bold text-[#18231f]">
                {completedToday ? "Próximo" : "Toca ahora"} · Día{" "}
                {scheduledIndex + 1} de {days.length}
              </span>
              <h2 className="mt-3 text-2xl font-semibold">
                {nameFor(scheduled.name)}
              </h2>
              <p className="mt-2 text-sm text-[#c8d0c5]">
                {variantFor(scheduled.name)} · {scheduled.muscleSummary}
              </p>
              {completedToday ? (
                <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#b9c2b7]">
                  <Check size={14} /> Disponible mañana
                </span>
              ) : (
                <Link
                  href={`/workout/${scheduled.id}`}
                  className="mt-6 inline-flex rounded-full bg-[#d7f36b] px-4 py-2 text-sm font-semibold text-[#18231f]"
                >
                  Comenzar sesión
                </Link>
              )}
            </>
          ) : (
            <h2 className="mt-2 text-2xl font-semibold">Aún por generar</h2>
          )}
        </section>
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <Flame className="text-[#72873f]" />
          <p className="mt-10 text-sm text-[#819078]">Nutrición diaria</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {nutritionVersion
              ? `${nutritionVersion.calories} kcal`
              : "Pendiente"}
          </h2>
          {nutritionVersion ? (
            <div className="mt-3 flex gap-3 text-xs text-[#68736b]">
              <span>
                <strong className="text-[#18231f]">
                  {Math.round(nutritionVersion.protein_grams)}g
                </strong>{" "}
                proteína
              </span>
              <span>
                <strong className="text-[#18231f]">
                  {Math.round(nutritionVersion.carbs_grams)}g
                </strong>{" "}
                carbos
              </span>
              <span>
                <strong className="text-[#18231f]">
                  {Math.round(nutritionVersion.fats_grams)}g
                </strong>{" "}
                grasas
              </span>
            </div>
          ) : null}
          {nutritionVersion && meals.length > 0 ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[#68736b]">
                <span>
                  {todayMealIds.length >= meals.length
                    ? "Día completado"
                    : "Día pendiente"}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e3e7dd]">
                <div
                  className="h-full rounded-full bg-[#72873f] transition-all"
                  style={{
                    width: todayMealIds.length >= meals.length ? "100%" : "0%",
                  }}
                />
              </div>
            </div>
          ) : null}
        </section>
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <Scale className="text-[#72873f]" />
          <p className="mt-10 text-sm text-[#819078]">Punto de partida</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {latestMeasurement ? `${latestMeasurement.weightKg} kg` : "-"}
          </h2>
          <p className="mt-3 text-sm text-[#68736b]">
            Objetivo: {displayedPrimaryGoal || "Objetivo pendiente"}
          </p>
          {sortedMeasurements.length > 1 ? (
            <p
              className={`mt-2 text-sm font-semibold ${weightDelta === 0 ? "text-[#68736b]" : weightDelta < 0 ? "text-[#72873f]" : "text-[#a06a3a]"}`}
            >
              {weightDelta === 0
                ? "Sin cambios de peso"
                : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg desde el inicio`}
            </p>
          ) : null}
          {displayedTargetWeightKg && latestMeasurement ? (
            <p className="mt-1 text-xs text-[#819078]">
              {Math.abs(
                latestMeasurement.weightKg - displayedTargetWeightKg,
              ).toFixed(1)}{" "}
              kg del objetivo ({displayedTargetWeightKg} kg)
            </p>
          ) : null}
        </section>
      </div>
      <GamificationPanel
        level={gamification.level}
        xp={gamification.xp}
        xpIntoLevel={gamification.xpIntoLevel}
        xpForNextLevel={gamification.xpForNextLevel}
        progressPercent={gamification.progressPercent}
        isMaxLevel={gamification.isMaxLevel}
        currentStreak={currentStreak}
        bestStreak={bestStreak}
        achievements={gamification.achievements}
      />
    </>
  );
  const training = (
    <TrainingDaysPanel
      days={days}
      scheduledId={scheduled?.id ?? null}
      scheduledIndex={scheduledIndex}
      completedToday={completedToday}
      nameFor={nameFor}
      variantFor={variantFor}
    />
  );
  const nutritionView = nutritionVersion ? (
    <NutritionPlan
      foodIds={foodIds}
      mealCount={nutritionVersion.meal_count}
      todayCompletedMealIds={todayMealIds}
      completedDates={completedDates}
      meals={meals}
      alternatives={safeAlternatives}
      mealsOutSlots={
        Array.isArray(profile?.meals_out_slots)
          ? profile.meals_out_slots.filter(
              (slot): slot is string => typeof slot === "string",
            )
          : []
      }
    />
  ) : (
    <div>
      <GeneratePlanButton />
    </div>
  );
  const cardioView = (
    <CardioPanel
      recommendations={days.flatMap((day) => day.cardio ? [{ ...day.cardio, workoutDayId: day.id }] : [])}
      availableDays={days.map((day) => ({ id: day.id, label: `${nameFor(day.name)} · Día ${days.findIndex((item) => item.id === day.id) + 1}` }))}
      initialConfigurations={Object.fromEntries(
        (cardioPreferences ?? []).filter((preference) => preference.enabled !== false).map((preference) => [
          preference.session_key,
          {
            modality: preference.modality,
            duration: preference.duration_minutes,
            intensity: preference.intensity as
              "Suave" | "Moderada" | "Intervalos",
          },
        ]),
      )}
    />
  );
  const progress = (
    <ProgressPanel
      key={displayedTargetWeightKg ?? "no-target"}
      entries={measurementEntries}
      targetWeightKg={displayedTargetWeightKg}
      primaryGoal={displayedPrimaryGoal}
      daysSinceLastMeasurement={daysSinceLastMeasurement}
    />
  );
  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader
          email={auth.user.email ?? ""}
          name={accountName}
          daysSinceLastMeasurement={daysSinceLastMeasurement}
          hasProfile={Boolean(profile)}
          workoutLabel={scheduled ? nameFor(scheduled.name) : null}
          workoutHref={scheduled ? `/workout/${scheduled.id}` : null}
          workoutDue={Boolean(scheduled && !completedToday)}
        />
        <section className="mt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">
            Tu espacio de progreso
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em] sm:text-7xl">
            Un paso cada vez.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#68736b]">
            Tu planificación reúne entrenamiento, nutrición y seguimiento en un
            solo lugar.
          </p>
          <PlanReviewNotices
            nutritionPending={Boolean(profile?.nutrition_plan_review_needed)}
            workoutPending={Boolean(profile?.workout_plan_review_needed)}
          />
          <NextStepPanel
            completedToday={completedToday}
            workoutLabel={scheduled ? nameFor(scheduled.name) : null}
            workoutHref={scheduled ? `/workout/${scheduled.id}` : null}
            hasProfile={Boolean(profile)}
          />
          <PersonalizationStatus
            initialInjuries={injuryLabelsFromRestrictions(
              profile?.restrictions,
            )}
            initialFoodRestrictions={foodRestrictionLabelsFromRestrictions(
              profile?.food_restrictions,
            )}
          />
          <DashboardTabs
            overview={overview}
            training={
              <>
                {training}
                {cardioView}
                <WorkoutHistoryPanel exerciseProgress={exerciseProgress} />
              </>
            }
            nutrition={nutritionView}
            progress={progress}
          />
        </section>
      </div>
      <AssistantChat />
    </main>
  );
}
