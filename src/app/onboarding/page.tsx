"use client";

import { ArrowLeft, ArrowRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { foodRestrictionOptions } from "@/lib/food-restrictions";
import { injuryOptions } from "@/lib/injuries";

const questions = [
  { key: "goal", title: "¿Cuál es tu objetivo principal?", description: "Elegiremos el punto de partida que mejor encaja contigo.", type: "single_select", options: ["Ganar masa muscular", "Perder grasa", "Recomposición corporal", "Mantener peso", "Mejorar rendimiento", "Mejorar salud general"] },
  { key: "sex", title: "¿Cómo te identificas?", description: "Lo utilizaremos únicamente para personalizar los cálculos iniciales.", type: "single_select", options: ["Hombre", "Mujer"] },
  { key: "age", title: "¿Qué edad tienes?", description: "Una referencia importante para adaptar tu propuesta.", type: "number", unit: "años" },
  { key: "height", title: "¿Cuánto mides?", description: "Puedes introducir tu altura en centímetros.", type: "number", unit: "cm" },
  { key: "weight", title: "¿Cuál es tu peso actual?", description: "No buscamos juzgarte, solo conocer tu punto de partida.", type: "number", unit: "kg" },
  { key: "target_weight", title: "¿A qué peso te gustaría llegar?", description: "Es opcional. Tu objetivo también puede ser sentirte mejor y rendir más.", type: "number", unit: "kg" },
  { key: "experience", title: "¿Cuál es tu experiencia entrenando?", description: "Así evitamos darte un plan demasiado fácil o demasiado exigente.", type: "single_select", options: ["Nunca he entrenado", "Menos de 1 año", "Entre 1 y 3 años", "Entre 3 y 5 años", "Más de 5 años"] },
  { key: "days_per_week", title: "¿Cuántos días puedes entrenar?", description: "Elegiremos una frecuencia sostenible para tu semana.", type: "single_select", options: ["2 días", "3 días", "4 días", "5 días", "6 días"] },
  { key: "session_duration", title: "¿Cuánto tiempo tienes por sesión?", description: "Un buen plan empieza por respetar tu tiempo disponible.", type: "single_select", options: ["30 minutos", "45 minutos", "60 minutos", "90 minutos"] },
  { key: "training_place", title: "¿Dónde entrenas habitualmente?", description: "Adaptaremos los ejercicios a tu entorno y al material que tienes disponible.", type: "single_select", options: ["Gimnasio completo", "Gimnasio básico", "Casa", "Mixto"] },
  { key: "workout_planning_mode", title: "¿Cómo quieres empezar tu rutina?", description: "Puedes dejar que Momentum la prepare por ti o crearla a tu manera desde tu dashboard.", type: "single_select", options: ["Automática", "Manual"] },
  { key: "daily_activity", title: "¿Cómo es tu actividad diaria?", description: "Esto ayuda a entender mejor tu ritmo de vida.", type: "single_select", options: ["Trabajo sentado", "Algo activo", "Activo", "Trabajo físico exigente"] },
  { key: "sleep", title: "¿Cuántas horas duermes normalmente?", description: "El descanso también forma parte del progreso.", type: "single_select", options: ["Menos de 5", "5 - 6", "6 - 7", "7 - 8", "Más de 8"] },
  { key: "diet", title: "¿Cómo definirías tu alimentación?", description: "No hay una respuesta correcta: buscamos que el plan sea realista.", type: "single_select", options: ["Omnívoro", "Vegetariano", "Vegano", "Otra"] },
  { key: "food_restrictions", title: "¿Tienes alergias o intolerancias alimentarias?", description: "Podemos adaptar la dieta para evitar alimentos que te hagan sentir peor.", type: "multi_select", options: foodRestrictionOptions },
  { key: "meal_count", title: "¿Cuántas comidas puedes hacer al día?", description: "Distribuiremos tu dieta según el número de comidas que encaja de verdad con tu rutina.", type: "single_select", options: ["3 comidas", "4 comidas", "5 comidas", "6 comidas"] },
  { key: "injuries", title: "¿Tienes alguna lesión o limitación?", description: "La seguridad está por encima de cualquier objetivo.", type: "multi_select", options: injuryOptions },
  { key: "motivation", title: "¿Por qué quieres conseguir este objetivo?", description: "Esta respuesta nos ayudará a acompañarte de una forma más personal.", type: "text", placeholder: "Quiero sentirme..." },
] as const;

const optionalQuestionKeys = new Set(["target_weight"]);

const optionDescriptions: Record<string, Record<string, string>> = {
  goal: {
    "Ganar masa muscular": "Aumentar músculo y fuerza de forma progresiva.",
    "Perder grasa": "Reducir grasa corporal manteniendo el máximo rendimiento posible.",
    "Recomposición corporal": "Mejorar tu composición corporal ganando músculo y perdiendo grasa.",
    "Mantener peso": "Conservar tu peso mientras mejoras hábitos, fuerza y condición física.",
    "Mejorar rendimiento": "Entrenar para moverte mejor, rendir más y sentirte más capaz.",
    "Mejorar salud general": "Construir una base sostenible de movimiento, energía y bienestar.",
  },
  training_place: {
    "Gimnasio completo": "Máquinas, poleas, barras, mancuernas y material variado.",
    "Gimnasio básico": "Mancuernas, barras y material esencial; sin depender de máquinas avanzadas.",
    Casa: "Peso corporal, bandas, mancuernas o kettlebell, según lo que tengas.",
    Mixto: "Combinas casa y gimnasio según el día o la disponibilidad.",
  },
};

type Answer = string | number | string[];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = questions[currentIndex];
  const currentAnswer = answers[question.key];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  useEffect(() => {
    const storedToken = window.sessionStorage.getItem("momentum_onboarding_token");

    const sessionRequest = storedToken
      ? Promise.resolve({ sessionToken: storedToken })
      : fetch("/api/onboarding/session", { method: "POST" }).then(async (response) => {
          if (!response.ok) throw new Error("No hemos podido iniciar tu sesión.");
          return response.json();
        });

    sessionRequest
      .then(async (response) => {
        return response;
      })
      .then((data: { sessionToken: string }) => {
        window.sessionStorage.setItem("momentum_onboarding_token", data.sessionToken);
        window.localStorage.setItem("momentum_onboarding_token", data.sessionToken);
        setSessionToken(data.sessionToken);
      })
      .catch(() => setError("No hemos podido iniciar tu plan. Inténtalo de nuevo en unos segundos."))
      .finally(() => setIsLoading(false));
  }, []);

  function selectAnswer(value: Answer) {
    if (question.type === "multi_select") {
      const selected = Array.isArray(currentAnswer) ? currentAnswer : [];
      if (value === "Ninguna") {
        setAnswers((previous) => ({ ...previous, [question.key]: ["Ninguna"] }));
        return;
      }
      const selectedWithoutNone = selected.filter((item) => item !== "Ninguna");
      const nextValue = selected.includes(String(value))
        ? selectedWithoutNone.filter((item) => item !== String(value))
        : [...selectedWithoutNone, String(value)];
      setAnswers((previous) => ({ ...previous, [question.key]: nextValue }));
      return;
    }

    setAnswers((previous) => ({ ...previous, [question.key]: value }));
  }

  async function completeOnboarding() {
    if (!sessionToken) return;

    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    });

    if (!response.ok) throw new Error("No hemos podido completar tu perfil.");
    const conversionResponse = await fetch("/api/onboarding/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    });

    if (conversionResponse.ok) {
      window.sessionStorage.removeItem("momentum_onboarding_token");
    }
    router.push("/preview");
  }

  async function goNext() {
    const hasAnswer = Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer !== undefined && currentAnswer !== "";
    if (!hasAnswer && !optionalQuestionKeys.has(question.key)) return;
    if (!sessionToken) return;

    if (!hasAnswer) {
      setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
      return;
    }

    setIsSaving(true);
    setError(null);

    async function saveAnswer(token: string) {
      return fetch("/api/onboarding/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token, questionKey: question.key, answerValue: currentAnswer ?? null, answerType: question.type }),
      });
    }

    try {
      let response = await saveAnswer(sessionToken);

      if (response.status === 401) {
        const newSessionResponse = await fetch("/api/onboarding/session", { method: "POST" });
        if (!newSessionResponse.ok) throw new Error("No hemos podido reiniciar tu sesión.");
        const newSession = await newSessionResponse.json() as { sessionToken: string };
        window.sessionStorage.setItem("momentum_onboarding_token", newSession.sessionToken);
        window.localStorage.setItem("momentum_onboarding_token", newSession.sessionToken);
        setSessionToken(newSession.sessionToken);
        response = await saveAnswer(newSession.sessionToken);
      }

      if (!response.ok) throw new Error("No hemos podido guardar tu respuesta.");
      if (currentIndex === questions.length - 1) {
        await completeOnboarding();
      } else {
        setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
      }
    } catch {
      setError("No hemos podido guardar esta respuesta. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <main className="grid min-h-screen place-items-center bg-[#f4f1e9] text-[#18231f]"><LoaderCircle className="animate-spin" /></main>;

  if (isComplete) {
    const summary: Array<[string, Answer | undefined]> = [
      ["Objetivo", answers.goal],
      ["Experiencia", answers.experience],
      ["Disponibilidad", answers.days_per_week],
      ["Duración", answers.session_duration],
      ["Entorno", answers.training_place],
    ];

    return (
      <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
          <header className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3" aria-label="Volver a Momentum"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b] shadow-[0_8px_20px_rgba(24,35,31,0.14)]"><Sparkles size={18} /></span><span className="font-semibold">Momentum</span></Link><span className="rounded-full border border-[#d3dbcf] bg-[#f8f7f1] px-3 py-1.5 text-sm text-[#68736b]">Perfil completado</span></header>
          <section className="flex flex-1 flex-col justify-center py-12"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Tu punto de partida</p><h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-tight tracking-[-0.06em] sm:text-7xl">Ya tenemos una dirección.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-[#68736b]">Hemos reunido lo importante para preparar una propuesta que encaje contigo.</p><div className="mt-10 grid gap-3 sm:grid-cols-2">{summary.map(([label, value]) => <div key={label} className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-5 shadow-[0_10px_24px_rgba(50,65,49,0.04)]"><p className="text-sm text-[#819078]">{label}</p><p className="mt-2 font-semibold">{Array.isArray(value) ? value.join(", ") : value || "Pendiente"}</p></div>)}</div><div className="mt-6 rounded-2xl bg-[#18231f] p-6 text-[#f6f4ed] shadow-[0_20px_40px_rgba(24,35,31,0.16)]"><p className="text-sm text-[#b9c2b7]">Siguiente paso</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Desbloquea tu planificación completa.</h2><p className="mt-3 max-w-lg leading-7 text-[#c8d0c5]">La rutina, la dieta y el seguimiento estarán disponibles al crear tu cuenta gratuita.</p><Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d7f36b] px-5 py-3 text-sm font-semibold text-[#18231f]">Crear mi cuenta gratuita <ArrowRight size={16} /></Link></div></section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver a Momentum"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><Sparkles size={18} /></span><span className="font-semibold">Momentum</span></Link>
          <span className="text-sm text-[#68736b]">Paso {currentIndex + 1} de {questions.length}</span>
        </header>
        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-[#dfe4d8]"><div className="h-full rounded-full bg-[#72873f] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        <section className="flex flex-1 flex-col justify-center py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">{progress}% completado</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-6xl">{question.title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#68736b]">{question.description}</p>
          {question.type === "text" ? <textarea value={typeof currentAnswer === "string" ? currentAnswer : ""} onChange={(event) => selectAnswer(event.target.value)} placeholder={question.placeholder} className="mt-10 min-h-36 w-full max-w-xl resize-none rounded-2xl border border-[#cfd7c8] bg-[#f8f7f1] p-5 text-lg outline-none transition focus:border-[#72873f]" /> : question.type === "number" ? <div className="mt-10 flex max-w-sm items-center gap-3 border-b-2 border-[#aeb9a2] pb-3"><input autoFocus type="number" value={typeof currentAnswer === "number" ? currentAnswer : ""} onChange={(event) => selectAnswer(event.target.value ? Number(event.target.value) : "")} className="w-full bg-transparent text-4xl font-semibold outline-none" placeholder="0" /><span className="text-[#68736b]">{question.unit}</span></div> : <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">{question.options?.map((option) => { const selected = Array.isArray(currentAnswer) ? currentAnswer.includes(option) : currentAnswer === option; const optionDescription = optionDescriptions[question.key]?.[option]; return <button type="button" key={option} onClick={() => selectAnswer(option)} className={`flex min-h-16 items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition ${selected ? "border-[#72873f] bg-[#e7f5b4]" : "border-[#d3dbcf] bg-[#f8f7f1] hover:border-[#9aaa89]"}`}><span><span className="block font-medium">{option}</span>{optionDescription ? <span className="mt-1 block text-sm leading-5 text-[#68736b]">{optionDescription}</span> : null}</span>{selected && <Check size={19} className="shrink-0 text-[#60703d]" />}</button>; })}</div>}
          {error && <p className="mt-6 text-sm font-medium text-[#a64e3c]">{error}</p>}
        </section>
        <footer className="flex items-center justify-between border-t border-[#d9ddd3] pt-5"><button type="button" disabled={currentIndex === 0 || isSaving} onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#68736b] disabled:opacity-40"><ArrowLeft size={17} /> Anterior</button><button type="button" disabled={isSaving || !sessionToken} onClick={goNext} className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-6 py-3 text-sm font-semibold text-[#f6f4ed] disabled:cursor-not-allowed disabled:opacity-40">{isSaving ? <LoaderCircle size={17} className="animate-spin" /> : <>Siguiente <ArrowRight size={17} /></>}</button></footer>
      </div>
    </main>
  );
}
