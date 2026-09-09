import { Copy, Dumbbell, LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";

type Props = {
  hasActivePlan: boolean;
  routines: Array<{ id: string; name: string; source: string; updatedAt: string; active: boolean }>;
  busy: boolean;
  message: string | null;
  onCreate: (source: "manual" | "copy" | "history", planId?: string) => void;
  onGenerateAutomatic: () => void;
};

export function ManualWorkoutStart({ hasActivePlan, routines, busy, message, onCreate, onGenerateAutomatic }: Props) {
  const hasAutomaticRoutine = routines.some((routine) => routine.active && routine.source === "Automática");
  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-8 text-[#18231f] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard?tab=training" className="text-sm font-semibold text-[#68736b] hover:text-[#18231f]">
          Volver al dashboard
        </Link>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Rutina manual</p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">Construye a tu manera.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#68736b]">Configura tus días, ejercicios, series, repeticiones y descansos. Al activarla, se usará igual que cualquier rutina guiada de Momentum.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <button type="button" onClick={() => onCreate("manual")} disabled={busy} className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-6 text-left hover:border-[#72873f] disabled:opacity-60">
            <Dumbbell className="text-[#72873f]" size={24} />
            <h2 className="mt-8 text-xl font-semibold">Empezar desde cero</h2>
            <p className="mt-2 text-sm leading-6 text-[#68736b]">Crea cada día y ejercicio sin una estructura previa.</p>
          </button>
          {hasActivePlan && <button type="button" onClick={() => onCreate("copy")} disabled={busy} className="rounded-2xl bg-[#18231f] p-6 text-left text-[#f6f4ed] disabled:opacity-60">
            <Copy className="text-[#d7f36b]" size={24} />
            <h2 className="mt-8 text-xl font-semibold">Copiar mi rutina actual</h2>
            <p className="mt-2 text-sm leading-6 text-[#c8d0c5]">Parte de tu propuesta actual y personalízala a tu gusto.</p>
          </button>}
          {!hasAutomaticRoutine && <button type="button" onClick={onGenerateAutomatic} disabled={busy} className="rounded-2xl border border-[#b6c77b] bg-[#e7f5b4] p-6 text-left hover:border-[#72873f] disabled:opacity-60"><Sparkles className="text-[#60703d]" size={24} /><h2 className="mt-8 text-xl font-semibold">Generar rutina automática</h2><p className="mt-2 text-sm leading-6 text-[#3d4a24]">Usa tu objetivo, experiencia, días disponibles y lesiones actuales.</p></button>}
        </div>
        {routines.length > 0 && <section className="mt-8 border-t border-[#d3dbcf] pt-6"><p className="text-sm font-semibold">Mis rutinas</p><p className="mt-1 text-sm text-[#68736b]">Elige una para abrir una copia editable. Tu historial no se modifica.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{routines.map((plan) => <button key={plan.id} type="button" onClick={() => onCreate(plan.active ? "copy" : "history", plan.active ? undefined : plan.id)} disabled={busy} className={`rounded-xl border p-4 text-left hover:border-[#72873f] disabled:opacity-60 ${plan.active ? "border-[#b6c77b] bg-[#e7f5b4]" : "border-[#d3dbcf] bg-[#f8f7f1]"}`}><span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{plan.name}</span>{plan.active && <span className="rounded-full bg-[#72873f] px-2 py-1 text-[10px] font-semibold text-white">Activa</span>}</span><span className="mt-2 block text-xs text-[#68736b]">{plan.source} · Actualizada {new Date(plan.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span><span className="mt-3 block text-xs font-semibold text-[#60703d]">Personalizar</span></button>)}</div></section>}
        {busy && <p className="mt-6 flex items-center gap-2 text-sm text-[#68736b]"><LoaderCircle size={16} className="animate-spin" /> Preparando borrador...</p>}
        {message && <p className="mt-6 text-sm font-semibold text-[#a64e3c]">{message}</p>}
      </div>
    </main>
  );
}
