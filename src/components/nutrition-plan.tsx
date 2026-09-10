"use client";

import { ChefHat, Check, ChevronDown, LoaderCircle, MapPin, RefreshCw, ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type NutritionItem = { id: string; name: string; quantityGrams: number; role: string; alternativeGroup: string | null; selectedFoodName?: string; selectedQuantityGrams?: number };
type NutritionMeal = { id: string; name: string; suggestedTime: string | null; targetCalories: number; items: NutritionItem[] };
type NutritionPlanProps = { meals: NutritionMeal[]; alternatives: Record<string, string[]>; foodIds: Record<string, string>; mealCount: number; todayCompletedMealIds: string[]; completedDates: string[]; mealsOutSlots?: string[] };

const mealOutOptions = [
  { id: "breakfast", label: "Desayuno" },
  { id: "mid_morning", label: "Media mañana" },
  { id: "lunch", label: "Comida" },
  { id: "afternoon_snack", label: "Merienda" },
  { id: "dinner", label: "Cena" },
] as const;

const ratios: Record<string, number> = {
  "Arroz cocido": 1,
  "Pasta cocida": 0.98,
  "Patata cocida": 1.45,
  "Pechuga de pollo": 1,
  Pavo: 1.12,
  "Tofu firme": 1.35,
  Huevos: 0.85,
  Brocoli: 1,
  Espinaca: 1.2,
  "Aceite de oliva": 1,
  Aguacate: 5,
};

const foodTypeStyles: Record<string, { label: string; className: string }> = {
  protein: { label: "Proteína", className: "border-[#efc89d] bg-[#fff7ed] text-[#aa6726]" },
  dairy: { label: "Lácteo", className: "border-[#b8c9ef] bg-[#f0f5ff] text-[#4c68a6]" },
  carbohydrate: { label: "Hidrato", className: "border-[#d7c28d] bg-[#fff9e8] text-[#8d7227]" },
  fat: { label: "Grasa", className: "border-[#e7b1c4] bg-[#fff1f5] text-[#a14c68]" },
  vegetable: { label: "Verdura", className: "border-[#a9d5bb] bg-[#effaf3] text-[#397c57]" },
  fruit: { label: "Fruta", className: "border-[#efb1aa] bg-[#fff1ef] text-[#b84f49]" },
};

function foodTypeStyle(role: string) {
  return foodTypeStyles[role] ?? { label: role, className: "border-[#d3dbcf] bg-[#f8f7f1] text-[#68736b]" };
}

function equivalentQuantity(item: NutritionItem, selectedFood?: string) {
  if (!selectedFood || !item.alternativeGroup) return item.quantityGrams;
  const baseRatio = ratios[item.name] ?? 1;
  return Math.max(1, Math.round(item.quantityGrams * (ratios[selectedFood] ?? 1) / baseRatio));
}

function currentWeekDates() {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function mondayKey(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  const dayOfWeek = date.getDay();
  date.setDate(date.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
  return date.toISOString().slice(0, 10);
}

function dayStreaks(dates: string[]) {
  const uniqueSorted = [...new Set(dates)].sort();
  if (uniqueSorted.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let index = 1; index < uniqueSorted.length; index++) {
    const previousDate = new Date(`${uniqueSorted[index - 1]}T00:00:00Z`);
    const currentDate = new Date(`${uniqueSorted[index]}T00:00:00Z`);
    const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000);
    run = diffDays === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastDate = uniqueSorted[uniqueSorted.length - 1];
  let current = 0;
  if (lastDate === today || lastDate === yesterday) {
    current = 1;
    for (let index = uniqueSorted.length - 1; index > 0; index--) {
      const previousDate = new Date(`${uniqueSorted[index - 1]}T00:00:00Z`);
      const currentDate = new Date(`${uniqueSorted[index]}T00:00:00Z`);
      if (Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000) === 1) current += 1;
      else break;
    }
  }

  return { current, best };
}

function preparationForMeal(meal: NutritionMeal) {
  if (meal.name.includes("fuera de casa")) return "Al comer fuera, busca una fuente de proteína, una ración de hidrato y fruta o verdura. Mantén estas cantidades como referencia y prioriza las opciones compatibles.";
  const protein = meal.items.find((item) => item.role === "protein" || item.role === "dairy")?.name;
  const carbohydrate = meal.items.find((item) => item.role === "carbohydrate")?.name;
  const vegetable = meal.items.find((item) => item.role === "vegetable")?.name;
  return [protein && `Prepara ${protein}`, carbohydrate && `acompaña con ${carbohydrate}`, vegetable && `y añade ${vegetable}`].filter(Boolean).join(". ") + ".";
}

function weeklyShoppingList(meals: NutritionMeal[]) {
  const totals = new Map<string, { grams: number; role: string }>();
  for (const item of meals.flatMap((meal) => meal.items)) {
    const existing = totals.get(item.name);
    totals.set(item.name, { grams: (existing?.grams ?? 0) + item.quantityGrams * 7, role: item.role });
  }
  return [...totals.entries()].map(([name, details]) => ({ name, ...details })).sort((left, right) => left.role.localeCompare(right.role) || left.name.localeCompare(right.name));
}

function slotForMeal(meal: NutritionMeal) {
  const hour = Number(meal.suggestedTime?.slice(0, 2));
  if (hour < 10) return "breakfast";
  if (hour < 13) return "mid_morning";
  if (hour < 16) return "lunch";
  if (hour < 19) return "afternoon_snack";
  return "dinner";
}

function outsideName(meal: NutritionMeal, isOutside: boolean) {
  if (!isOutside || meal.name.includes("fuera de casa")) return meal.name;
  return `${meal.name} fuera de casa`;
}

export function NutritionPlan({ meals, alternatives, foodIds, mealCount, todayCompletedMealIds, completedDates, mealsOutSlots = [] }: NutritionPlanProps) {
  const router = useRouter();
  const [openMeal, setOpenMeal] = useState<string | null>(meals[0]?.id ?? null);
  const [completedMeals, setCompletedMeals] = useState<string[]>(todayCompletedMealIds);
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, string>>(() => Object.fromEntries(meals.flatMap((meal) => meal.items.filter((item) => item.alternativeGroup && item.selectedFoodName).map((item) => [`${meal.id}:${item.alternativeGroup}`, item.selectedFoodName as string]))));
  const [openAlternative, setOpenAlternative] = useState<string | null>(null);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [mealsOutOpen, setMealsOutOpen] = useState(false);
  const [selectedMealsOutSlots, setSelectedMealsOutSlots] = useState<string[]>(mealsOutSlots);
  const [savingMealsOut, setSavingMealsOut] = useState(false);
  const [isChangingMealCount, setIsChangingMealCount] = useState(false);
  const [weekDates] = useState<string[]>(currentWeekDates);
  const [completedDayDates, setCompletedDayDates] = useState<string[]>(completedDates);
  const [completionError, setCompletionError] = useState<string | null>(null);

  async function changeMealCount(nextMealCount: number) {
    setIsChangingMealCount(true);
    const response = await fetch("/api/plans/nutrition/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealCount: nextMealCount }),
    });
    if (response.ok) router.refresh();
    setIsChangingMealCount(false);
  }

  async function toggleMealOutSlot(slot: string) {
    const nextSlots = selectedMealsOutSlots.includes(slot)
      ? selectedMealsOutSlots.filter((currentSlot) => currentSlot !== slot)
      : [...selectedMealsOutSlots, slot];
    setSelectedMealsOutSlots(nextSlots);
    setSavingMealsOut(true);
    const response = await fetch("/api/profile/meals-out", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: nextSlots }),
    });
    setSavingMealsOut(false);
    if (response.ok) router.refresh();
    else setSelectedMealsOutSlots(mealsOutSlots);
  }

  async function selectAlternative(mealId: string, group: string, food: string, mealItems: NutritionItem[]) {
    setSelectedAlternatives((current) => ({ ...current, [`${mealId}:${group}`]: food }));
    const item = mealItems.find((mealItem) => mealItem.alternativeGroup === group);
    const selectedFoodId = foodIds[food];
    if (!item || !selectedFoodId) return;
    await fetch("/api/plans/nutrition/substitution", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mealItemId: item.id, selectedFoodId, quantityGrams: equivalentQuantity(item, food) }) });
  }

  const today = new Date().toISOString().slice(0, 10);
  async function setDayCompletion(completed: boolean) {
    const previousMeals = completedMeals;
    const nextMeals = completed ? meals.map((meal) => meal.id) : [];
    if (previousMeals.length === nextMeals.length) return;

    setCompletedMeals(nextMeals);
    const responses = await Promise.all(meals.map((meal) => fetch("/api/plans/nutrition/completion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mealId: meal.id, completed, date: today }) })));
    if (responses.some((response) => !response.ok)) {
      setCompletedMeals(previousMeals);
      setCompletionError("No hemos podido guardar el día. Revisa la conexión e inténtalo de nuevo.");
      return;
    }

    setCompletionError(null);
    if (completed && !completedDayDates.includes(today)) setCompletedDayDates((current) => [...current, today]);
    if (!completed && completedDayDates.includes(today)) setCompletedDayDates((current) => current.filter((date) => date !== today));
  }

  if (meals.length === 0) return <p className="mt-4 text-sm text-[#68736b]">El detalle de comidas estará disponible al regenerar tu plan.</p>;

  const weekDayCounts = new Map<string, number>();
  for (const date of completedDayDates) {
    const key = mondayKey(date);
    weekDayCounts.set(key, (weekDayCounts.get(key) ?? 0) + 1);
  }
  const dayCompleted = completedMeals.length === meals.length;
  const nutritionStreak = dayStreaks(completedDayDates);
  const streakWeeks = Math.floor(nutritionStreak.current / 7);
  const streakMonths = Math.floor(nutritionStreak.current / 30);
  const streakYears = Math.floor(nutritionStreak.current / 365);
  const milestoneMessage = streakYears > 0 ? `${streakYears} ${streakYears === 1 ? "año" : "años"} de racha nutricional.` : streakMonths > 0 ? `${streakMonths} ${streakMonths === 1 ? "mes" : "meses"} de racha nutricional.` : streakWeeks > 0 ? `${streakWeeks} ${streakWeeks === 1 ? "semana" : "semanas"} de racha nutricional.` : null;
  const shoppingList = weeklyShoppingList(meals);

  return (
    <section className="mt-10 rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#819078]">Tu día de alimentación</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Claro, flexible y preciso.</h2></div>
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Comidas al día</p><div className="flex flex-wrap gap-2">{[3, 4, 5, 6].map((option) => <button key={option} type="button" disabled={isChangingMealCount || option === mealCount} onClick={() => changeMealCount(option)} className={`inline-flex min-w-12 items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold ${option === mealCount ? "border-[#72873f] bg-[#e7f5b4] text-[#60703d]" : "border-[#cfd7c8] text-[#68736b] hover:border-[#72873f]"}`}>{isChangingMealCount && option !== mealCount ? <LoaderCircle size={15} className="animate-spin" /> : option}</button>)}</div></div>
      </div>
      <p className="mt-3 text-sm text-[#68736b]">Pesos en gramos, indicados como cocinados o servidos. El modo preciso es el estándar de Momentum.</p>
      <div className="mt-5 rounded-2xl border border-[#d3dbcf] bg-white/50 p-4">
        <button type="button" onClick={() => setMealsOutOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={mealsOutOpen}>
          <span className="flex items-center gap-3"><MapPin className="text-[#72873f]" size={18} /><span><span className="block text-sm font-semibold">Comidas fuera de casa</span><span className="block text-xs text-[#819078]">¿Trabajas, estudias o te desplazas? Marca las comidas que te cuesta hacer en casa y recibirás una guía más fácil para resolverlas fuera.</span></span></span>
          <ChevronDown size={18} className={`text-[#60703d] transition-transform ${mealsOutOpen ? "rotate-180" : ""}`} />
        </button>
        {mealsOutOpen && <div className="mt-4 flex flex-wrap gap-2">{mealOutOptions.map((option) => <button key={option.id} type="button" disabled={savingMealsOut} onClick={() => toggleMealOutSlot(option.id)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${selectedMealsOutSlots.includes(option.id) ? "border-[#72873f] bg-[#e7f5b4] text-[#60703d]" : "border-[#cfd7c8] text-[#68736b]"}`}>{option.label}</button>)}{savingMealsOut && <LoaderCircle size={16} className="my-2 animate-spin text-[#60703d]" />}</div>}
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-[#68736b]"><span>{dayCompleted ? "Día completado" : "Día pendiente"}</span><span>Modo preciso</span></div>
      {completionError && <p className="mt-3 text-sm font-medium text-[#a64e3c]">{completionError}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e7f5b4] p-4 text-sm font-semibold text-[#60703d]"><span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#72873f] text-white"><Check size={16} /></span>{dayCompleted ? "Día completado. Has cumplido tu planificación de hoy." : "¿Has seguido el plan de hoy? Márcalo de una vez."}</span><button type="button" onClick={() => setDayCompletion(!dayCompleted)} className="rounded-full bg-[#18231f] px-4 py-2 text-xs font-semibold text-[#f6f4ed]">{dayCompleted ? "Desmarcar día" : "Completar día"}</button></div>
      {milestoneMessage && <div className="mt-4 rounded-2xl border border-[#b6c77b] bg-white/60 p-4 text-sm font-semibold text-[#60703d]">{milestoneMessage}</div>}
      <section className="mt-6 border-y border-[#d3dbcf] py-4">
        <button type="button" onClick={() => setShoppingOpen((current) => !current)} className="flex w-full items-center justify-between text-left" aria-expanded={shoppingOpen}>
          <span className="flex items-center gap-3"><ShoppingBasket className="text-[#72873f]" size={20} /><span><span className="block text-sm font-semibold">Compra para 7 días</span><span className="block text-xs text-[#819078]">Lista secundaria con cantidades orientativas.</span></span></span>
          <ChevronDown size={18} className={`text-[#60703d] transition-transform ${shoppingOpen ? "rotate-180" : ""}`} />
        </button>
        {shoppingOpen && <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">{shoppingList.map((item) => <div key={item.name} className="flex items-center justify-between border-b border-[#e3e7dd] py-2 text-sm"><span>{item.name}</span><span className="font-semibold text-[#60703d]">{Math.round(item.grams)} g</span></div>)}</div>}
      </section>
      {weekDates.length > 0 && <div className="mt-6 rounded-2xl border border-[#d3dbcf] bg-white/50 p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Constancia por días</p><p className="mt-1 text-sm text-[#68736b]">Racha actual: {nutritionStreak.current} {nutritionStreak.current === 1 ? "día" : "días"} · mejor: {nutritionStreak.best}</p></div><span className="text-sm font-semibold text-[#60703d]">{weekDates.filter((date) => completedDayDates.includes(date)).length} de 7</span></div><div className="mt-4 grid grid-cols-7 gap-2">{weekDates.map((date) => { const completed = completedDayDates.includes(date); const dayLabel = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(new Date(`${date}T12:00:00`)).slice(0, 2); return <div key={date} className="text-center"><span className={`mx-auto grid size-8 place-items-center rounded-full text-xs font-semibold ${completed ? "bg-[#72873f] text-white" : "bg-[#dfe4d8] text-[#819078]"}`}>{completed ? "✓" : "·"}</span><span className="mt-2 block text-[10px] capitalize text-[#819078]">{dayLabel}</span></div>; })}</div><div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs"><div className="rounded-xl bg-[#f4f1e9] p-3"><p className="font-semibold text-[#18231f]">{nutritionStreak.current}</p><p className="mt-1 text-[#819078]">días</p></div><div className="rounded-xl bg-[#f4f1e9] p-3"><p className="font-semibold text-[#18231f]">{streakWeeks}</p><p className="mt-1 text-[#819078]">semanas</p></div><div className="rounded-xl bg-[#f4f1e9] p-3"><p className="font-semibold text-[#18231f]">{streakMonths}</p><p className="mt-1 text-[#819078]">meses</p></div><div className="rounded-xl bg-[#f4f1e9] p-3"><p className="font-semibold text-[#18231f]">{streakYears}</p><p className="mt-1 text-[#819078]">años</p></div></div>{weekDates.every((date) => completedDayDates.includes(date)) && <div className="mt-4 rounded-xl bg-[#e7f5b4] p-3 text-center text-sm font-semibold text-[#60703d]">Semana completada. Siete días siguiendo tu rumbo.</div>}</div>}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe4d8]"><div className="h-full rounded-full bg-[#72873f] transition-all" style={{ width: dayCompleted ? "100%" : "0%" }} /></div>
      <div className="mt-6 space-y-3">{meals.map((meal) => {
        const isOpen = openMeal === meal.id;
        const isOutside = selectedMealsOutSlots.includes(slotForMeal(meal));
        const displayedMealName = outsideName(meal, isOutside);
        return <div key={meal.id} className={`overflow-hidden rounded-2xl border ${dayCompleted ? "border-[#b6c77b] bg-[#eef5d2]" : "border-[#d3dbcf] bg-white/50"}`}>
          <button type="button" onClick={() => setOpenMeal(isOpen ? null : meal.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left"><span><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">{meal.suggestedTime ? meal.suggestedTime.slice(0, 5) : "Flexible"}</span><span className="mt-1 flex items-center gap-2 text-lg font-semibold">{isOutside && <MapPin size={16} className="text-[#72873f]" />}{displayedMealName}</span></span><span className="flex items-center gap-3 text-sm text-[#68736b]"><span>{meal.targetCalories} kcal</span><ChevronDown size={18} className={isOpen ? "rotate-180" : ""} /></span></button>
            {isOpen && <div className="border-t border-[#d3dbcf] px-4 pb-5 pt-3"><div className="space-y-2">{meal.items.map((item) => { const selectedFood = item.alternativeGroup ? selectedAlternatives[`${meal.id}:${item.alternativeGroup}`] : undefined; const displayedName = selectedFood ?? item.name; const displayedQuantity = selectedFood === item.selectedFoodName ? item.selectedQuantityGrams ?? item.quantityGrams : equivalentQuantity(item, selectedFood); const style = foodTypeStyle(item.role); const alternativeKey = `${meal.id}:${item.id}`; const alternativesForItem = item.alternativeGroup ? alternatives[item.alternativeGroup] ?? [] : []; const alternativesOpen = openAlternative === alternativeKey; return <div key={item.id} className={`rounded-xl border px-4 py-3 ${style.className}`}><div className="flex items-center justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-[#18231f]">{displayedName}</p><span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold">{style.label}</span></div><p className="mt-1 text-xs opacity-75">{displayedQuantity} g · cocinado</p></div>{item.alternativeGroup && alternativesForItem.length > 0 ? <button type="button" onClick={() => setOpenAlternative(alternativesOpen ? null : alternativeKey)} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/70 bg-white/60 px-2.5 py-1.5 text-[10px] font-semibold text-[#60703d]"><RefreshCw size={12} /> Cambiar</button> : null}</div>{alternativesOpen ? <div className="mt-3 border-t border-white/60 pt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60703d]">Alternativas equivalentes</p><div className="mt-2 flex flex-wrap gap-2">{alternativesForItem.map((food) => <button key={food} type="button" onClick={() => { void selectAlternative(meal.id, item.alternativeGroup as string, food, meal.items); setOpenAlternative(null); }} className={`rounded-full border px-3 py-2 text-xs font-medium ${selectedAlternatives[`${meal.id}:${item.alternativeGroup}`] === food ? "border-[#72873f] bg-[#e7f5b4] text-[#60703d]" : "border-white/70 bg-white/60 text-[#68736b] hover:border-[#72873f]"}`}>{food}</button>)}</div><p className="mt-2 text-xs text-[#819078]">La cantidad se recalcula para mantener la equivalencia.</p></div> : null}</div>; })}</div><div className="mt-4 flex gap-2 border-l-2 border-[#b6c77b] pl-3 text-sm text-[#68736b]"><ChefHat className="shrink-0 text-[#72873f]" size={17} /><p>{preparationForMeal({ ...meal, name: displayedMealName })}</p></div></div>}
  </div>;
      })}</div>
    </section>
  );
}
