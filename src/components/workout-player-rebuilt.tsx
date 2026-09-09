"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock3, LoaderCircle, Play, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Exercise = { id: string; name: string; sets: number; repetitions: string; restSeconds: number; media: [string, string] };
type PreviousLog = { exerciseId: string; setNumber: number; weightKg: number; repetitions: number };
type SetLog = { weightKg: number; repetitions: number };
type WorkoutPlayerProps = { workoutDayId: string; workoutName: string; exercises: Exercise[]; lastPerformance: PreviousLog[] };

function initialRepetitions(value: string, setIndex: number, totalSets: number) {
  const values = value.match(/\d+/g)?.map(Number) ?? [8];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (totalSets <= 1 || minimum === maximum) return maximum;
  return Math.round(maximum - (setIndex * (maximum - minimum)) / (totalSets - 1));
}

function ExerciseMotion({ exercise, heightClass = "h-72" }: { exercise: Exercise; heightClass?: string }) {
  return (
    <div className={`relative ${heightClass} overflow-hidden bg-[#25352e]`}>
      <motion.img
        src={exercise.media[0]}
        alt={`${exercise.name}, posición inicial`}
        className="absolute inset-0 size-full object-cover"
        animate={{ opacity: [1, 1, 0, 0, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", times: [0, 0.36, 0.5, 0.86, 1] }}
      />
      <motion.img
        src={exercise.media[1]}
        alt={`${exercise.name}, posición final`}
        className="absolute inset-0 size-full object-cover"
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", times: [0, 0.36, 0.5, 0.86, 1] }}
      />
      <span className="absolute bottom-4 left-4 rounded-full bg-[#18231f]/85 px-3 py-1.5 text-xs font-semibold text-[#f6f4ed]">Demostración del movimiento</span>
    </div>
  );
}

export function WorkoutPlayerRebuilt({ workoutDayId, workoutName, exercises, lastPerformance }: WorkoutPlayerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() => Object.fromEntries(exercises.map((exercise) => [exercise.id, Array.from({ length: exercise.sets }, (_, index) => {
    const previous = lastPerformance.find((log) => log.exerciseId === exercise.id && log.setNumber === index + 1);
    return { weightKg: previous?.weightKg ?? 0, repetitions: previous?.repetitions ?? initialRepetitions(exercise.repetitions, index, exercise.sets) };
  })])));
  const [isBusy, setIsBusy] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(() => lastPerformance.some((log) => log.exerciseId === exercises[0]?.id) ? null : "Primera vez con este ejercicio: el peso que registres quedará como referencia para tus próximos entrenamientos.");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completedDuration, setCompletedDuration] = useState<number | null>(null);
  const [recordExerciseIds, setRecordExerciseIds] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const activeExercise = exercises[activeIndex];
  const previousExerciseLogs = lastPerformance.filter((log) => log.exerciseId === activeExercise.id);

  async function startWorkout() {
    setIsBusy(true);
    setError(null);
    const response = await fetch("/api/workouts/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", workoutDayId }) });
    const result = await response.json();
    if (!response.ok) setError("No hemos podido iniciar la sesión. Inténtalo de nuevo.");
    else { setSessionId(result.sessionId); setStartedAt(Date.now()); }
    setIsBusy(false);
  }

  function updateSet(setIndex: number, field: keyof SetLog, value: number) {
    setLogs((current) => ({ ...current, [activeExercise.id]: current[activeExercise.id].map((set, index) => index === setIndex ? { ...set, [field]: value } : set) }));
  }

  function payloadFor(exerciseId: string) {
    return logs[exerciseId].map((set, index) => ({ exerciseId, setNumber: index + 1, weightKg: set.weightKg, repetitions: set.repetitions }));
  }

  async function saveExercise() {
    if (!sessionId) return true;
    setIsBusy(true);
    setSavedMessage(null);
    const response = await fetch("/api/workouts/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", sessionId, logs: payloadFor(activeExercise.id) }) });
    if (!response.ok) { setError("No hemos podido guardar este ejercicio. Inténtalo de nuevo."); setIsBusy(false); return false; }
    setSavedMessage("Ejercicio guardado");
    setIsBusy(false);
    return true;
  }

  async function nextExercise() {
    if (await saveExercise()) {
      setActiveIndex((index) => {
        const nextIndex = Math.min(index + 1, exercises.length - 1);
        setSavedMessage(lastPerformance.some((log) => log.exerciseId === exercises[nextIndex]?.id) ? null : "Primera vez con este ejercicio: el peso que registres quedará como referencia para tus próximos entrenamientos.");
        return nextIndex;
      });
    }
  }

  async function completeWorkout() {
    if (!sessionId || !startedAt) return;
    setIsBusy(true);
    setError(null);
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const response = await fetch("/api/workouts/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", sessionId, durationMinutes, logs: exercises.flatMap((exercise) => payloadFor(exercise.id)) }) });
    if (!response.ok) setError("No hemos podido guardar la sesión. Inténtalo de nuevo.");
    else {
      const result = await response.json() as { recordExerciseIds?: string[]; streak?: number };
      setRecordExerciseIds(result.recordExerciseIds ?? []);
      setCurrentStreak(result.streak ?? 0);
      setCompletedDuration(durationMinutes);
      setCompleted(true);
    }
    setIsBusy(false);
  }

  if (completed) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f1e9] px-6 text-[#18231f]"><section className="max-w-lg text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e7f5b4] text-[#60703d]"><Trophy size={30} /></span><p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Sesion completada</p><h1 className="mt-3 text-5xl font-semibold tracking-[-0.06em]">Buen trabajo.</h1><p className="mt-5 text-lg leading-8 text-[#68736b]">Tus series, pesos y repeticiones han quedado guardados.</p>{recordExerciseIds.length > 0 && <div className="mt-6 rounded-2xl border border-[#cfe2a8] bg-[#f5fae8] p-4 text-left"><p className="text-sm font-semibold text-[#3f611d]">Nuevo record personal</p><p className="mt-2 text-sm text-[#4d6331]">Has superado tu mejor peso en {recordExerciseIds.map((id) => exercises.find((exercise) => exercise.id === id)?.name).filter(Boolean).join(", ")}.</p></div>}{currentStreak > 0 && <div className="mt-4 rounded-2xl border border-[#cfe2a8] bg-[#f5fae8] p-4 text-left"><p className="text-sm font-semibold text-[#3f611d]">Racha actual: {currentStreak} {currentStreak === 1 ? "dia" : "dias"}</p><p className="mt-2 text-sm text-[#4d6331]">Cada sesion suma constancia a tu progreso.</p></div>}<div className="mt-8 grid grid-cols-2 gap-3 text-left"><div className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#819078]">Duracion</p><p className="mt-2 text-xl font-semibold">{completedDuration} min</p></div><div className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#819078]">Ejercicios</p><p className="mt-2 text-xl font-semibold">{exercises.length}</p></div></div><Link href="/dashboard" className="mt-8 inline-flex rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed]">Volver al dashboard</Link></section></main>;
  }

  const progress = ((activeIndex + 1) / exercises.length) * 100;
  return <main className="min-h-screen bg-[#f4f1e9] text-[#18231f]"><header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#68736b]"><ChevronLeft size={18} /> Dashboard</Link><span className="text-sm text-[#68736b]">Ejercicio {activeIndex + 1} de {exercises.length}</span></header><div className="mx-auto max-w-5xl px-5 pb-16 sm:px-8"><div className="mb-8 h-2 overflow-hidden rounded-full bg-[#dfe4d8]"><div className="h-full rounded-full bg-[#72873f] transition-all" style={{ width: `${progress}%` }} /></div>{!sessionId ? <section className="grid min-h-[65vh] items-center gap-10 lg:grid-cols-[1fr_0.9fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Dia de entrenamiento</p><h1 className="mt-4 text-5xl font-semibold tracking-[-0.07em] sm:text-7xl">{workoutName}</h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#68736b]">Completa {exercises.length} ejercicios. Solo tendras que avanzar; Momentum guardara tus datos por ti.</p><button type="button" onClick={startWorkout} disabled={isBusy} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed] disabled:opacity-60">{isBusy ? <LoaderCircle size={17} className="animate-spin" /> : <Play size={17} />} Comenzar entrenamiento</button>{error && <p className="mt-4 text-sm text-[#a64e3c]">{error}</p>}</div><div className="overflow-hidden rounded-[2rem] bg-[#25352e] shadow-xl"><ExerciseMotion exercise={activeExercise} heightClass="h-80" /><div className="p-6 text-[#f6f4ed]"><p className="text-sm text-[#b9c2b7]">Primer ejercicio</p><h2 className="mt-2 text-2xl font-semibold">{activeExercise.name}</h2><p className="mt-3 text-sm text-[#d7f36b]">{activeExercise.sets} series · {activeExercise.repetitions} repeticiones</p></div></div></section> : <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]"><div className="overflow-hidden rounded-[2rem] bg-[#25352e] shadow-xl"><ExerciseMotion exercise={activeExercise} /><div className="p-6 text-[#f6f4ed]"><p className="text-sm text-[#b9c2b7]">Ejercicio {activeIndex + 1} de {exercises.length}</p><h1 className="mt-2 text-3xl font-semibold">{activeExercise.name}</h1><p className="mt-4 flex items-center gap-2 text-sm text-[#d7f36b]"><Clock3 size={16} /> Descanso: {activeExercise.restSeconds}s</p></div></div><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Registra tu rendimiento</p>{previousExerciseLogs.length > 0 && <div className="mt-4 rounded-xl border border-[#d3dbcf] bg-[#eef0e8] p-3 text-sm text-[#68736b]"><span className="font-semibold text-[#60703d]">Ultima vez:</span> {previousExerciseLogs.map((log) => `${log.weightKg} kg × ${log.repetitions}`).join(" · ")}</div>}<h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{activeExercise.sets} × {activeExercise.repetitions}</h2><p className="mt-3 text-sm text-[#68736b]">El peso anterior aparece como sugerencia. Puedes modificarlo y se guardara al pasar al siguiente ejercicio.</p><div className="mt-6 space-y-3">{logs[activeExercise.id].map((set, index) => <div key={index} className="grid grid-cols-[auto_1fr_1fr] items-center gap-3 rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-4"><span className="text-sm font-semibold text-[#68736b]">Serie {index + 1}</span><label className="text-xs text-[#819078]">kg<input type="number" min="0" value={set.weightKg || ""} onChange={(event) => updateSet(index, "weightKg", Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[#cfd7c8] bg-white/70 px-2 py-2 text-sm" /></label><label className="text-xs text-[#819078]">reps<input type="number" min="0" value={set.repetitions} onChange={(event) => updateSet(index, "repetitions", Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[#cfd7c8] bg-white/70 px-2 py-2 text-sm" /></label></div>)}</div>{savedMessage && <p className="mt-4 text-sm font-semibold text-[#60703d]">{savedMessage}</p>}{error && <p className="mt-4 text-sm font-semibold text-[#a64e3c]">{error}</p>}<div className="mt-8 flex justify-between gap-3"><button type="button" onClick={() => setActiveIndex((index) => Math.max(0, index - 1))} disabled={activeIndex === 0 || isBusy} className="inline-flex items-center gap-2 rounded-full border border-[#cfd7c8] px-4 py-3 text-sm font-semibold disabled:opacity-40"><ChevronLeft size={17} /> Anterior</button>{activeIndex < exercises.length - 1 ? <button type="button" onClick={nextExercise} disabled={isBusy} className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-5 py-3 text-sm font-semibold text-[#f6f4ed] disabled:opacity-60">{isBusy && <LoaderCircle size={17} className="animate-spin" />} Siguiente ejercicio <ChevronRight size={17} /></button> : <button type="button" onClick={completeWorkout} disabled={isBusy} className="inline-flex items-center gap-2 rounded-full bg-[#d7f36b] px-5 py-3 text-sm font-semibold text-[#18231f] disabled:opacity-60">{isBusy && <LoaderCircle size={17} className="animate-spin" />} Finalizar entrenamiento</button>}</div></div></section>}</div></main>;
}
