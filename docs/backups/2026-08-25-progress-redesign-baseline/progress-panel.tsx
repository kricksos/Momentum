"use client";

import { Info, Plus, TrendingDown, TrendingUp } from "lucide-react";
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

export function ProgressPanel({ entries, targetWeightKg, primaryGoal, daysSinceLastMeasurement }: ProgressPanelProps) {
  const router = useRouter();
  const [history, setHistory] = useState<MeasurementEntry[]>(entries);
  const [showMeasurements, setShowMeasurements] = useState(false);
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
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const deltaFromStart = first && latest ? latest.weightKg - first.weightKg : 0;
  const deltaFromTarget = latest && target ? latest.weightKg - target : null;
  const direction = goalDirection(primaryGoal);
  const isOnTrack = direction === "up" ? deltaFromStart >= 0 : direction === "down" ? deltaFromStart <= 0 : Math.abs(deltaFromStart) < 1;

  const referenceEntry = latest ? closestEntryNearDaysAgo(sorted, 21, 6) : null;
  const stagnationDelta = referenceEntry && latest ? latest.weightKg - referenceEntry.weightKg : null;
  const isStagnant = direction !== "neutral" && stagnationDelta !== null && (direction === "up" ? stagnationDelta <= 0 : stagnationDelta >= 0);

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
          <h2 className="text-lg font-semibold">Tu seguimiento</h2>
          <p className="text-sm text-[#68736b]">Registra tu peso y revisa tu plan cuando algo cambie en tu vida.</p>
        </div>
        <Link href="/checkin" className="inline-flex rounded-full border border-[#18231f] px-5 py-2 text-sm font-semibold text-[#18231f] hover:bg-[#18231f] hover:text-white">Actualizar mi plan</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <p className="text-sm text-[#819078]">Peso actual</p>
          <h2 className="mt-2 text-3xl font-semibold">{latest ? `${latest.weightKg} kg` : "Sin datos"}</h2>
          {latest && first && sorted.length > 1 ? (
            <p className={`mt-2 flex items-center gap-1 text-sm font-semibold ${isOnTrack ? "text-[#72873f]" : "text-[#a06a3a]"}`}>
              {deltaFromStart <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {deltaFromStart === 0 ? "Sin cambios" : `${deltaFromStart > 0 ? "+" : ""}${deltaFromStart.toFixed(1)} kg desde el inicio`}
            </p>
          ) : null}
        </section>
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <p className="text-sm text-[#819078]">Objetivo</p>
          <h2 className="mt-2 text-2xl font-semibold">{primaryGoal || "No definido"}</h2>
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
        </section>
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <p className="text-sm text-[#819078]">Última medición</p>
          <h2 className="mt-2 text-3xl font-semibold">{latest ? formatDate(latest.measuredAt) : "Sin datos"}</h2>
          <p className="mt-2 text-sm text-[#68736b]">
            {daysSinceLastMeasurement === null ? "Añade tu primer pesaje" : daysSinceLastMeasurement === 0 ? "Hoy" : daysSinceLastMeasurement === 1 ? "Hace 1 día" : `Hace ${daysSinceLastMeasurement} días`}
          </p>
        </section>
      </div>

      {latest && first && sorted.length > 1 && primaryGoal ? (
        <p className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${isOnTrack ? "border-[#b6c77b] bg-[#e7f5b4] text-[#3d4a24]" : "border-[#e3c9a8] bg-[#f7ead9] text-[#7a5326]"}`}>
          {isOnTrack ? `Vas por buen camino con tu objetivo de ${primaryGoal.toLowerCase()}.` : `Tu peso no está evolucionando en la dirección esperada para tu objetivo de ${primaryGoal.toLowerCase()}.`}
        </p>
      ) : null}

      {isStagnant ? (
        <div className="rounded-2xl border-2 border-[#c0492f] bg-[#f9e2da] px-4 py-4">
          <p className="text-sm font-semibold text-[#7a2e1a]">Llevas unas 3 semanas sin avanzar hacia tu objetivo de {primaryGoal.toLowerCase()}.</p>
          <p className="mt-1 text-sm text-[#7a2e1a]">Podemos reajustar tu dieta y tu rutina para desbloquear el progreso.</p>
          <button type="button" disabled={isAdjusting} onClick={requestAdjustment} className="mt-3 rounded-full bg-[#18231f] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isAdjusting ? "Reajustando..." : "Reajustar plan"}
          </button>
          {adjustMessage ? <p className="mt-2 text-sm font-semibold text-[#7a2e1a]">{adjustMessage}</p> : null}
        </div>
      ) : null}

      {daysSinceLastMeasurement !== null && daysSinceLastMeasurement >= 14 ? (
        <p className="rounded-2xl border border-[#e3c9a8] bg-[#f7ead9] px-4 py-3 text-sm font-semibold text-[#7a5326]">
          Han pasado {daysSinceLastMeasurement} días desde tu último registro. Te recomendamos medirte al menos cada 2 semanas para ver tu evolución con precisión.
        </p>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-[#72873f] bg-[#e7f5b4] px-4 py-3">
          <Info size={20} className="shrink-0 text-[#3d4a24]" />
          <p className="text-sm font-semibold text-[#3d4a24]">Consejo: registra tu peso y medidas al menos <strong>cada 2 semanas</strong> para un seguimiento fiable.</p>
        </div>
      )}

      <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <h3 className="text-lg font-semibold">Evolución del peso</h3>
        <WeightChart entries={sorted} />
      </section>

      {bodyMetrics.some((metric) => metricSummary(sorted, metric)) ? (
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <h3 className="text-lg font-semibold">Medidas corporales</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bodyMetrics.map((metric) => {
              const summary = metricSummary(sorted, metric);
              if (!summary) return null;
              return (
                <div key={metric.label} className="rounded-2xl border border-[#e3e7dd] bg-white p-4">
                  <p className="text-xs text-[#819078]">{metric.label}</p>
                  <p className="mt-1 text-xl font-semibold">{summary.latestValue} cm</p>
                  <p className="mt-1 text-xs text-[#68736b]">
                    {summary.delta === null ? formatDate(summary.measuredAt) : summary.delta === 0 ? "Sin cambios" : `${summary.delta > 0 ? "+" : ""}${summary.delta.toFixed(1)} cm desde la anterior`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
        <h3 className="text-lg font-semibold">Registrar peso de hoy</h3>
        <p className="mt-1 text-xs text-[#819078]">Se guarda un registro por día: si repites hoy, se actualiza el valor de hoy.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm text-[#68736b]">
            Peso (kg)
            <input value={weightInput} onChange={(event) => setWeightInput(event.target.value)} inputMode="decimal" placeholder="72.5" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" />
          </label>
          <button type="button" onClick={() => setShowMeasurements((current) => !current)} className="rounded-full border border-[#d3dbcf] px-4 py-2 text-sm font-semibold text-[#68736b]">
            {showMeasurements ? "Ocultar medidas" : "Añadir medidas"}
          </button>
          <button type="button" disabled={isSaving} onClick={submit} className="flex items-center gap-2 rounded-full bg-[#18231f] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Plus size={16} /> {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {showMeasurements ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="flex flex-col text-sm text-[#68736b]">Cintura (cm)<input value={waistInput} onChange={(event) => setWaistInput(event.target.value)} inputMode="decimal" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" /></label>
            <label className="flex flex-col text-sm text-[#68736b]">Pecho (cm)<input value={chestInput} onChange={(event) => setChestInput(event.target.value)} inputMode="decimal" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" /></label>
            <label className="flex flex-col text-sm text-[#68736b]">Brazo (cm)<input value={armInput} onChange={(event) => setArmInput(event.target.value)} inputMode="decimal" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" /></label>
            <label className="flex flex-col text-sm text-[#68736b]">Muslo (cm)<input value={thighInput} onChange={(event) => setThighInput(event.target.value)} inputMode="decimal" className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-base" /></label>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      {sorted.length > 0 ? (
        <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
          <h3 className="text-lg font-semibold">Historial</h3>
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
        </section>
      ) : null}
    </div>
  );
}
