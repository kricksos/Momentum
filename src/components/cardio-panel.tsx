"use client";

import { Activity, Clock3, Save, TimerReset, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CardioRecommendation } from "@/features/planning/cardio";

type CardioPanelProps = {
  recommendations: Array<CardioRecommendation & { workoutDayId: string }>;
  availableDays: Array<{ id: string; label: string }>;
  initialConfigurations?: Record<string, { modality: string; duration: number; intensity: CardioRecommendation["intensity"] }>;
};

export function CardioPanel({ recommendations, availableDays, initialConfigurations = {} }: CardioPanelProps) {
  const router = useRouter();
  const [items, setItems] = useState(recommendations);
  const [dayByKey, setDayByKey] = useState<Record<string, string>>(() => Object.fromEntries(recommendations.map((item) => [item.key, item.workoutDayId])));
  const [newDayId, setNewDayId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSavingConfiguration, setIsSavingConfiguration] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [configByKey, setConfigByKey] = useState<Record<string, { modality: string; duration: number; intensity: CardioRecommendation["intensity"] }>>(() => Object.fromEntries(recommendations.map((item) => [item.key, initialConfigurations[item.key] ?? {
    modality: item.modalities[0],
    duration: item.durationMinutes,
    intensity: item.intensity,
  }])));

  function updateConfig(item: CardioRecommendation, patch: Partial<{ modality: string; duration: number; intensity: CardioRecommendation["intensity"] }>) {
    setConfigByKey((current) => ({
      ...current,
      [item.key]: { ...current[item.key], ...patch },
    }));
  }

  async function saveConfiguration(item: CardioRecommendation & { workoutDayId: string }) {
    const config = configByKey[item.key];
    setIsSavingConfiguration(item.key);
    setStatus(null);
    const response = await fetch("/api/cardio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionKey: item.key, workoutDayId: dayByKey[item.key] ?? item.workoutDayId, modality: config.modality, durationMinutes: config.duration, intensity: config.intensity }) });
    setIsSavingConfiguration(null);
    setStatus(response.ok ? `Configuración aplicada al día: ${item.title}.` : "No hemos podido guardar la configuración.");
    if (response.ok) router.refresh();
  }

  async function removeConfiguration(item: CardioRecommendation & { workoutDayId: string }) {
    setIsRemoving(item.key);
    setStatus(null);
    const response = await fetch("/api/cardio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionKey: item.key, workoutDayId: dayByKey[item.key] ?? item.workoutDayId }) });
    setIsRemoving(null);
    if (!response.ok) {
      setStatus("No hemos podido eliminar el cardio de este día.");
      setIsRemoving(null);
      return;
    }
    setItems((current) => current.filter((currentItem) => currentItem.key !== item.key));
    setDayByKey((current) => {
      const next = { ...current };
      delete next[item.key];
      return next;
    });
    setConfigByKey((current) => {
      const next = { ...current };
      delete next[item.key];
      return next;
    });
    setStatus("Cardio eliminado del día de entrenamiento.");
    router.refresh();
  }

  function addCardioDay() {
    if (!newDayId) return;
    const key = `custom-${newDayId}`;
    const item: CardioRecommendation & { workoutDayId: string } = { key, workoutDayId: newDayId, title: "Cardio adicional", modalities: ["Bicicleta", "Elíptica", "Cinta", "Remo", "Caminar al aire libre"], durationMinutes: 20, intensity: "Suave", effort: "Configura este bloque según tu objetivo y recuperación." };
    setItems((current) => [...current, item]);
    setDayByKey((current) => ({ ...current, [key]: newDayId }));
    setConfigByKey((current) => ({ ...current, [key]: { modality: item.modalities[0], duration: item.durationMinutes, intensity: item.intensity } }));
    setNewDayId("");
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-[#d3dbcf] bg-[#f8f7f1] p-6 shadow-[0_20px_60px_rgba(50,65,49,0.06)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Cardio</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Tu plan de movimiento</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#eef0e8] px-3 py-1.5 text-xs font-semibold text-[#60703d]">
          <Activity size={14} /> Configuración semanal
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {items.map((item) => {
          const config = configByKey[item.key] ?? { modality: item.modalities[0], duration: item.durationMinutes, intensity: item.intensity };
          return (
            <article key={item.key} className="relative rounded-2xl border border-[#d9e0d4] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">{item.intensity}</p>
                  <h4 className="mt-2 text-lg font-semibold">{item.title}</h4>
                  <label className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#819078]">Entrenamiento<select value={dayByKey[item.key] ?? item.workoutDayId} onChange={(event) => setDayByKey((current) => ({ ...current, [item.key]: event.target.value }))} className="mt-1 rounded-xl border border-[#d3dbcf] bg-[#f8f7f1] px-2.5 py-1.5 text-xs font-semibold normal-case tracking-normal text-[#60703d] outline-none"><option value={item.workoutDayId}>{availableDays.find((day) => day.id === (dayByKey[item.key] ?? item.workoutDayId))?.label ?? "Día de entrenamiento"}</option>{availableDays.filter((day) => day.id !== (dayByKey[item.key] ?? item.workoutDayId) && !Object.values(dayByKey).includes(day.id)).map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select></label>
                </div>
                <button type="button" title="Eliminar cardio de este día" aria-label="Eliminar cardio de este día" disabled={isRemoving === item.key} onClick={() => removeConfiguration(item)} className="absolute right-3 top-3 rounded-full p-2 text-[#9b6a58] transition hover:bg-[#f6e8de] disabled:opacity-50"><Trash2 size={16} /></button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-medium text-[#68736b]">
                    Modalidad
                    <select value={config.modality} onChange={(event) => updateConfig(item, { modality: event.target.value })} className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-[#f8f7f1] px-3 py-2 text-sm text-[#18231f] outline-none focus:border-[#72873f]">
                      {item.modalities.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>

                  <label className="text-xs font-medium text-[#68736b]">
                    Duración
                    <input type="number" min={5} max={180} value={config.duration} onChange={(event) => updateConfig(item, { duration: Number(event.target.value) || item.durationMinutes })} className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-[#f8f7f1] px-3 py-2 text-sm text-[#18231f] outline-none focus:border-[#72873f]" />
                  </label>
                </div>

                <div className="rounded-xl border border-[#e6ebdf] bg-[#fafaf7] p-3 text-sm leading-6 text-[#536055]">
                  {item.effort}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex-1 text-xs font-medium text-[#68736b]">
                    Intensidad
                    <select value={config.intensity} onChange={(event) => updateConfig(item, { intensity: event.target.value as CardioRecommendation["intensity"] })} className="mt-1 w-full rounded-xl border border-[#d3dbcf] bg-[#f8f7f1] px-3 py-2 text-sm text-[#18231f] outline-none focus:border-[#72873f]">
                      {(["Suave", "Moderada", "Intervalos"] as const).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>

                  <button type="button" disabled={isSavingConfiguration === item.key} onClick={() => saveConfiguration(item)} className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-3 py-2 text-xs font-semibold text-[#f6f4ed] disabled:opacity-60">
                    {isSavingConfiguration === item.key ? <TimerReset size={14} className="animate-spin" /> : <Clock3 size={14} />}
                    <Save size={14} /> Aplicar al día
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {availableDays.some((day) => !Object.values(dayByKey).includes(day.id)) ? <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-[#b6c77b] bg-[#f5f8e9] p-4"><div><p className="text-sm font-semibold text-[#18231f]">¿Quieres añadir cardio a otro día?</p><p className="mt-1 text-xs text-[#68736b]">Crea una configuración independiente para un día libre.</p></div><select value={newDayId} onChange={(event) => setNewDayId(event.target.value)} className="rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-sm text-[#18231f]"><option value="">Seleccionar día</option>{availableDays.filter((day) => !Object.values(dayByKey).includes(day.id)).map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select><button type="button" disabled={!newDayId} onClick={addCardioDay} className="rounded-full bg-[#72873f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Añadir tarjeta</button></div> : null}

      {status ? <p className="mt-4 text-sm font-medium text-[#60703d]">{status}</p> : null}
    </section>
  );
}
