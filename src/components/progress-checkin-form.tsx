"use client";

import { Check, HeartPulse, LoaderCircle, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { goalDirection } from "@/lib/goal-direction";

type Adherence = "low" | "medium" | "high";

export type ProgressCheckinSummary = {
  checked_in_at: string;
  energy_score: number;
  sleep_score: number;
  stress_score: number;
  soreness_score: number;
  training_adherence: Adherence;
  nutrition_adherence: Adherence;
  pain_present: boolean;
  pain_area: string | null;
  pain_severity: number | null;
  notes: string | null;
};

export type ProgressMeasurementSummary = {
  measuredAt: string;
  weightKg: number;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
};

type ProgressCheckinFormProps = {
  latestCheckin: ProgressCheckinSummary | null;
  initialTargetWeightKg: number | null;
  latestMeasurement: ProgressMeasurementSummary | null;
  previousMeasurement: ProgressMeasurementSummary | null;
  primaryGoal: string;
};

const scoreOptions = ["1", "2", "3", "4", "5"];
const adherenceOptions: Array<{ value: Adherence; label: string }> = [
  { value: "low", label: "Me costó" },
  { value: "medium", label: "A medias" },
  { value: "high", label: "Lo seguí bien" },
];

function scoreLabel(value: number) {
  return ["Muy bajo", "Bajo", "Normal", "Bien", "Muy bien"][value - 1] ?? "";
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function formatValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function messageIndex(label: string, delta: number) {
  return [...label].reduce((total, character) => total + character.charCodeAt(0), Math.round(Math.abs(delta) * 10)) ;
}

export function ProgressCheckinForm({ latestCheckin, initialTargetWeightKg, latestMeasurement, previousMeasurement, primaryGoal }: ProgressCheckinFormProps) {
  const router = useRouter();
  const [energyScore, setEnergyScore] = useState(String(latestCheckin?.energy_score ?? 3));
  const [sleepScore, setSleepScore] = useState(String(latestCheckin?.sleep_score ?? 3));
  const [stressScore, setStressScore] = useState(String(latestCheckin?.stress_score ?? 3));
  const [sorenessScore, setSorenessScore] = useState(String(latestCheckin?.soreness_score ?? 3));
  const [trainingAdherence, setTrainingAdherence] = useState<Adherence>(latestCheckin?.training_adherence ?? "medium");
  const [nutritionAdherence, setNutritionAdherence] = useState<Adherence>(latestCheckin?.nutrition_adherence ?? "medium");
  const [painPresent, setPainPresent] = useState(latestCheckin?.pain_present ?? false);
  const [painArea, setPainArea] = useState(latestCheckin?.pain_area ?? "");
  const [painSeverity, setPainSeverity] = useState(String(latestCheckin?.pain_severity ?? 4));
  const [healthConsent, setHealthConsent] = useState(latestCheckin?.pain_present ?? false);
  const [notes, setNotes] = useState(latestCheckin?.notes ?? "");
  const [weightInput, setWeightInput] = useState(latestMeasurement ? String(latestMeasurement.weightKg) : "");
  const [waistInput, setWaistInput] = useState(latestMeasurement?.waistCm ? String(latestMeasurement.waistCm) : "");
  const [chestInput, setChestInput] = useState(latestMeasurement?.chestCm ? String(latestMeasurement.chestCm) : "");
  const [armInput, setArmInput] = useState(latestMeasurement?.armCm ? String(latestMeasurement.armCm) : "");
  const [thighInput, setThighInput] = useState(latestMeasurement?.thighCm ? String(latestMeasurement.thighCm) : "");
  const [targetWeightInput, setTargetWeightInput] = useState(initialTargetWeightKg ? String(initialTargetWeightKg) : "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const direction = goalDirection(primaryGoal);

  function feedbackFor(label: string, delta: number | null) {
    if (delta === null || Math.abs(delta) < 0.2) {
      const stableMessages = ["Estable", "Sin cambios relevantes", "Evolución registrada"];
      return { label: stableMessages[messageIndex(label, delta ?? 0) % stableMessages.length], tone: "text-[#68736b]", badge: "bg-[#eef1ea] text-[#5e6a62]", icon: "stable" as const };
    }
    const neutralWithGoal = direction === "neutral"
      || (direction === "up" && label === "Cintura")
      || (direction === "down" && label !== "Cintura" && label !== "Peso");
    if (neutralWithGoal) {
      const contextualMessages = ["Cambio compatible con tu objetivo", "Evolución registrada", "Lo interpretamos junto al resto"];
      return { label: contextualMessages[messageIndex(label, delta) % contextualMessages.length], tone: "text-[#68736b]", badge: "bg-[#eef1ea] text-[#5e6a62]", icon: delta > 0 ? "up" as const : "down" as const };
    }
    const positive = label === "Peso"
      ? direction === "up" ? delta > 0 : direction === "down" ? delta < 0 : false
      : direction === "up" ? delta > 0 : direction === "down" ? label === "Cintura" && delta < 0 : false;
    if (positive) {
      const positiveMessages = ["Muy bien", "Vas por buen camino", "Buena evolución", "Gran trabajo"];
      return { label: positiveMessages[messageIndex(label, delta) % positiveMessages.length], tone: "text-[#3f611d]", badge: "bg-[#e7f5b4] text-[#2f4a16]", icon: delta > 0 ? "up" as const : "down" as const };
    }
    const reviewMessages = ["Conviene revisarlo", "A revisar", "Podemos ajustarlo"];
    return { label: reviewMessages[messageIndex(label, delta) % reviewMessages.length], tone: "text-[#8a5128]", badge: "bg-[#f6e8de] text-[#7a3f1f]", icon: delta > 0 ? "up" as const : "down" as const };
  }

  async function submit() {
    setIsSaving(true);
    setMessage(null);
    setError(null);
    if (weightInput) {
      const measurementResponse = await fetch("/api/progress/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: Number(weightInput.replace(",", ".")),
          waistCm: waistInput ? Number(waistInput.replace(",", ".")) : undefined,
          chestCm: chestInput ? Number(chestInput.replace(",", ".")) : undefined,
          armCm: armInput ? Number(armInput.replace(",", ".")) : undefined,
          thighCm: thighInput ? Number(thighInput.replace(",", ".")) : undefined,
        }),
      });
      if (!measurementResponse.ok) {
        setIsSaving(false);
        setError("Revisa el peso y las medidas antes de guardar la revisión.");
        return;
      }
    }

    if (targetWeightInput) {
      const targetResponse = await fetch("/api/progress/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetWeightKg: Number(targetWeightInput.replace(",", ".")) }),
      });
      if (!targetResponse.ok) {
        setIsSaving(false);
        setError("Revisa el peso objetivo antes de guardar la revisión.");
        return;
      }
    }

    const response = await fetch("/api/progress/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        energyScore: Number(energyScore),
        sleepScore: Number(sleepScore),
        stressScore: Number(stressScore),
        sorenessScore: Number(sorenessScore),
        trainingAdherence,
        nutritionAdherence,
        painPresent,
        painArea: painPresent ? painArea : undefined,
        painSeverity: painPresent ? Number(painSeverity) : undefined,
        notes,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setIsSaving(false);
    if (!response.ok) {
      setError(data.error ?? "No hemos podido guardar tu revisión.");
      return;
    }
    setMessage("Revisión guardada. Tendremos en cuenta estos datos antes de recomendar cambios.");
    setHealthConsent(false);
    setWeightInput("");
    setWaistInput("");
    setChestInput("");
    setArmInput("");
    setThighInput("");
    router.refresh();
  }

  const measurementCards = latestMeasurement ? [
    { label: "Peso", value: latestMeasurement.weightKg, previous: previousMeasurement?.weightKg ?? null, unit: "kg" },
    { label: "Cintura", value: latestMeasurement.waistCm, previous: previousMeasurement?.waistCm ?? null, unit: "cm" },
    { label: "Pecho", value: latestMeasurement.chestCm, previous: previousMeasurement?.chestCm ?? null, unit: "cm" },
    { label: "Brazo", value: latestMeasurement.armCm, previous: previousMeasurement?.armCm ?? null, unit: "cm" },
    { label: "Muslo", value: latestMeasurement.thighCm, previous: previousMeasurement?.thighCm ?? null, unit: "cm" },
  ] : [];

  return (
    <section id="progress-checkin" className="rounded-[2rem] border border-[#cdd9bd] bg-gradient-to-br from-[#f1f7df] via-[#f8f9f2] to-[#edf3e4] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6d7f42]">Acompañamiento semanal</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Cuéntanos cómo estás, no solo cuánto pesas.</h3>
          <p className="mt-2 text-sm leading-6 text-[#4b5a46]">Usaremos tu energía, descanso, adherencia y molestias para revisar el contexto. Guardar esta revisión no cambia todavía tu dieta ni tu rutina: primero revisaremos si hace falta ajustar algo.</p>
        </div>
        {latestCheckin ? <span className="rounded-full border border-[#cdd9bd] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#60703d]">Última revisión: {dateLabel(latestCheckin.checked_in_at)}</span> : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["Energía", energyScore, setEnergyScore],
          ["Sueño", sleepScore, setSleepScore],
          ["Estrés", stressScore, setStressScore],
          ["Molestias musculares", sorenessScore, setSorenessScore],
        ].map(([label, value, setter]) => (
          <fieldset key={label as string} className="rounded-2xl border border-[#d9e3ce] bg-white/75 p-4">
            <legend className="px-1 text-sm font-semibold text-[#354231]">{label as string}</legend>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {scoreOptions.map((option) => <button key={option} type="button" onClick={() => (setter as (value: string) => void)(option)} className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${value === option ? "border-[#72873f] bg-[#dff0a9] text-[#354c1d]" : "border-[#dfe6d8] bg-white text-[#68736b] hover:border-[#9aaa89]"}`} aria-label={`${label as string}: ${option} de 5`}>{option}</button>)}
            </div>
            <p className="mt-2 text-xs text-[#819078]">{scoreLabel(Number(value))}</p>
          </fieldset>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[["Entrenamiento", trainingAdherence, setTrainingAdherence], ["Nutrición", nutritionAdherence, setNutritionAdherence]].map(([label, value, setter]) => <fieldset key={label as string} className="rounded-2xl border border-[#d9e3ce] bg-white/75 p-4"><legend className="px-1 text-sm font-semibold text-[#354231]">¿Cómo has seguido tu {String(label).toLowerCase()}?</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{adherenceOptions.map((option) => <button key={option.value} type="button" onClick={() => (setter as (value: Adherence) => void)(option.value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${value === option.value ? "border-[#72873f] bg-[#dff0a9] text-[#354c1d]" : "border-[#dfe6d8] bg-white text-[#68736b] hover:border-[#9aaa89]"}`}>{option.label}</button>)}</div></fieldset>)}
      </div>

      <div className="mt-4 rounded-2xl border border-[#d9e3ce] bg-white/75 p-4">
        <label className="flex items-start gap-3 text-sm font-semibold text-[#354231]"><input type="checkbox" checked={painPresent} onChange={(event) => setPainPresent(event.target.checked)} className="mt-0.5 size-4 accent-[#72873f]" /><span className="flex items-center gap-2"><HeartPulse size={16} />Tengo una molestia o dolor nuevo</span></label>
        {painPresent ? <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="text-sm text-[#68736b]">Zona<input value={painArea} onChange={(event) => setPainArea(event.target.value)} placeholder="Ej. rodilla derecha" className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-white px-3 py-2" /></label><label className="text-sm text-[#68736b]">Intensidad (1-10)<input type="number" min="1" max="10" value={painSeverity} onChange={(event) => setPainSeverity(event.target.value)} className="mt-1 w-28 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2" /></label><label className="flex gap-2 text-xs leading-5 text-[#68736b] sm:col-span-2"><input type="checkbox" checked={healthConsent} onChange={(event) => setHealthConsent(event.target.checked)} className="mt-0.5 size-4 accent-[#72873f]" /><span>Autorizo el tratamiento de esta información de salud para adaptar mi experiencia. <ShieldCheck size={13} className="inline" /></span></label></div> : <p className="mt-2 text-xs text-[#819078]">Si aparece dolor intenso o preocupante, detén la actividad y consulta con un profesional.</p>}
      </div>

      <div className="mt-4 rounded-2xl border border-[#d9e3ce] bg-white/75 p-4">
        <div>
          <h4 className="text-sm font-semibold text-[#354231]">Evolución rápida <span className="font-normal text-[#819078]">· opcional</span></h4>
          <p className="mt-1 text-xs leading-5 text-[#819078]">Hemos precargado tu último registro. Corrige solo lo que haya cambiado.</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <label className="text-xs text-[#68736b]">Peso (kg)<input value={weightInput} onChange={(event) => setWeightInput(event.target.value)} inputMode="decimal" placeholder="72,5" className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm" /></label>
          <label className="text-xs text-[#68736b]">Objetivo<input value={targetWeightInput} onChange={(event) => setTargetWeightInput(event.target.value)} inputMode="decimal" placeholder="70" className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm" /></label>
          <label className="text-xs text-[#68736b]">Cintura<input value={waistInput} onChange={(event) => setWaistInput(event.target.value)} inputMode="decimal" placeholder="cm" className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm" /></label>
          <label className="text-xs text-[#68736b]">Pecho<input value={chestInput} onChange={(event) => setChestInput(event.target.value)} inputMode="decimal" placeholder="cm" className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm" /></label>
          <label className="text-xs text-[#68736b]">Brazo<input value={armInput} onChange={(event) => setArmInput(event.target.value)} inputMode="decimal" placeholder="cm" className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm" /></label>
          <label className="text-xs text-[#68736b]">Muslo<input value={thighInput} onChange={(event) => setThighInput(event.target.value)} inputMode="decimal" placeholder="cm" className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm" /></label>
        </div>
        {latestMeasurement ? <>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#819078]"><span>Último registro: {dateLabel(latestMeasurement.measuredAt)}</span>{previousMeasurement ? <span>Comparado con tu medición anterior</span> : <span>Añade otra medición para ver tu evolución</span>}</div>
          <div className="mt-4 border-t border-[#e3e7dd] pt-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#819078]">Tu lectura actual</p><div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{measurementCards.map((card) => { const delta = card.value !== null && card.previous !== null ? card.value - card.previous : null; const feedback = feedbackFor(card.label, delta); return <div key={card.label} className={`rounded-2xl border p-3 ${card.label === "Peso" ? "border-[#cfe2a8] bg-[#f5fae8]" : "border-[#e3e7dd] bg-white"}`}><p className="text-xs text-[#819078]">{card.label}</p><p className="mt-2 inline-flex rounded-lg bg-[#edf0ea] px-2.5 py-1 text-sm font-semibold text-[#39443f]">{card.value === null ? "Sin dato" : `Actual: ${formatValue(card.value)} ${card.unit}`}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${feedback.badge}`}>{feedback.label}</span><p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${feedback.tone}`}>{feedback.icon === "stable" ? <span>•</span> : feedback.icon === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{delta === null ? "Sin comparación" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} ${card.unit} vs anterior`}</p><p className="mt-2 text-[11px] text-[#819078]">Última medición: {dateLabel(latestMeasurement.measuredAt)}</p></div>; })}</div></div>
        </> : <p className="mt-3 text-xs text-[#819078]">Este será tu primer registro de evolución.</p>}
      </div>

      <label className="mt-4 block text-sm text-[#68736b]">¿Hay algo más que debamos saber?<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} rows={2} placeholder="Cambios de horarios, viajes, cansancio..." className="mt-1 w-full resize-none rounded-xl border border-[#d3dbcf] bg-white px-3 py-2" /></label>
      {error ? <p className="mt-4 text-sm font-semibold text-[#9b4937]">{error}</p> : null}
      {message ? <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#4f6827]"><p className="flex items-center gap-2"><Check size={16} />{message}</p><Link href="/checkin" className="rounded-full border border-[#72873f] px-3 py-1.5 text-xs text-[#50652b] hover:bg-[#e7f5b4]">Revisar cambios del plan</Link></div> : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#819078]">Tu revisión se guarda una vez al día y queda asociada solo a tu cuenta.</p><button type="button" disabled={isSaving || (painPresent && !healthConsent)} onClick={submit} className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} {isSaving ? "Guardando..." : "Guardar revisión"}</button></div>
    </section>
  );
}
