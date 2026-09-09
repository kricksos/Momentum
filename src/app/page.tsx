import { ArrowUpRight, Check, ChevronRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";

import { HeaderAccount } from "@/components/header-account";
import { createClient } from "@/lib/supabase/server";

const benefits = [
  ["Rutina adaptada", "Entrenamiento según tu experiencia, tu tiempo y el material que tienes."],
  ["Nutrición flexible", "Una guía entre 3 y 6 comidas, ajustada a tu objetivo y a tu día a día."],
  ["Progreso visible", "Registra tus sesiones, tu peso y tus avances con claridad."],
  ["Ajustes responsables", "Si algo no encaja o tienes molestias, revisamos tu propuesta."],
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const userName = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "Mi cuenta";

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f1e9] text-[#18231f]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="#top" className="flex items-center gap-3" aria-label="Momentum, inicio">
          <span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b] shadow-[0_8px_24px_rgba(24,35,31,0.16)]">
            <Sparkles size={18} strokeWidth={2.5} />
          </span>
          <span className="text-xl font-semibold tracking-[-0.03em]">Momentum</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#59645e] md:flex" aria-label="Principal">
          <a className="transition-colors hover:text-[#18231f]" href="#how-it-works">Cómo funciona</a>
          <a className="transition-colors hover:text-[#18231f]" href="#personalization">Personalización</a>
          <a className="transition-colors hover:text-[#18231f]" href="#preview">Vista previa</a>
        </nav>
        <HeaderAccount initialUser={user ? { email: user.email ?? "", name: userName } : null} />
      </header>

      <main id="top">
        <section className="relative mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-20">
          <div className="relative z-10 max-w-xl">
            <p className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#6b785f]">
              <span className="h-px w-8 bg-[#91a34d]" /> Progreso con intención
            </p>
            <h1 className="max-w-lg text-6xl font-semibold leading-[0.94] tracking-[-0.07em] text-[#18231f] sm:text-7xl lg:text-[5.6rem]">
              Tu plan.<br />Tu ritmo.<br /><span className="text-[#72873f]">Tu progreso.</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-[#59645e]">
              Crea una rutina y una guía nutricional adaptadas a tus objetivos, tu tiempo y tu forma de entrenar.
            </p>
            <div id="start" className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed] transition-transform hover:-translate-y-0.5">
                Comenzar mi plan <ArrowUpRight size={17} />
              </a>
              <span className="flex items-center gap-2 text-sm text-[#69736c]"><Clock3 size={16} /> Menos de 5 minutos · Sin compromiso</span>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#59645e]">
              <span className="flex items-center gap-2"><Check size={16} className="text-[#7b963d]" /> Adaptado a ti</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#7b963d]" /> Gratuito para empezar</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#7b963d]" /> Tus datos bajo tu control</span>
            </div>
          </div>

          <div id="preview" className="relative min-h-[500px] lg:min-h-[580px]">
            <div className="absolute -right-24 top-4 h-80 w-80 rounded-full bg-[#d7f36b]/50 blur-3xl" aria-hidden="true" />
            <div className="relative mx-auto max-w-xl rotate-[2deg] rounded-[2rem] border border-white/70 bg-[#25352e] p-4 shadow-[0_30px_90px_rgba(34,52,43,0.25)] sm:p-6">
              <div className="rounded-[1.4rem] bg-[#f6f4ed] p-5 sm:p-7">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#819078]">Tu semana</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">A tu medida.</h2></div>
                  <span className="rounded-full bg-[#e7f5b4] px-3 py-1 text-xs font-semibold text-[#55672c]">Nivel 1</span>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#e7e7e1] p-4"><p className="text-xs text-[#60703d]">Tu objetivo</p><p className="mt-3 text-lg font-semibold">A tu medida</p><div className="mt-5 h-1.5 rounded-full bg-white/70"><div className="h-full w-1/3 rounded-full bg-[#72873f]" /></div></div>
                  <div className="rounded-2xl bg-[#e9e8e1] p-4"><p className="text-xs text-[#68706b]">Tu semana</p><p className="mt-3 text-lg font-semibold">Tu ritmo</p><p className="mt-5 text-xs text-[#68706b]">Entrenamiento y nutrición</p></div>
                </div>
                <div className="mt-3 rounded-2xl bg-[#18231f] p-5 text-[#f6f4ed]">
                  <div className="flex items-center justify-between"><div><p className="text-xs text-[#aeb8aa]">Siguiente entrenamiento</p><p className="mt-2 text-xl font-semibold">Full body · A</p></div><span className="grid size-10 place-items-center rounded-full bg-[#d7f36b] text-[#18231f]"><ChevronRight size={18} /></span></div>
                  <div className="mt-6 flex gap-2 text-xs text-[#b9c2b7]"><span className="rounded-full border border-white/15 px-3 py-1.5">6 ejercicios</span><span className="rounded-full border border-white/15 px-3 py-1.5">42 min</span></div>
                </div>
                <div className="mt-6 flex items-end gap-2 border-b border-[#d9ddd3] pb-4"><div className="h-16 w-1/5 rounded-t-lg bg-[#cbdca2]" /><div className="h-24 w-1/5 rounded-t-lg bg-[#b3ca75]" /><div className="h-20 w-1/5 rounded-t-lg bg-[#cbdca2]" /><div className="h-32 w-1/5 rounded-t-lg bg-[#879c4e]" /><div className="h-40 w-1/5 rounded-t-lg bg-[#72873f]" /></div>
                <p className="mt-3 text-xs text-[#78827a]">Tu constancia empieza con un plan que encaja.</p>
              </div>
            </div>
            <div className="absolute -bottom-2 -left-2 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur sm:bottom-3 sm:left-0"><p className="text-xs text-[#758078]">Racha actual</p><p className="mt-1 text-2xl font-semibold tracking-[-0.05em]">4 días <span className="text-base">·</span></p></div>
          </div>
        </section>

        <section className="border-y border-[#d9ddd3] bg-[#18231f] px-6 py-20 text-[#f6f4ed] lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d7f36b]">Lo que cambia contigo</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Una dirección clara para avanzar.</h2><p className="mt-5 max-w-xl text-base leading-7 text-[#c8d0c5]">Momentum convierte tus circunstancias reales en un plan que puedes entender, seguir y ajustar.</p></div><div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([title, text]) => <div key={title} className="bg-[#1f3029] p-6"><Check className="text-[#d7f36b]" size={20} /><h3 className="mt-10 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#c8d0c5]">{text}</p></div>)}</div></div>
        </section>

        <section id="how-it-works" className="border-y border-[#d9ddd3] bg-[#f8f7f1] px-6 py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl"><div className="max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#819078]">Sin complicarlo</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Empieza desde donde estás.</h2></div><div className="mt-14 grid gap-10 md:grid-cols-3"><div><span className="text-sm font-semibold text-[#819078]">01</span><h3 className="mt-5 text-xl font-semibold">Cuéntanos sobre ti</h3><p className="mt-3 max-w-xs leading-7 text-[#68736b]">Tus objetivos, tu experiencia, tu tiempo y las circunstancias que importan.</p></div><div><span className="text-sm font-semibold text-[#819078]">02</span><h3 className="mt-5 text-xl font-semibold">Encontramos tu ritmo</h3><p className="mt-3 max-w-xs leading-7 text-[#68736b]">Construimos una propuesta inicial que puedas sostener en tu semana real.</p></div><div><span className="text-sm font-semibold text-[#819078]">03</span><h3 className="mt-5 text-xl font-semibold">Avanza con claridad</h3><p className="mt-3 max-w-xs leading-7 text-[#68736b]">Registra lo que haces, entiende tus avances y ajusta cuando sea necesario.</p></div></div></div>
        </section>

        <section id="personalization" className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-28"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#819078]">Personalización de verdad</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">No tienes que encajar en un plan.</h2><p className="mt-6 max-w-md leading-8 text-[#68736b]">Momentum tiene en cuenta el contexto detrás del objetivo para ayudarte a avanzar sin convertir el progreso en otra fuente de presión.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{["Objetivo", "Experiencia", "Disponibilidad", "Equipamiento", "Sueño", "Preferencias"].map((item) => <div key={item} className="min-h-32 rounded-2xl border border-[#d9ddd3] bg-[#f8f7f1] p-5"><span className="grid size-8 place-items-center rounded-full bg-[#e7f5b4] text-sm font-semibold text-[#60703d]">✓</span><p className="mt-8 font-medium">{item}</p></div>)}</div></section>

        <section className="border-t border-[#d9ddd3] bg-[#e7f5b4] px-6 py-16 lg:px-10 lg:py-20"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#60703d]">Empieza desde donde estás</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Tu siguiente paso puede ser sencillo.</h2></div><a href="/onboarding" className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-6 py-3.5 text-sm font-semibold text-[#f6f4ed]">Comenzar mi plan <ArrowUpRight size={17} /></a></div></section>
      </main>

      <footer className="border-t border-[#d9ddd3] px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[#68736b] sm:flex-row sm:items-center"><p className="font-semibold text-[#18231f]">Momentum</p><p>Tu plan. Tu ritmo. Tu progreso.</p><p>© 2026 Momentum</p></div></footer>
    </div>
  );
}
