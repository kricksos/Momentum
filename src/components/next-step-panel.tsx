import { ArrowRight, Check, Dumbbell, Scale } from "lucide-react";
import Link from "next/link";

type NextStepPanelProps = {
  completedToday: boolean;
  workoutLabel: string | null;
  workoutHref: string | null;
  hasProfile: boolean;
};

export function NextStepPanel({ completedToday, workoutLabel, workoutHref, hasProfile }: NextStepPanelProps) {
  const showWorkout = hasProfile && !completedToday && workoutLabel && workoutHref;
  const title = showWorkout ? "Tu siguiente paso" : completedToday ? "Buen trabajo por hoy" : "Tu espacio está listo";
  const description = showWorkout ? `Hoy toca ${workoutLabel}. Completa la sesión para mantener tu ritmo.` : completedToday ? "Ya has completado tu entrenamiento. Mañana tendrás disponible el siguiente día." : "Genera tu plan para empezar a registrar tu progreso.";

  return (
    <section className="mt-8 flex flex-col justify-between gap-5 rounded-3xl bg-[#18231f] p-6 text-[#f6f4ed] sm:flex-row sm:items-center sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#d7f36b] text-[#18231f]">{showWorkout ? <Dumbbell size={21} /> : completedToday ? <Check size={21} /> : <Scale size={21} />}</span>
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b9c2b7]">{title}</p><p className="mt-2 max-w-xl text-lg font-semibold">{description}</p></div>
      </div>
      {showWorkout ? <Link href={workoutHref} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#d7f36b] px-5 py-3 text-sm font-semibold text-[#18231f]">Comenzar sesión <ArrowRight size={16} /></Link> : null}
    </section>
  );
}