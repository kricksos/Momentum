"use client";

import { ShieldCheck, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { foodRestrictionOptions } from "@/lib/food-restrictions";
import { injuryOptions } from "@/lib/injuries";

type PersonalizationStatusProps = { initialInjuries: string[]; initialFoodRestrictions: string[] };

function withoutNone(values: string[]) {
  return values.filter((value) => value !== "Ninguna");
}

export function PersonalizationStatus({ initialInjuries, initialFoodRestrictions }: PersonalizationStatusProps) {
  const router = useRouter();
  const [injuries, setInjuries] = useState(withoutNone(initialInjuries));
  const [foodRestrictions, setFoodRestrictions] = useState(withoutNone(initialFoodRestrictions));
  const [message, setMessage] = useState<string | null>(null);
  const hasLoadedInitialValues = useRef(false);

  function toggle(value: string, values: string[], setValues: (nextValues: string[]) => void) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  const save = useEffectEvent(async () => {
    setMessage(null);
    const response = await fetch("/api/profile/restrictions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodRestrictions, injuries }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "No hemos podido guardar los cambios. Inténtalo de nuevo.");
      return;
    }
    router.refresh();
  });

  useEffect(() => {
    if (!hasLoadedInitialValues.current) {
      hasLoadedInitialValues.current = true;
      return;
    }

    const saveTimer = window.setTimeout(() => {
      void save();
    }, 500);
    return () => window.clearTimeout(saveTimer);
  }, [foodRestrictions, injuries]);

  return (
    <div className="mt-8 grid gap-3 md:grid-cols-2">
      <section className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><ShieldCheck size={18} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Entrenamiento</p>
            <p className="mt-1 text-sm font-semibold text-[#18231f]">{injuries.length ? "Adaptado por lesiones activas" : "Sin lesiones activas"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {injuryOptions.filter((option) => option !== "Ninguna").map((option) => <button type="button" key={option} onClick={() => toggle(option, injuries, setInjuries)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${injuries.includes(option) ? "border-[#72873f] bg-[#e7f5b4] text-[#60703d]" : "border-[#cfd7c8] bg-white/70 text-[#68736b]"}`}>{option}</button>)}
        </div>
      </section>
      <section className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><Utensils size={18} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Nutrición</p>
            <p className="mt-1 text-sm font-semibold text-[#18231f]">{foodRestrictions.length ? "Filtrada por intolerancias activas" : "Sin intolerancias activas"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {foodRestrictionOptions.filter((option) => option !== "Ninguna").map((option) => <button type="button" key={option} onClick={() => toggle(option, foodRestrictions, setFoodRestrictions)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${foodRestrictions.includes(option) ? "border-[#72873f] bg-[#e7f5b4] text-[#60703d]" : "border-[#cfd7c8] bg-white/70 text-[#68736b]"}`}>{option}</button>)}
        </div>
      </section>
      <div className="md:col-span-2">
        {message && <p className="text-sm font-semibold text-[#a64e3c]">{message}</p>}
      </div>
    </div>
  );
}