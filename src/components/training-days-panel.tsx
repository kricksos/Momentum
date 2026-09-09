import { Activity, Check } from "lucide-react";
import Link from "next/link";

export type TrainingDay = {
  id: string;
  name: string;
  exerciseCount: number;
  muscleSummary: string;
  cardio?: { modality: string; durationMinutes: number; intensity: string };
};

type TrainingDaysPanelProps = {
  days: TrainingDay[];
  scheduledId: string | null;
  scheduledIndex: number;
  completedToday: boolean;
  nameFor: (value: string) => string;
  variantFor: (value: string) => string;
};

function muscleTags(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("push")) return ["Pecho", "Hombros", "Tríceps"];
  if (normalized.includes("pull")) return ["Espalda", "Bíceps"];
  if (normalized.includes("legs")) return ["Piernas", "Glúteos"];
  return ["Fuerza", "Cuerpo completo"];
}

export function TrainingDaysPanel({ days, scheduledId, scheduledIndex, completedToday, nameFor, variantFor }: TrainingDaysPanelProps) {
  return <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Días de entrenamiento</h3><p className="mt-1 text-sm text-[#68736b]">Tu ciclo semanal para completar paso a paso.</p></div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">{days.length} días</p></div>{days.length === 0 ? <p className="mt-4 text-sm text-[#68736b]">Todavía no tienes una rutina activa. Genera tu plan para ver tus días aquí.</p> : <div className="mt-4 space-y-3">{days.map((day, index) => { const isNext = day.id === scheduledId; const isCompleted = index < scheduledIndex; const isLocked = isNext && completedToday; return <article key={day.id} className={`rounded-2xl border p-5 ${isCompleted ? "border-[#b6c77b] bg-[#e7f5b4]" : isLocked ? "border-[#c9d3c3] bg-[#f0efe6]" : isNext ? "border-[#72873f] bg-[#e7f5b4]" : "border-[#e3e7dd] bg-white"}`}><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">{isCompleted ? <><Check size={13} /> Día {index + 1} de {days.length} · Completado</> : isLocked ? `Día ${index + 1} de ${days.length} · Disponible mañana` : isNext ? `Día ${index + 1} de ${days.length} · Toca ahora` : `Día ${index + 1} de ${days.length} · Próximamente`}</p><h2 className="mt-1 text-xl font-semibold">{nameFor(day.name)}</h2><p className="mt-1 text-sm text-[#68736b]">{variantFor(day.name)} · {day.exerciseCount} ejercicios</p><div className="mt-3 flex flex-wrap gap-1.5">{muscleTags(day.name).map((tag, tagIndex) => <span key={tag} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tagIndex === 0 ? "bg-[#e7eef0] text-[#3f6068]" : "bg-[#f0e9da] text-[#7a6335]"}`}>{tag}</span>)}{day.cardio ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f5b4] px-2.5 py-1 text-[10px] font-semibold text-[#536b2c]"><Activity size={11} /> {day.cardio.modality} · {day.cardio.durationMinutes} min</span> : null}</div></div>{isCompleted ? <span className="rounded-full bg-[#72873f] px-4 py-2 text-sm font-semibold text-white">Completado</span> : isLocked ? <span className="rounded-full border border-[#d3dbcf] px-4 py-2 text-sm font-semibold text-[#a2aaa2]">Disponible mañana</span> : isNext ? <Link href={`/workout/${day.id}`} className="rounded-full bg-[#18231f] px-4 py-2 text-sm font-semibold text-white">Comenzar</Link> : <span className="rounded-full border border-[#d3dbcf] px-4 py-2 text-sm font-semibold text-[#819078]">En cola</span>}</div></article>; })}</div>}</section>;
}
