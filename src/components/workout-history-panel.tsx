"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Minus, TrendingDown, TrendingUp } from "lucide-react";

type ExerciseProgress = {
  exerciseId: string;
  name: string;
  latestWeightKg: number | null;
  latestReps: number | null;
  previousWeightKg: number | null;
  sessionsLogged: number;
  muscleGroups: string[];
};

type WorkoutHistoryPanelProps = { exerciseProgress: ExerciseProgress[] };

const muscleOrder = ["pecho", "espalda", "piernas", "gluteos", "hombros", "biceps", "triceps", "core", "isquios"];
const STORAGE_KEY = "momentum:training:show-muscle-analysis";

function formatMuscleName(value: string) {
  const labels: Record<string, string> = {
    pecho: "Pecho",
    espalda: "Espalda",
    piernas: "Piernas",
    gluteos: "Glúteos",
    hombros: "Hombros",
    biceps: "Bíceps",
    triceps: "Tríceps",
    core: "Core",
    isquios: "Isquios"
  };
  return labels[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

function formatWeight(value: number | null) {
  if (value === null) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function averageDelta(exercises: ExerciseProgress[]) {
  const deltas = exercises
    .map((exercise) => {
      if (exercise.latestWeightKg === null || exercise.previousWeightKg === null) return null;
      return exercise.latestWeightKg - exercise.previousWeightKg;
    })
    .filter((delta): delta is number => delta !== null);

  if (deltas.length === 0) return null;
  return deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
}

function averageLatestWeight(exercises: ExerciseProgress[]) {
  const values = exercises.map((exercise) => exercise.latestWeightKg).filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageLatestReps(exercises: ExerciseProgress[]) {
  const values = exercises.map((exercise) => exercise.latestReps).filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function WorkoutHistoryPanel({ exerciseProgress }: WorkoutHistoryPanelProps) {
  const [showAnalysis, setShowAnalysis] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "open";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, showAnalysis ? "open" : "closed");
  }, [showAnalysis]);

  if (exerciseProgress.length === 0) return null;

  const groupedByMuscle = new Map<string, ExerciseProgress[]>();
  for (const exercise of exerciseProgress) {
    const primaryMuscle = exercise.muscleGroups[0] ?? "general";
    const current = groupedByMuscle.get(primaryMuscle) ?? [];
    current.push(exercise);
    groupedByMuscle.set(primaryMuscle, current);
  }

  const sortedGroups = [...groupedByMuscle.entries()].sort(([a], [b]) => {
    const aIndex = muscleOrder.indexOf(a);
    const bIndex = muscleOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <section className="mt-8 rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Análisis de progreso</h3>
          <p className="mt-1 text-sm text-[#68736b]">Opcional: ábrelo cuando quieras revisar tendencias por músculo.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAnalysis((current) => !current)}
          className="rounded-full border border-[#d3dbcf] bg-white px-4 py-2 text-sm font-semibold text-[#18231f] transition-colors hover:bg-[#f1f4ec]"
        >
          {showAnalysis ? "Ocultar análisis" : "Ver análisis de progreso"}
        </button>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${showAnalysis ? "mt-4 max-h-[2800px] opacity-100" : "max-h-0 opacity-0"}`}>
        <section className="rounded-2xl border border-[#e3e7dd] bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold">Progresión por músculo</h4>
              <p className="mt-1 text-sm text-[#68736b]">Despliega cada grupo para ver solo lo que te interesa ahora.</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">{exerciseProgress.length} ejercicios con registro</p>
          </div>

          <div className="mt-4 space-y-3">
            {sortedGroups.map(([muscle, exercises], index) => (
              <details key={muscle} open={index === 0} className="group rounded-2xl border border-[#e3e7dd] bg-[#fdfdfb] px-4 py-3">
            {(() => {
              const avgDelta = averageDelta(exercises);
              const avgWeight = averageLatestWeight(exercises);
              const avgReps = averageLatestReps(exercises);
              const sessionsTotal = exercises.reduce((sum, exercise) => sum + exercise.sessionsLogged, 0);
              const improvingCount = exercises.filter((exercise) => exercise.latestWeightKg !== null && exercise.previousWeightKg !== null && exercise.latestWeightKg > exercise.previousWeightKg).length;
              const orderedNames = exercises.map((exercise) => exercise.name).sort((a, b) => a.localeCompare(b));
              const visibleNames = orderedNames.slice(0, 3);
              const remainingNames = orderedNames.length - visibleNames.length;
              const trendLabel = avgDelta === null || avgDelta === 0
                ? "estable"
                : avgDelta > 0
                  ? `+${formatWeight(avgDelta)} kg medio`
                  : `${formatWeight(avgDelta)} kg medio`;
              const trendTone = avgDelta === null || avgDelta === 0
                ? "text-[#819078]"
                : avgDelta > 0
                  ? "text-[#72873f]"
                  : "text-[#a06a3a]";
              const statusLabel = avgDelta === null || avgDelta === 0
                ? "Manteniendo"
                : avgDelta > 0
                  ? "En alza"
                  : "A revisar";
              const statusTone = avgDelta === null || avgDelta === 0
                ? "bg-[#eef1ea] text-[#5f6b63]"
                : avgDelta > 0
                  ? "bg-[#e7f5b4] text-[#304a17]"
                  : "bg-[#f6e8de] text-[#7a3f1f]";

              return (
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{formatMuscleName(muscle)}</p>
                <p className="text-xs text-[#819078]">{exercises.length} ejercicios · {sessionsTotal} sesiones</p>
                <p className="mt-1 truncate text-xs text-[#68736b]">{visibleNames.join(" · ")}{remainingNames > 0 ? ` · +${remainingNames} más` : ""}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusTone}`}>{statusLabel}</span>
                  <span className={`text-xs font-semibold ${trendTone}`}>{trendLabel}</span>
                  <span className="text-xs text-[#68736b] sm:hidden">{improvingCount}/{exercises.length} en subida</span>
                  <span className="hidden text-xs text-[#68736b] sm:inline">{avgWeight === null ? "-" : `${formatWeight(avgWeight)} kg`} media</span>
                  <span className="hidden text-xs text-[#68736b] sm:inline">{avgReps === null ? "-" : `${formatWeight(avgReps)} reps`} medias</span>
                  <span className="hidden text-xs text-[#68736b] sm:inline">{improvingCount}/{exercises.length} en subida</span>
                </div>
              </div>
              <ChevronDown size={16} className="text-[#68736b] transition-transform duration-200 group-open:rotate-180" />
            </summary>
              );
            })()}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {exercises
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((exercise) => {
                  const delta = exercise.latestWeightKg !== null && exercise.previousWeightKg !== null ? exercise.latestWeightKg - exercise.previousWeightKg : null;
                  return (
                    <div key={exercise.exerciseId} className="rounded-xl border border-[#e9ede4] bg-[#fdfdfb] p-3">
                      <p className="text-sm font-semibold">{exercise.name}</p>
                      <p className="mt-1 text-base font-semibold">{formatWeight(exercise.latestWeightKg)} kg <span className="text-xs font-normal text-[#68736b]">x {exercise.latestReps ?? "-"} reps</span></p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-[#819078]">
                        {delta === null || delta === 0 ? <Minus size={13} /> : delta > 0 ? <TrendingUp size={13} className="text-[#72873f]" /> : <TrendingDown size={13} className="text-[#a06a3a]" />}
                        {delta === null || delta === 0 ? `${exercise.sessionsLogged} sesiones registradas` : `${delta > 0 ? "+" : ""}${formatWeight(delta)} kg vs sesión anterior`}
                      </p>
                    </div>
                  );
                })}
            </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
