"use client";

import { Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const stages = [
  "Leyendo tu perfil y disponibilidad...",
  "Eligiendo la división semanal...",
  "Seleccionando ejercicios compatibles...",
  "Ajustando series, repeticiones y descansos...",
  "Activando tu nueva rutina...",
];

export function AutomaticWorkoutRunner() {
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    const stageTimer = window.setInterval(() => setStageIndex((current) => Math.min(current + 1, stages.length - 1)), 700);
    const generate = async () => {
      const minimumDisplay = new Promise((resolve) => window.setTimeout(resolve, stages.length * 700));
      const [response] = await Promise.all([fetch("/api/workouts/automatic", { method: "POST" }), minimumDisplay]);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "No hemos podido generar tu rutina automática.");
        return;
      }
      setStageIndex(stages.length - 1);
      setCompleted(true);
    };
    void generate();
    return () => window.clearInterval(stageTimer);
  }, []);

  return <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8"><div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-2xl bg-[#18231f] text-[#d7f36b]">{completed ? <Check size={26} /> : <LoaderCircle size={26} className="animate-spin" />}</span><h1 className="mt-8 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{completed ? "Rutina preparada." : "Generando tu rutina"}</h1><p className="mt-3 max-w-md text-[#68736b]">{completed ? "Tu rutina automática ya está activa y lista para empezar." : stages[stageIndex]}</p><div className="mt-8 h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#dfe4d8]"><div className="h-full rounded-full bg-[#72873f] transition-all duration-500" style={{ width: `${completed ? 100 : Math.round(((stageIndex + 1) / stages.length) * 100)}%` }} /></div><ul className="mt-8 space-y-2 text-left">{stages.map((stage, index) => <li key={stage} className={`flex items-center gap-2 text-sm ${completed || index <= stageIndex ? "font-semibold text-[#3d4a24]" : "text-[#a7b09c]"}`}>{completed || index < stageIndex ? <Check size={15} className="text-[#72873f]" /> : index === stageIndex ? <LoaderCircle size={15} className="animate-spin" /> : <span className="size-[15px]" />}{stage}</li>)}</ul>{error && <><p className="mt-6 text-sm font-semibold text-[#a64e3c]">{error}</p><Link href="/workout/builder?setup=chooser" className="mt-6 inline-flex rounded-full bg-[#18231f] px-6 py-3 text-sm font-semibold text-white">Volver al configurador</Link></>}{completed && <Link href="/dashboard?tab=training" className="mt-8 inline-flex rounded-full bg-[#18231f] px-6 py-3 text-sm font-semibold text-white">Ver mi rutina</Link>}</div></main>;
}