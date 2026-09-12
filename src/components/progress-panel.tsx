"use client";

import { useMemo, useState } from "react";

import { goalDirection } from "@/lib/goal-direction";

type MeasurementEntry = {
  id: string;
  measuredAt: string;
  weightKg: number;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
};

type ProgressPanelProps = {
  entries: MeasurementEntry[];
  targetWeightKg: number | null;
  primaryGoal: string;
  daysSinceLastMeasurement: number | null;
};

function daysAgo(measuredAt: string) {
  return Math.floor((new Date().getTime() - new Date(`${measuredAt}T00:00:00Z`).getTime()) / 86400000);
}

function closestEntryNearDaysAgo(sorted: MeasurementEntry[], targetDays: number, toleranceDays: number) {
  let best: MeasurementEntry | null = null;
  let bestDiff = Infinity;
  for (const entry of sorted) {
    const diff = Math.abs(daysAgo(entry.measuredAt) - targetDays);
    if (diff <= toleranceDays && diff < bestDiff) { best = entry; bestDiff = diff; }
  }
  return best;
}

export function ProgressPanel({ entries, primaryGoal, daysSinceLastMeasurement }: ProgressPanelProps) {
  const history = entries;
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null);

  const sorted = useMemo(() => [...history].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)), [history]);
  const normalizedPrimaryGoal = primaryGoal.trim();
  const hasPrimaryGoal = normalizedPrimaryGoal.length > 0;
  const latest = sorted[sorted.length - 1];
  const direction = hasPrimaryGoal ? goalDirection(normalizedPrimaryGoal) : "neutral";

  const referenceEntry = latest ? closestEntryNearDaysAgo(sorted, 21, 6) : null;
  const stagnationDelta = referenceEntry && latest ? latest.weightKg - referenceEntry.weightKg : null;
  const isStagnant = hasPrimaryGoal && direction !== "neutral" && stagnationDelta !== null && (direction === "up" ? stagnationDelta <= 0 : stagnationDelta >= 0);


  async function requestAdjustment() {
    setIsAdjusting(true);
    setAdjustMessage(null);
    const response = await fetch("/api/plans/adjust", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setIsAdjusting(false);
    if (!response.ok || !data.adjusted) {
      const messages: Record<string, string> = {
        on_track: "Al comprobarlo con más detalle (incluyendo tu entrenamiento), tu progreso va bien: no hemos hecho cambios.",
        insufficient_data: "Aún no hay suficientes semanas de datos para decidir con fiabilidad. Sigue registrando tu peso.",
        low_compliance: "Antes de ajustar el plan, intenta seguirlo con más regularidad: los cambios solo son fiables si hay constancia.",
      };
      setAdjustMessage(messages[data.reason] ?? "No hemos podido reajustar tu plan. Inténtalo de nuevo más tarde.");
      return;
    }
    const parts: string[] = [];
    if (data.nutritionAdjusted) parts.push(`tu dieta ahora tiene ${data.calories} kcal`);
    if (data.workoutAdjusted) parts.push("hemos ajustado los ejercicios estancados de tu rutina (más series, otro rango de repeticiones o sustitución)");
    setAdjustMessage(`Listo: ${parts.join(" y ")}.`);
  }

  return (
    <div className="space-y-6">
      {isStagnant ? (
        <div className="rounded-2xl border-2 border-[#c0492f] bg-[#f9e2da] px-4 py-4">
          <p className="text-sm font-semibold text-[#7a2e1a]">Llevas unas 3 semanas sin avanzar hacia tu objetivo de {normalizedPrimaryGoal.toLowerCase()}.</p>
          <p className="mt-1 text-sm text-[#7a2e1a]">Podemos reajustar tu dieta y tu rutina para desbloquear el progreso.</p>
          <button type="button" disabled={isAdjusting} onClick={requestAdjustment} className="mt-3 rounded-full bg-[#18231f] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isAdjusting ? "Reajustando..." : "Reajustar plan"}
          </button>
          {adjustMessage ? <p className="mt-2 text-sm font-semibold text-[#7a2e1a]">{adjustMessage}</p> : null}
        </div>
      ) : null}

      {daysSinceLastMeasurement !== null && daysSinceLastMeasurement >= 14 ? (
        <p className="rounded-2xl border border-[#e3c9a8] bg-[#f7ead9] px-4 py-3 text-sm font-semibold text-[#7a5326]">
          Han pasado {daysSinceLastMeasurement} días desde tu último registro. Recomendado: revisar y actualizar tu evolución cada 2-3 semanas.
        </p>
      ) : null}

    </div>
  );
}
