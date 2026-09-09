"use client";

import { ArrowRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = { isAuthenticated: boolean };

const stages = [
  "Revisando tu punto de partida...",
  "Preparando una rutina adaptada...",
  "Calculando tus calorías y macronutrientes...",
  "Ajustando la propuesta a tu disponibilidad...",
  "Organizando tu seguimiento...",
];

const highlights = [
  ["Objetivo", "Una dirección clara para tu progreso"],
  ["Entrenamiento", "Una frecuencia que encaja contigo"],
  ["Nutrición", "Una referencia inicial adaptada"],
  ["Seguimiento", "Una forma sencilla de ver tus avances"],
];

export function OnboardingPreparation({ isAuthenticated }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStageIndex((current) => {
        if (current >= stages.length - 1) {
          window.clearInterval(timer);
          setCompleted(true);
          return current;
        }
        return current + 1;
      });
    }, 800);

    return () => window.clearInterval(timer);
  }, []);

  if (!completed) {
    const progress = Math.round(((stageIndex + 1) / stages.length) * 100);
    return (
      <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col items-center justify-center text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-[#18231f] text-[#d7f36b] shadow-[0_16px_30px_rgba(24,35,31,0.16)]"><LoaderCircle size={28} className="animate-spin" /></span>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#819078]">Momentum está trabajando</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Estamos preparando tu propuesta.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#68736b]">Estamos reuniendo tus respuestas para que el siguiente paso tenga sentido para ti.</p>
          <div className="mt-9 h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#dfe4d8]"><div className="h-full rounded-full bg-[#72873f] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          <ul className="mt-8 w-full max-w-sm space-y-3 text-left">{stages.map((stage, index) => <li key={stage} className={`flex items-center gap-3 text-sm ${index <= stageIndex ? "font-semibold text-[#3d4a24]" : "text-[#a7b09c]"}`}>{index < stageIndex ? <Check size={16} className="text-[#72873f]" /> : index === stageIndex ? <LoaderCircle size={16} className="animate-spin text-[#72873f]" /> : <span className="size-4" />}{stage}</li>)}</ul>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3" aria-label="Volver a Momentum"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><Sparkles size={18} /></span><span className="font-semibold">Momentum</span></Link><span className="text-sm text-[#68736b]">Propuesta inicial</span></header>
        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#819078]">Tu propuesta está lista</p><h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.07em] sm:text-7xl">Un plan que empieza contigo.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#68736b]">Hemos preparado una primera orientación a partir de tus objetivos, tu disponibilidad y tu forma de entrenar.</p><div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><Link href={isAuthenticated ? "/dashboard" : "/register"} className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed]">{isAuthenticated ? "Continuar a mi dashboard" : "Desbloquear mi planificación"} <ArrowRight size={17} /></Link>{!isAuthenticated && <Link href="/login" className="text-sm font-semibold text-[#60703d] underline underline-offset-4">Ya tengo una cuenta</Link>}</div></div>
          <div className="rounded-[2rem] bg-[#25352e] p-4 shadow-[0_30px_90px_rgba(34,52,43,0.22)] sm:p-6"><div className="rounded-[1.5rem] bg-[#f8f7f1] p-6 sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#819078]">Resumen Momentum</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Pensado para tu semana.</h2></div><span className="grid size-11 place-items-center rounded-full bg-[#e7f5b4] text-[#60703d]"><Check size={20} /></span></div><div className="mt-8 space-y-3">{highlights.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-[#d9ddd3] py-4"><div><p className="text-sm text-[#819078]">{label}</p><p className="mt-1 font-semibold">{value}</p></div><span className="text-[#819078]">✓</span></div>)}</div><p className="mt-7 text-sm leading-6 text-[#68736b]">La planificación completa, el seguimiento y tu próximo entrenamiento estarán disponibles al crear tu cuenta gratuita.</p></div></div>
        </section>
      </div>
    </main>
  );
}
