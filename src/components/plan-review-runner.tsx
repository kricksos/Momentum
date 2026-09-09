"use client";

import { Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PlanType = "nutrition" | "workout";

const content: Record<PlanType, { title: string; stages: string[]; success: string; dashboardTab: string }> = {
  nutrition: {
    title: "Actualizando tu dieta",
    stages: ["Revisando tus intolerancias...", "Preparando comidas compatibles...", "Calculando tus cantidades...", "Guardando tu nueva dieta..."],
    success: "Tu dieta se ha actualizado con tus nuevas intolerancias y alergias.",
    dashboardTab: "nutrition",
  },
  workout: {
    title: "Actualizando tu rutina",
    stages: ["Revisando tus lesiones...", "Seleccionando ejercicios seguros...", "Adaptando tus sesiones...", "Guardando tu nueva rutina..."],
    success: "Tu rutina se ha actualizado para tener en cuenta tus lesiones y molestias.",
    dashboardTab: "training",
  },
};

export function PlanReviewRunner({ type }: { type: PlanType }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const copy = content[type];

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const stageTimer = window.setInterval(() => setStageIndex((current) => Math.min(current + 1, copy.stages.length - 1)), 750);
    const regenerate = async () => {
      const response = await fetch(`/api/plans/${type}/regenerate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setCompleted(false);
        setError(data.error ?? "No hemos podido actualizar tu plan. Inténtalo de nuevo.");
        return;
      }
      window.setTimeout(() => {
        setStageIndex(copy.stages.length - 1);
        setCompleted(true);
      }, 500);
    };
    void regenerate();
    return () => window.clearInterval(stageTimer);
  }, [copy.stages.length, type]);

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col items-center justify-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-[#18231f] text-[#d7f36b]">
          {completed ? <Check size={26} /> : <LoaderCircle size={26} className="animate-spin" />}
        </span>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{completed ? "Plan actualizado." : copy.title}</h1>
        <p className="mt-3 max-w-md text-[#68736b]">{completed ? copy.success : copy.stages[stageIndex]}</p>
        <div className="mt-8 h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#dfe4d8]"><div className="h-full rounded-full bg-[#72873f] transition-all duration-500" style={{ width: `${completed ? 100 : Math.round(((stageIndex + 1) / copy.stages.length) * 100)}%` }} /></div>
        <ul className="mt-8 space-y-2 text-left">
          {copy.stages.map((stage, index) => <li key={stage} className={`flex items-center gap-2 text-sm ${completed || index <= stageIndex ? "font-semibold text-[#3d4a24]" : "text-[#a7b09c]"}`}>{completed || index < stageIndex ? <Check size={15} className="text-[#72873f]" /> : index === stageIndex ? <LoaderCircle size={15} className="animate-spin" /> : <span className="size-[15px]" />}{stage}</li>)}
        </ul>
        {error && <><p className="mt-6 text-sm font-semibold text-[#a64e3c]">{error}</p><Link href="/dashboard" className="mt-6 inline-flex rounded-full bg-[#18231f] px-6 py-3 text-sm font-semibold text-white">Volver al panel</Link></>}
        {completed && <Link href={`/dashboard?tab=${copy.dashboardTab}`} className="mt-8 inline-flex rounded-full bg-[#18231f] px-6 py-3 text-sm font-semibold text-white">Ver mi plan</Link>}
      </div>
    </main>
  );
}