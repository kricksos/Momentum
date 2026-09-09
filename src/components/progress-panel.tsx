"use client";

import { ArrowRight, Plus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function WeightChart({ entries }: { entries: MeasurementEntry[] }) {
  if (entries.length < 2) return <p className="mt-4 text-sm text-[#68736b]">Registra al menos dos pesajes para ver tu evolución en un gráfico.</p>;

  const width = 640;
  const height = 160;
  const padding = 12;
  const weights = entries.map((entry) => entry.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;
  const points = entries.map((entry, index) => {
    const x = padding + (index / (entries.length - 1)) * (width - padding * 2);
    const y = height - padding - ((entry.weightKg - min) / span) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full">
      <polyline fill="none" stroke="#72873f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" points={points.join(" ")} />
      {entries.map((entry, index) => {
        const [x, y] = points[index].split(",");
        return <circle key={entry.id} cx={x} cy={y} r={4} fill="#18231f" />;
      })}
    </svg>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const width = 120;
  const height = 34;
  const padding = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / span) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-9 w-28">
      <polyline fill="none" stroke="#72873f" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" points={points.join(" ")} />
    </svg>
  );
}

type BodyMetric = { label: string; accessor: (entry: MeasurementEntry) => number | null };
const bodyMetrics: BodyMetric[] = [
  { label: "Cintura", accessor: (entry) => entry.waistCm },
  { label: "Pecho", accessor: (entry) => entry.chestCm },
  { label: "Brazo", accessor: (entry) => entry.armCm },
  { label: "Muslo", accessor: (entry) => entry.thighCm },
];

function metricSummary(sorted: MeasurementEntry[], metric: BodyMetric) {
  const withValue = sorted.filter((entry) => metric.accessor(entry) !== null);
  if (withValue.length === 0) return null;
  const latestEntry = withValue[withValue.length - 1];
  const previousEntry = withValue.length > 1 ? withValue[withValue.length - 2] : null;
  const latestValue = metric.accessor(latestEntry) as number;
  const delta = previousEntry ? latestValue - (metric.accessor(previousEntry) as number) : null;
  return { latestValue, delta, measuredAt: latestEntry.measuredAt };
}

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

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.floor((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000));
}

function formatMeasure(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

type MetricPreference = "up" | "down" | "neutral";

const positiveMessages = ["Fenomenal", "Maravilloso", "Muy bien", "Excelente", "Gran trabajo"];

function messageIndex(seed: string) {
  return [...seed].reduce((total, character) => total + character.charCodeAt(0), 0) % positiveMessages.length;
}

function metricPreference(direction: "up" | "down" | "neutral", metricLabel: string): MetricPreference {
  if (direction === "up") return metricLabel === "Cintura" ? "neutral" : "up";
  if (direction === "down") return metricLabel === "Cintura" ? "down" : "neutral";
  return "neutral";
}

function metricTone(delta: number | null, preference: MetricPreference, seed: string) {
  if (delta === null || Math.abs(delta) < 0.2) {
    return { label: "Estable", tone: "text-[#68736b]", badge: "bg-[#eef1ea] text-[#5e6a62]", icon: "stable" as const };
  }

  if (preference === "up") {
    if (delta > 0) return { label: positiveMessages[messageIndex(seed)], tone: "text-[#3f611d]", badge: "bg-[#e7f5b4] text-[#2f4a16]", icon: "up" as const };
    return { label: "A revisar", tone: "text-[#8a5128]", badge: "bg-[#f6e8de] text-[#7a3f1f]", icon: "down" as const };
  }

  if (preference === "down") {
    if (delta < 0) return { label: positiveMessages[messageIndex(seed)], tone: "text-[#3f611d]", badge: "bg-[#e7f5b4] text-[#2f4a16]", icon: "down" as const };
    return { label: "A revisar", tone: "text-[#8a5128]", badge: "bg-[#f6e8de] text-[#7a3f1f]", icon: "up" as const };
  }

  return { label: "Neutro", tone: "text-[#68736b]", badge: "bg-[#eef1ea] text-[#5e6a62]", icon: delta > 0 ? "up" as const : "down" as const };
}

export function ProgressPanel({ entries, targetWeightKg, primaryGoal, daysSinceLastMeasurement }: ProgressPanelProps) {
  const router = useRouter();
  const [history, setHistory] = useState<MeasurementEntry[]>(entries);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [waistInput, setWaistInput] = useState("");
  const [chestInput, setChestInput] = useState("");
  const [armInput, setArmInput] = useState("");
  const [thighInput, setThighInput] = useState("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(targetWeightKg ? String(targetWeightKg) : "");
  const [target, setTarget] = useState(targetWeightKg);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null);

  const sorted = useMemo(() => [...history].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)), [history]);
  const normalizedPrimaryGoal = primaryGoal.trim();
  const hasPrimaryGoal = normalizedPrimaryGoal.length > 0;
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const deltaFromStart = first && latest ? latest.weightKg - first.weightKg : 0;
  const deltaFromTarget = latest && target ? latest.weightKg - target : null;
  const direction = hasPrimaryGoal ? goalDirection(normalizedPrimaryGoal) : "neutral";
  const isOnTrack = !hasPrimaryGoal || (direction === "up" ? deltaFromStart >= 0 : direction === "down" ? deltaFromStart <= 0 : Math.abs(deltaFromStart) < 1);
  const elapsedDays = first && latest ? daysBetween(first.measuredAt, latest.measuredAt) : null;
  const weeklyRate = elapsedDays && elapsedDays >= 7 ? deltaFromStart / (elapsedDays / 7) : null;
  const remainingToTarget = latest && target ? Math.abs(target - latest.weightKg) : null;
  const alignedWeeklyRate = weeklyRate === null
    ? null
    : direction === "down"
      ? -weeklyRate
      : direction === "up"
        ? weeklyRate
        : Math.abs(weeklyRate) < 0.2
          ? 0.2
          : null;
  const etaWeeks = remainingToTarget !== null && alignedWeeklyRate && alignedWeeklyRate > 0.05
    ? remainingToTarget / alignedWeeklyRate
    : null;
  const weeklyRateLabel = weeklyRate === null ? "7 días min." : `${weeklyRate > 0 ? "+" : ""}${weeklyRate.toFixed(2)} kg`;
  const projectionLabel = etaWeeks !== null ? `~${Math.max(1, Math.round(etaWeeks))} sem` : target ? "Esperando ritmo" : "Añade objetivo";
  const statusLabel = !hasPrimaryGoal ? "Objetivo pendiente" : isOnTrack ? "Ritmo correcto" : "Ritmo a revisar";
  const statusTone = isOnTrack ? "border-[#b6c77b] bg-[#e7f5b4] text-[#3d4a24]" : "border-[#e3c9a8] bg-[#f7ead9] text-[#7a5326]";

  const referenceEntry = latest ? closestEntryNearDaysAgo(sorted, 21, 6) : null;
  const stagnationDelta = referenceEntry && latest ? latest.weightKg - referenceEntry.weightKg : null;
  const isStagnant = hasPrimaryGoal && direction !== "neutral" && stagnationDelta !== null && (direction === "up" ? stagnationDelta <= 0 : stagnationDelta >= 0);

  const weightSeries = sorted.map((entry) => entry.weightKg).slice(-12);
  const waistSeries = sorted.map((entry) => entry.waistCm).filter((value): value is number => value !== null).slice(-12);

  const quickInsights: Array<{ tone: string; text: string }> = [
    {
      tone: isOnTrack ? "border-[#cfe2a8] bg-[#f5fae8] text-[#2f4a16]" : "border-[#edd6bb] bg-[#fbf3e9] text-[#7a5326]",
      text: latest && first && sorted.length > 1
        ? `Tendencia principal: ${deltaFromStart > 0 ? "+" : ""}${deltaFromStart.toFixed(1)} kg desde tu primer registro.`
        : "Aún no hay base suficiente: con 2 mediciones activamos tu lectura de tendencia."
    },
    {
      tone: "border-[#dfe6d8] bg-white text-[#364238]",
      text: weeklyRate !== null
        ? `Ritmo semanal: ${weeklyRate > 0 ? "+" : ""}${weeklyRate.toFixed(2)} kg/semana.`
        : "Necesitamos al menos 7 días de datos para calcular tu ritmo semanal."
    },
    {
      tone: etaWeeks !== null ? "border-[#cfe2a8] bg-[#f5fae8] text-[#2f4a16]" : "border-[#dfe6d8] bg-white text-[#364238]",
      text: etaWeeks !== null
        ? `Proyección: manteniendo este ritmo, llegarías al objetivo en ~${Math.max(1, Math.round(etaWeeks))} semanas.`
        : target
          ? "Todavía no hay consistencia suficiente para proyectar fecha de objetivo con confianza."
          : "Añade un peso objetivo para activar proyección personalizada."
    }
  ];

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
    router.refresh();
  }

  async function submit() {
    const weightKg = Number(weightInput.replace(",", "."));
    if (!weightKg || weightKg < 20 || weightKg > 400) { setError("Introduce un peso válido."); return; }
    setIsSaving(true);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      weightKg,
      waistCm: waistInput ? Number(waistInput.replace(",", ".")) : undefined,
      chestCm: chestInput ? Number(chestInput.replace(",", ".")) : undefined,
      armCm: armInput ? Number(armInput.replace(",", ".")) : undefined,
      thighCm: thighInput ? Number(thighInput.replace(",", ".")) : undefined,
    };
    const response = await fetch("/api/progress/weight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setIsSaving(false);
    if (!response.ok) { setError("No hemos podido guardar el registro. Inténtalo de nuevo."); return; }
    setHistory((current) => {
      const existingToday = current.find((entry) => entry.measuredAt === today);
      const withoutToday = current.filter((entry) => entry.measuredAt !== today);
      return [...withoutToday, {
        id: today,
        measuredAt: today,
        weightKg,
        waistCm: payload.waistCm ?? existingToday?.waistCm ?? null,
        chestCm: payload.chestCm ?? existingToday?.chestCm ?? null,
        armCm: payload.armCm ?? existingToday?.armCm ?? null,
        thighCm: payload.thighCm ?? existingToday?.thighCm ?? null,
      }];
    });
    setWeightInput(""); setWaistInput(""); setChestInput(""); setArmInput(""); setThighInput("");
    router.refresh();
  }

  async function saveTarget() {
    const value = targetInput ? Number(targetInput.replace(",", ".")) : null;
    if (targetInput && (!value || value < 20 || value > 400)) { setError("Introduce un objetivo de peso válido."); return; }
    setIsSavingTarget(true);
    setError(null);
    const response = await fetch("/api/progress/target", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetWeightKg: value }) });
    setIsSavingTarget(false);
    if (!response.ok) { setError("No hemos podido guardar el objetivo. Inténtalo de nuevo."); return; }
    setTarget(value);
    setIsEditingTarget(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Panel de progreso</h2>
          <p className="text-sm text-[#68736b]">Una vista clara de cómo vas y qué ajustar ahora.</p>
        </div>
      </div>

      <section className="rounded-3xl border border-[#cdd9bd] bg-gradient-to-r from-[#eef6da] via-[#f7f9ef] to-[#eef4e1] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d7f42]">Revisión recomendada</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1d2a16]">Haz una pasada de dieta y rutina cada 2-3 semanas</h3>
            <p className="mt-1 text-sm text-[#4b5a46]">Esto mejora la precisión del plan, evita estancamientos y mantiene el progreso alineado con tu objetivo actual.</p>
          </div>
          <Link href="/checkin" className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(24,35,31,0.24)] transition-transform hover:-translate-y-0.5 hover:bg-[#0f1714]">
            Actualizar mi plan
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className={`rounded-3xl border p-6 ${statusTone}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Estado de la semana</p>
            <h3 className="mt-2 text-2xl font-semibold">{statusLabel}</h3>
            <p className="mt-2 text-sm">
              {!hasPrimaryGoal
                ? "Añade tu objetivo principal para activar una lectura de tendencia fiable."
                : isOnTrack
                  ? `Tu tendencia actual está alineada con tu objetivo de ${normalizedPrimaryGoal.toLowerCase()}.`
                  : `Tu tendencia actual se está desviando del objetivo de ${normalizedPrimaryGoal.toLowerCase()}.`}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#68736b]">Peso actual</p>
              <p className="mt-1 text-lg font-semibold text-[#18231f]">{latest ? `${latest.weightKg} kg` : "Sin datos"}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#68736b]">Ritmo semanal</p>
              <p className="mt-1 text-lg font-semibold text-[#18231f]">{weeklyRateLabel}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#68736b]">Proyección</p>
              <p className="mt-1 text-lg font-semibold text-[#18231f]">{projectionLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <h3 className="text-base font-semibold">Insights rápidos</h3>
        <div className="mt-3 grid gap-2">
          {quickInsights.map((insight) => (
            <p key={insight.text} className={`rounded-xl border px-3 py-2 text-sm ${insight.tone}`}>{insight.text}</p>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <p className="text-sm text-[#819078]">Cambio acumulado</p>
          <h2 className="mt-2 text-3xl font-semibold">{latest && first && sorted.length > 1 ? `${deltaFromStart > 0 ? "+" : ""}${deltaFromStart.toFixed(1)} kg` : "Sin datos"}</h2>
          {latest ? <p className="mt-2 inline-flex rounded-lg bg-[#edf0ea] px-2.5 py-1 text-xs font-semibold text-[#5f6b63]">Actual: {formatMeasure(latest.weightKg)} kg</p> : null}
          <MiniSparkline values={weightSeries} />
          {latest && first && sorted.length > 1 ? (
            <p className={`mt-2 flex items-center gap-1 text-sm font-semibold ${isOnTrack ? "text-[#72873f]" : "text-[#a06a3a]"}`}>
              {deltaFromStart <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {deltaFromStart === 0 ? "Sin cambios" : `${deltaFromStart > 0 ? "+" : ""}${deltaFromStart.toFixed(1)} kg desde el inicio`}
            </p>
          ) : null}
        </section>
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <p className="text-sm text-[#819078]">Objetivo</p>
          <h2 className="mt-2 text-2xl font-semibold">{normalizedPrimaryGoal || "No definido"}</h2>
          <div className="mt-3 flex items-center justify-between">
            {isEditingTarget ? (
              <div className="flex items-center gap-2">
                <input value={targetInput} onChange={(event) => setTargetInput(event.target.value)} inputMode="decimal" placeholder="70" className="w-24 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm" />
                <button type="button" disabled={isSavingTarget} onClick={saveTarget} className="rounded-full bg-[#18231f] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Guardar</button>
              </div>
            ) : (
              <p className="text-sm text-[#68736b]">{target ? `Peso objetivo: ${target} kg` : "Sin peso objetivo"}</p>
            )}
            <button type="button" onClick={() => setIsEditingTarget((current) => !current)} className="text-xs font-semibold text-[#72873f] underline">
              {target ? "Editar" : "Añadir peso"}
            </button>
          </div>
          {!isEditingTarget && deltaFromTarget !== null ? <p className="mt-2 text-sm text-[#68736b]">{Math.abs(deltaFromTarget).toFixed(1)} kg {deltaFromTarget > 0 ? (direction === "down" ? "por perder" : "por encima") : deltaFromTarget < 0 ? (direction === "up" ? "por ganar" : "por debajo") : "· objetivo alcanzado"}</p> : null}
          {waistSeries.length > 1 ? <MiniSparkline values={waistSeries} /> : null}
        </section>
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <p className="text-sm text-[#819078]">Última medición</p>
          <h2 className="mt-2 text-3xl font-semibold">{latest ? formatDate(latest.measuredAt) : "Sin datos"}</h2>
          <p className="mt-2 text-sm text-[#68736b]">
            {daysSinceLastMeasurement === null ? "Añade tu primer pesaje" : daysSinceLastMeasurement === 0 ? "Hoy" : daysSinceLastMeasurement === 1 ? "Hace 1 día" : `Hace ${daysSinceLastMeasurement} días`}
          </p>
        </section>
      </div>

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

      <details className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <summary className="cursor-pointer list-none text-lg font-semibold">Evolución del peso (detalle opcional)</summary>
        <WeightChart entries={sorted} />
      </details>

      {bodyMetrics.some((metric) => metricSummary(sorted, metric)) ? (
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <h3 className="text-lg font-semibold">Medidas corporales</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bodyMetrics.map((metric) => {
              const summary = metricSummary(sorted, metric);
              if (!summary) return null;
              const preference = metricPreference(direction, metric.label);
              const trend = metricTone(summary.delta, preference, `${metric.label}-${summary.measuredAt}`);
              return (
                <div key={metric.label} className="rounded-2xl border border-[#e3e7dd] bg-white p-4">
                  <p className="text-xs text-[#819078]">{metric.label}</p>
                  <p className="mt-2 inline-flex rounded-lg bg-[#edf0ea] px-2.5 py-1 text-sm font-semibold text-[#39443f]">Actual: {formatMeasure(summary.latestValue)} cm</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${trend.badge}`}>{trend.label}</span>
                    <p className={`flex items-center gap-1 text-xs font-semibold ${trend.tone}`}>
                      {trend.icon === "stable" ? <span>•</span> : trend.icon === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {summary.delta === null || Math.abs(summary.delta) < 0.2 ? "Sin cambios relevantes" : `${summary.delta > 0 ? "+" : ""}${summary.delta.toFixed(1)} cm vs anterior`}
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] text-[#819078]">Última medición: {formatDate(summary.measuredAt)}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <h3 className="text-lg font-semibold">Registrar hoy</h3>
        <p className="mt-1 text-xs text-[#819078]">Se guarda un registro por día: si repites hoy, se actualiza el valor de hoy.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm text-[#68736b]">
            Peso (kg)
            <input value={weightInput} onChange={(event) => setWeightInput(event.target.value)} inputMode="decimal" placeholder="72.5" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" />
          </label>
          <label className="flex flex-col text-sm text-[#68736b]">Cintura (cm)<input value={waistInput} onChange={(event) => setWaistInput(event.target.value)} inputMode="decimal" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" /></label>
          <label className="flex flex-col text-sm text-[#68736b]">Pecho (cm)<input value={chestInput} onChange={(event) => setChestInput(event.target.value)} inputMode="decimal" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" /></label>
          <label className="flex flex-col text-sm text-[#68736b]">Brazo (cm)<input value={armInput} onChange={(event) => setArmInput(event.target.value)} inputMode="decimal" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" /></label>
          <label className="flex flex-col text-sm text-[#68736b]">Muslo (cm)<input value={thighInput} onChange={(event) => setThighInput(event.target.value)} inputMode="decimal" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" /></label>
          <button type="button" disabled={isSaving} onClick={submit} className="flex items-center gap-2 rounded-full bg-[#18231f] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Plus size={16} /> {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      {sorted.length > 0 ? (
        <details className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <summary className="cursor-pointer list-none text-lg font-semibold">Historial</summary>
          <div className="mt-4 space-y-2">
            {[...sorted].reverse().slice(0, 10).map((entry) => {
              const measurementDetails = [
                entry.waistCm ? `Cintura ${entry.waistCm} cm` : null,
                entry.chestCm ? `Pecho ${entry.chestCm} cm` : null,
                entry.armCm ? `Brazo ${entry.armCm} cm` : null,
                entry.thighCm ? `Muslo ${entry.thighCm} cm` : null,
              ].filter(Boolean);
              return (
                <div key={entry.id} className="rounded-2xl border border-[#e3e7dd] bg-white px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#68736b]">{formatDate(entry.measuredAt)}</span>
                    <span className="font-semibold">{entry.weightKg} kg</span>
                  </div>
                  {measurementDetails.length > 0 ? <p className="mt-1 text-xs text-[#819078]">{measurementDetails.join(" · ")}</p> : null}
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
