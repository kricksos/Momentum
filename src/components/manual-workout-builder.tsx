"use client";

import { Check, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ManualWorkoutStart } from "@/components/manual-workout-start";

type CatalogExercise = { id: string; name: string; primaryMuscle: string | null; muscleGroups: string[]; difficulty: string; equipment: string[] };
type DraftExercise = { exerciseId: string; sets: number; repetitions: string; restSeconds: number };
type DraftDay = { id?: string; name: string; exercises: DraftExercise[] };
type Draft = { id: string; name: string; source: "manual" | "copied"; days: DraftDay[] };
type Routine = { id: string; name: string; source: string; updatedAt: string; active: boolean };
type Props = { catalog: CatalogExercise[]; hasActivePlan: boolean; routines: Routine[] };

const muscleFilters = ["Todos", "Pectoral", "Dorsal", "Deltoides", "Bíceps", "Tríceps", "Cuádriceps", "Isquiotibiales", "Glúteos", "Aductores", "Gemelos", "Zona lumbar", "Core"];
const filterToPrimaryMuscle: Record<string, string> = { Pectoral: "pectorals", Dorsal: "lats", Deltoides: "deltoids", Bíceps: "biceps", Tríceps: "triceps", Cuádriceps: "quadriceps", Isquiotibiales: "hamstrings", Glúteos: "glutes", Aductores: "adductors", Gemelos: "calves", "Zona lumbar": "lower_back", Core: "core" };
const primaryMuscleLabels: Record<string, string> = { pectorals: "Pectoral", lats: "Dorsal", deltoids: "Deltoides", biceps: "Bíceps", triceps: "Tríceps", quadriceps: "Cuádriceps", hamstrings: "Isquiotibiales", glutes: "Glúteos", adductors: "Aductores", calves: "Gemelos", lower_back: "Zona lumbar", core: "Core" };
const muscleLabels: Record<string, string> = { pecho: "Pecho", espalda: "Dorsal", hombros: "Deltoides", biceps: "Bíceps", triceps: "Tríceps", piernas: "Piernas", isquios: "Isquios", gluteos: "Glúteos", aductores: "Aductores", gemelos: "Gemelos", core: "Core" };
const muscleOrder = ["pectorals", "lats", "deltoids", "biceps", "triceps", "quadriceps", "hamstrings", "glutes", "adductors", "calves", "lower_back", "core"];
const muscleColors: Record<string, { dot: string; text: string; border: string; background: string }> = {
  pectorals: { dot: "bg-[#e87970]", text: "text-[#b84f49]", border: "border-[#efb1aa]", background: "bg-[#fff1ef]" },
  lats: { dot: "bg-[#5b8def]", text: "text-[#4169b2]", border: "border-[#abc2f4]", background: "bg-[#eef4ff]" },
  deltoids: { dot: "bg-[#a879df]", text: "text-[#7954a9]", border: "border-[#d0b9eb]", background: "bg-[#f6f0fc]" },
  biceps: { dot: "bg-[#e89b4f]", text: "text-[#aa6726]", border: "border-[#efc89d]", background: "bg-[#fff7ed]" },
  triceps: { dot: "bg-[#d66bb1]", text: "text-[#9d4d80]", border: "border-[#e6aed3]", background: "bg-[#fff0f8]" },
  quadriceps: { dot: "bg-[#55a878]", text: "text-[#397c57]", border: "border-[#a9d5bb]", background: "bg-[#effaf3]" },
  hamstrings: { dot: "bg-[#2e9eaa]", text: "text-[#23747c]", border: "border-[#9fd4d8]", background: "bg-[#eefbfc]" },
  glutes: { dot: "bg-[#d87592]", text: "text-[#a14c68]", border: "border-[#e9b3c2]", background: "bg-[#fff1f5]" },
  adductors: { dot: "bg-[#8e9d55]", text: "text-[#687638]", border: "border-[#cbd59e]", background: "bg-[#f7fae9]" },
  calves: { dot: "bg-[#c48b4a]", text: "text-[#8d602d]", border: "border-[#e1c39d]", background: "bg-[#fff8ed]" },
  lower_back: { dot: "bg-[#64748b]", text: "text-[#475569]", border: "border-[#b8c1cd]", background: "bg-[#f1f4f7]" },
  core: { dot: "bg-[#c4a043]", text: "text-[#8d7227]", border: "border-[#e5d39a]", background: "bg-[#fffbea]" },
};
const defaultMuscleColor = { dot: "bg-[#72873f]", text: "text-[#60703d]", border: "border-[#b6c77b]", background: "bg-[#f2facd]" };

function defaultDay(index: number): DraftDay {
  return { name: `Día ${index + 1}`, exercises: [] };
}

function difficultyLabel(value: string) {
  if (value === "beginner") return "Principiante";
  if (value === "intermediate") return "Intermedio";
  return value || "General";
}

function equipmentLabel(equipment: string[]) {
  if (equipment.length === 0) return "Sin material";
  return equipment.map((item) => item.replaceAll("_", " ")).join(" · ");
}

function muscleSummary(exercise: CatalogExercise) {
  return exercise.muscleGroups.map((group) => muscleLabels[group.toLowerCase()] ?? group).join(" · ");
}

function colorForMuscle(muscle: string | null | undefined) {
  return muscleColors[muscle ?? ""] ?? defaultMuscleColor;
}

function groupExercises(exercises: CatalogExercise[]) {
  return muscleOrder
    .map((muscle) => ({ muscle, exercises: exercises.filter((exercise) => exercise.primaryMuscle === muscle) }))
    .filter((group) => group.exercises.length > 0);
}

export function ManualWorkoutBuilder({ catalog, hasActivePlan, routines }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<"create" | "save" | "publish" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastAddedExerciseId, setLastAddedExerciseId] = useState<string | null>(null);

  const activeDay = draft?.days[activeDayIndex];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCatalog = catalog
    .filter((exercise) => (filter === "Todos" || exercise.primaryMuscle === filterToPrimaryMuscle[filter]) && exercise.name.toLowerCase().includes(normalizedSearch))
    .sort((left, right) => {
      const leftOrder = muscleOrder.indexOf(left.primaryMuscle ?? "");
      const rightOrder = muscleOrder.indexOf(right.primaryMuscle ?? "");
      return (leftOrder === -1 ? muscleOrder.length : leftOrder) - (rightOrder === -1 ? muscleOrder.length : rightOrder) || left.name.localeCompare(right.name);
    });
  const catalogGroups = groupExercises(filteredCatalog);

  async function create(source: "manual" | "copy" | "history", planId?: string) {
    setBusy("create");
    setMessage(null);
    const response = await fetch("/api/workouts/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source, planId }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(result.error ?? "No hemos podido crear el borrador."); setBusy(null); return; }
    const draftResponse = await fetch(`/api/workouts/manual/${result.draftId}`);
    const draftResult = await draftResponse.json().catch(() => ({}));
    if (!draftResponse.ok) { setMessage(draftResult.error ?? "No hemos podido abrir el borrador."); setBusy(null); return; }
    setDraft({ ...draftResult.draft, days: draftResult.draft.days.length ? draftResult.draft.days : [defaultDay(0)] });
    setActiveDayIndex(0);
    setBusy(null);
  }

  async function generateAutomatic() {
    router.push("/workout/generate-automatic");
  }

  function updateDay(nextDay: DraftDay) {
    if (!draft) return;
    setDraft({ ...draft, days: draft.days.map((day, index) => index === activeDayIndex ? nextDay : day) });
  }

  function addExercise(exerciseId: string) {
    if (!activeDay || activeDay.exercises.some((exercise) => exercise.exerciseId === exerciseId)) return;
    updateDay({ ...activeDay, exercises: [...activeDay.exercises, { exerciseId, sets: 3, repetitions: "8-12", restSeconds: 90 }] });
    setLastAddedExerciseId(exerciseId);
    window.setTimeout(() => setLastAddedExerciseId(null), 650);
  }

  function updateExercise(exerciseIndex: number, patch: Partial<DraftExercise>) {
    if (!activeDay) return;
    updateDay({ ...activeDay, exercises: activeDay.exercises.map((exercise, index) => index === exerciseIndex ? { ...exercise, ...patch } : exercise) });
  }

  function removeExercise(exerciseIndex: number) {
    if (!activeDay) return;
    updateDay({ ...activeDay, exercises: activeDay.exercises.filter((_, index) => index !== exerciseIndex) });
  }

  function addDay() {
    if (!draft || draft.days.length >= 7) return;
    setDraft({ ...draft, days: [...draft.days, defaultDay(draft.days.length)] });
    setActiveDayIndex(draft.days.length);
  }

  async function save() {
    if (!draft) return false;
    setBusy("save");
    setMessage(null);
    const response = await fetch(`/api/workouts/manual/${draft.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: draft.name, days: draft.days }) });
    const result = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) { setMessage(result.error ?? "No hemos podido guardar la rutina."); return false; }
    setMessage("Borrador guardado.");
    return true;
  }

  async function publish() {
    if (!(await save()) || !draft) return;
    setBusy("publish");
    const response = await fetch(`/api/workouts/manual/${draft.id}/publish`, { method: "POST" });
    const result = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) { setMessage(result.error ?? "No hemos podido activar la rutina."); return; }
    router.push("/dashboard?tab=training");
    router.refresh();
  }

  if (!draft) return <ManualWorkoutStart hasActivePlan={hasActivePlan} routines={routines} busy={busy === "create"} message={message} onCreate={(source, planId) => void create(source, planId)} onGenerateAutomatic={() => void generateAutomatic()} />;

  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Editor de rutina</p>
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-3 w-full max-w-xl bg-transparent text-3xl font-semibold outline-none sm:text-5xl" aria-label="Nombre de la rutina" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void save()} disabled={busy !== null} className="rounded-full border border-[#cfd7c8] px-4 py-2 text-sm font-semibold">Guardar</button>
            <button type="button" onClick={() => void publish()} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-full bg-[#18231f] px-5 py-2 text-sm font-semibold text-white"><Check size={16} /> {busy === "publish" ? "Activando" : "Activar rutina"}</button>
          </div>
        </header>
        {message && <p className={`mt-4 text-sm font-semibold ${message === "Borrador guardado." ? "text-[#60703d]" : "text-[#a64e3c]"}`}>{message}</p>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
          <aside className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">Días</p><button type="button" onClick={addDay} disabled={draft.days.length >= 7} className="grid size-8 place-items-center rounded-full bg-[#18231f] text-white" aria-label="Añadir día"><Plus size={16} /></button></div>
            <div className="mt-4 space-y-2">{draft.days.map((day, index) => <button key={`${day.id ?? "new"}-${index}`} type="button" onClick={() => setActiveDayIndex(index)} className={`w-full rounded-xl p-3 text-left text-sm font-semibold ${index === activeDayIndex ? "bg-[#e7f5b4] text-[#3d4a24]" : "hover:bg-white"}`}><span className="block">{day.name}</span><span className="mt-1 block text-xs font-normal text-[#68736b]">{day.exercises.length} ejercicios</span></button>)}</div>
          </aside>

          <section className="rounded-2xl border border-[#d3dbcf] bg-white/60 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Día seleccionado</p><input value={activeDay?.name ?? ""} onChange={(event) => activeDay && updateDay({ ...activeDay, name: event.target.value })} className="mt-2 w-full bg-transparent text-2xl font-semibold outline-none" aria-label="Nombre del día" /></div><span className="text-sm text-[#68736b]">{activeDay?.exercises.length ?? 0} ejercicios</span></div>
            <div className="mt-6 space-y-3">{activeDay?.exercises.map((exercise, index) => { const detail = catalog.find((catalogExercise) => catalogExercise.id === exercise.exerciseId); return <div key={`${exercise.exerciseId}-${index}`} className="grid gap-3 rounded-xl border border-[#dfe4d8] bg-[#f8f7f1] p-4 sm:grid-cols-[minmax(0,1fr)_76px_100px_90px_auto]"><div><p className="font-semibold">{detail?.name ?? "Ejercicio"}</p><p className="mt-1 text-xs text-[#819078]">{detail ? muscleSummary(detail) : ""}</p></div><label className="text-xs text-[#819078]">Series<input type="number" min="1" max="20" value={exercise.sets} onChange={(event) => updateExercise(index, { sets: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-[#cfd7c8] bg-white px-2 py-2 text-sm text-[#18231f]" /></label><label className="text-xs text-[#819078]">Repeticiones<input value={exercise.repetitions} onChange={(event) => updateExercise(index, { repetitions: event.target.value })} className="mt-1 w-full rounded-lg border border-[#cfd7c8] bg-white px-2 py-2 text-sm text-[#18231f]" /></label><label className="text-xs text-[#819078]">Descanso<input type="number" min="0" max="900" value={exercise.restSeconds} onChange={(event) => updateExercise(index, { restSeconds: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-[#cfd7c8] bg-white px-2 py-2 text-sm text-[#18231f]" /></label><button type="button" onClick={() => removeExercise(index)} className="self-end rounded-lg p-2 text-[#a64e3c]" aria-label={`Eliminar ${detail?.name ?? "ejercicio"}`}><Trash2 size={18} /></button></div>; })}{activeDay?.exercises.length === 0 && <p className="rounded-xl border border-dashed border-[#cfd7c8] p-5 text-sm text-[#68736b]">Añade ejercicios desde el catálogo para construir este día.</p>}</div>
          </section>

          <aside className="rounded-2xl border border-[#d3dbcf] bg-[#f8f7f1] p-4">
            <p className="text-sm font-semibold">Catálogo</p>
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-[#cfd7c8] bg-white px-3 py-2 text-sm text-[#68736b]"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ejercicio" className="w-full bg-transparent outline-none" /></label>
            <div className="mt-3 flex flex-wrap gap-1">{muscleFilters.map((item) => { const color = colorForMuscle(filterToPrimaryMuscle[item]); return <button key={item} type="button" onClick={() => setFilter(item)} className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold transition ${filter === item ? `${color.background} ${color.border} ${color.text}` : "border-transparent bg-white text-[#68736b] hover:border-[#d3dbcf]"}`}>{item}</button>; })}</div>
            <div className="mt-4 max-h-[560px] space-y-4 overflow-y-auto pr-1">
              {catalogGroups.map((group) => { const color = colorForMuscle(group.muscle); return <section key={group.muscle}><p className={`mb-2 flex items-center border-b pb-2 text-xs font-semibold uppercase tracking-[0.14em] ${color.border} ${color.text}`}>{primaryMuscleLabels[group.muscle] ?? group.muscle}<span className="ml-auto text-[10px] font-medium opacity-70">{group.exercises.length}</span></p><div className="space-y-2">{group.exercises.map((exercise) => { const added = Boolean(activeDay?.exercises.some((item) => item.exerciseId === exercise.id)); const justAdded = lastAddedExerciseId === exercise.id; return <button key={exercise.id} type="button" onClick={() => addExercise(exercise.id)} disabled={added} className={`w-full rounded-xl border p-3 text-left transition ${added ? "border-[#b6c77b] bg-[#e7f5b4] text-[#3d4a24]" : justAdded ? "border-[#72873f] bg-[#f2facd]" : "border-[#dfe4d8] bg-white hover:border-[#72873f]"}`}><span className="flex items-start justify-between gap-3"><span><span className="block text-sm font-semibold">{exercise.name}</span><span className="mt-1 block text-xs text-[#819078]">{muscleSummary(exercise)}</span></span><span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${added ? "bg-[#72873f] text-white" : "bg-[#eef0e8] text-[#60703d]"}`}>{added ? <><Check size={11} /> Añadido</> : <><Plus size={11} /> Añadir</>}</span></span><span className="mt-3 flex flex-wrap gap-1"><span className="rounded-full bg-[#eef0e8] px-2 py-1 text-[10px] font-semibold text-[#68736b]">{difficultyLabel(exercise.difficulty)}</span><span className="rounded-full bg-[#eef0e8] px-2 py-1 text-[10px] font-semibold text-[#68736b]">{equipmentLabel(exercise.equipment)}</span></span></button>; })}</div></section>; })}
              {catalogGroups.length === 0 && <p className="rounded-xl border border-dashed border-[#cfd7c8] p-4 text-sm text-[#68736b]">No hay ejercicios con estos filtros.</p>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
