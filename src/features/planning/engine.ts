import { foodAllowedForPlan } from "@/lib/food-restrictions";
import type { PlanningCatalogExercise } from "@/lib/exercise-catalog";

export type PlanningProfile = {
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  goal: string;
  experience: string;
  daysPerWeek: number;
  sessionMinutes: number;
  mealCount: number;
  dietPreference?: string;
  calorieAdjustment?: number;
  restrictions?: string[];
  foodRestrictions?: string[];
  priorities?: string[];
  dislikedFoods?: string[];
  preferredMealStyles?: string[];
  mealsOutSlots?: string[];
};

export type GeneratedPlan = {
  structure: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  mealCount: number;
  meals: Array<{
    name: string;
    suggestedTime: string;
    targetCalories: number;
    items: Array<{ name: string; quantityGrams: number; role: string; alternativeGroup?: string; weightBasis: "cooked" | "as_served" }>;
  }>;
  days: Array<{
    name: string;
    exercises: Array<{ name: string; sets: number; repetitions: string; restSeconds: number }>;
  }>;
};

function numberFromText(value: string, fallback: number) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function activityFactor(experience: string, daysPerWeek: number) {
  if (daysPerWeek >= 5) return 1.55;
  if (daysPerWeek >= 3) return 1.45;
  return experience.includes("Nunca") ? 1.3 : 1.375;
}

function goalAdjustment(goal: string) {
  if (goal.includes("Perder")) return -400;
  if (goal.includes("Ganar")) return 300;
  if (goal.includes("Recomposición")) return -100;
  return 0;
}

function structureFor(daysPerWeek: number, experience: string) {
  if (daysPerWeek <= 3 || experience.includes("Nunca") || experience.includes("Menos")) return "Full Body";
  if (daysPerWeek === 4) return "Upper / Lower";
  return "Push / Pull / Legs";
}

function applyFoodRestrictions<
  T extends { name: string; items: Array<{ name: string; role: string }> },
>(meal: T, foodRestrictions: string[], dietPreference: string) {
  const safeItems = meal.items.filter((item) => foodAllowedForPlan(item.name, foodRestrictions, dietPreference));

  if (safeItems.length > 0) {
    return { ...meal, items: safeItems };
  }

  return {
    ...meal,
    items: meal.items.filter((item) => item.role !== "dairy" && !(item.role === "vegetable" && item.name.toLowerCase().includes("brocoli")) && !(item.role === "vegetable" && item.name.toLowerCase().includes("espinaca"))),
  };
}

function firstAllowedFood(candidates: string[], foodRestrictions: string[], dietPreference: string) {
  return candidates.find((food) => foodAllowedForPlan(food, foodRestrictions, dietPreference)) ?? "Lentejas cocidas";
}

function variedAllowedFood(candidates: string[], foodRestrictions: string[], dietPreference: string, seed: number) {
  const allowed = candidates.filter((food) => foodAllowedForPlan(food, foodRestrictions, dietPreference));
  return allowed[seed % allowed.length] ?? firstAllowedFood(["Lentejas cocidas", "Garbanzos cocidos"], foodRestrictions, dietPreference);
}

function avoidedByPreference(food: string, dislikedFoods: string[]) {
  const value = food.toLowerCase();
  const groups: Record<string, string[]> = {
    Pescado: ["salmón", "salmon", "atún"],
    "Carne roja": ["ternera"],
    "Pollo y pavo": ["pollo", "pavo"],
    Huevos: ["huevo"],
    Lácteos: ["yogur", "skyr", "queso"],
    Legumbres: ["lentejas", "garbanzos"],
    "Tofu y soja": ["tofu", "tempeh", "soja"],
    "Verduras verdes": ["brocoli", "espinaca", "calabacín", "judías", "espárragos"],
    Fruta: ["platano", "manzana", "naranja", "kiwi", "frutos rojos", "piña"],
  };
  return dislikedFoods.some((group) => (groups[group] ?? []).some((term) => value.includes(term)));
}

function preferredFood(candidates: string[], foodRestrictions: string[], dietPreference: string, dislikedFoods: string[], seed: number) {
  const allowed = candidates.filter((food) => foodAllowedForPlan(food, foodRestrictions, dietPreference) && !avoidedByPreference(food, dislikedFoods));
  return allowed[seed % allowed.length] ?? variedAllowedFood(candidates, foodRestrictions, dietPreference, seed);
}

// Mirrors the restrictions/alternatives/muscle groups seeded in the exercise catalog (migration 0003) so the engine can stay a pure function.
const exerciseCatalogInfo: Record<string, { restrictions: string[]; alternatives: string[]; muscleGroups: string[] }> = {
  "Sentadilla goblet": { restrictions: [], alternatives: ["Prensa de piernas"], muscleGroups: ["piernas", "gluteos"] },
  "Press banca con mancuernas": { restrictions: ["shoulder_injury"], alternatives: ["Press banca"], muscleGroups: ["pecho", "triceps"] },
  "Jalon al pecho": { restrictions: [], alternatives: ["Remo con mancuerna"], muscleGroups: ["espalda", "biceps"] },
  "Peso muerto rumano": { restrictions: ["back_injury"], alternatives: ["Curl femoral"], muscleGroups: ["isquios", "gluteos"] },
  Plancha: { restrictions: [], alternatives: ["Pallof press"], muscleGroups: ["core"] },
  "Elevaciones laterales": { restrictions: ["shoulder_injury"], alternatives: [], muscleGroups: ["hombros"] },
  "Prensa de piernas": { restrictions: ["knee_injury"], alternatives: ["Sentadilla goblet"], muscleGroups: ["piernas", "gluteos"] },
  "Press inclinado": { restrictions: ["shoulder_injury"], alternatives: ["Press banca con mancuernas"], muscleGroups: ["pecho", "triceps"] },
  "Remo con mancuerna": { restrictions: ["back_injury"], alternatives: ["Jalon al pecho"], muscleGroups: ["espalda", "biceps"] },
  "Curl femoral": { restrictions: [], alternatives: ["Peso muerto rumano"], muscleGroups: ["isquios"] },
  "Press militar con mancuernas": { restrictions: ["shoulder_injury"], alternatives: ["Elevaciones laterales"], muscleGroups: ["hombros", "triceps"] },
  "Pallof press": { restrictions: [], alternatives: ["Plancha"], muscleGroups: ["core"] },
  Sentadilla: { restrictions: ["knee_injury"], alternatives: ["Sentadilla goblet"], muscleGroups: ["piernas", "gluteos"] },
  "Press banca": { restrictions: ["shoulder_injury"], alternatives: ["Press banca con mancuernas"], muscleGroups: ["pecho", "triceps"] },
  "Remo con barra": { restrictions: ["back_injury"], alternatives: ["Remo con mancuerna"], muscleGroups: ["espalda", "biceps"] },
  "Hip thrust": { restrictions: [], alternatives: ["Peso muerto rumano"], muscleGroups: ["gluteos"] },
  "Curl de biceps": { restrictions: ["elbow_injury"], alternatives: ["Curl femoral"], muscleGroups: ["biceps"] },
  Flexiones: { restrictions: [], alternatives: ["Press banca"], muscleGroups: ["pecho", "triceps"] },
  "Aperturas en polea": { restrictions: ["shoulder_injury"], alternatives: ["Press banca"], muscleGroups: ["pecho"] },
  "Fondos para pecho": { restrictions: ["shoulder_injury"], alternatives: ["Press banca"], muscleGroups: ["pecho", "triceps"] },
  Dominadas: { restrictions: [], alternatives: ["Jalon al pecho"], muscleGroups: ["espalda", "biceps"] },
  "Remo sentado en polea": { restrictions: ["back_injury"], alternatives: ["Jalon al pecho"], muscleGroups: ["espalda", "biceps"] },
  "Jalón de brazos rectos": { restrictions: [], alternatives: ["Jalon al pecho"], muscleGroups: ["espalda"] },
  "Face pull": { restrictions: ["shoulder_injury"], alternatives: ["Pallof press"], muscleGroups: ["hombros"] },
  "Pájaros con mancuernas": { restrictions: ["shoulder_injury"], alternatives: ["Face pull"], muscleGroups: ["hombros"] },
  "Elevaciones frontales": { restrictions: ["shoulder_injury"], alternatives: ["Elevaciones laterales"], muscleGroups: ["hombros"] },
  "Curl con barra": { restrictions: ["elbow_injury"], alternatives: ["Curl femoral"], muscleGroups: ["biceps"] },
  "Curl martillo": { restrictions: ["elbow_injury"], alternatives: ["Curl de biceps"], muscleGroups: ["biceps"] },
  "Curl predicador": { restrictions: ["elbow_injury"], alternatives: ["Curl de biceps"], muscleGroups: ["biceps"] },
  "Fondos para tríceps": { restrictions: ["shoulder_injury", "elbow_injury"], alternatives: ["Pallof press"], muscleGroups: ["triceps"] },
  "Extensión de tríceps por encima de la cabeza": { restrictions: ["elbow_injury"], alternatives: ["Pallof press"], muscleGroups: ["triceps"] },
  "Extensión de tríceps en polea": { restrictions: ["elbow_injury"], alternatives: ["Pallof press"], muscleGroups: ["triceps"] },
  "Zancadas con barra": { restrictions: ["knee_injury"], alternatives: ["Hip thrust"], muscleGroups: ["piernas", "gluteos"] },
  "Extensión de cuádriceps": { restrictions: ["knee_injury"], alternatives: ["Curl femoral"], muscleGroups: ["piernas"] },
  "Sentadilla dividida con mancuernas": { restrictions: ["knee_injury"], alternatives: ["Hip thrust"], muscleGroups: ["piernas", "gluteos"] },
  "Buenos días": { restrictions: ["back_injury"], alternatives: ["Curl femoral"], muscleGroups: ["isquios", "gluteos"] },
  "Puente de glúteos con barra": { restrictions: [], alternatives: ["Hip thrust"], muscleGroups: ["gluteos"] },
  "Aducción de cadera en polea": { restrictions: ["hip_injury"], alternatives: ["Hip thrust"], muscleGroups: ["aductores"] },
  "Crunch abdominal": { restrictions: [], alternatives: ["Plancha"], muscleGroups: ["core"] },
  "Elevación de piernas colgado": { restrictions: ["back_injury"], alternatives: ["Plancha"], muscleGroups: ["core"] },
  "Giros rusos en polea": { restrictions: ["back_injury"], alternatives: ["Pallof press"], muscleGroups: ["core"] },
  "Crunch en polea": { restrictions: ["back_injury"], alternatives: ["Plancha"], muscleGroups: ["core"] },
  Hiperextensiones: { restrictions: ["back_injury"], alternatives: ["Plancha"], muscleGroups: ["espalda", "gluteos"] },
  "Elevación de gemelos de pie": { restrictions: [], alternatives: [], muscleGroups: ["gemelos"] },
  "Elevación de gemelos sentado": { restrictions: [], alternatives: [], muscleGroups: ["gemelos"] },
};

/** Walks the alternatives chain (max 3 hops); if every linked alternative still conflicts, falls back to any unused catalog exercise with no restrictions at all rather than keeping an unsafe pick. */
function safeExerciseName(name: string, restrictions: string[], excluded: Set<string>, catalogInfo = exerciseCatalogInfo): string {
  const conflicts = (exerciseName: string) => (catalogInfo[exerciseName]?.restrictions ?? []).some((restriction) => restrictions.includes(restriction));

  let candidate = name;
  for (let hop = 0; hop < 3; hop++) {
    if (!conflicts(candidate) && !excluded.has(candidate)) return candidate;
    const nextCandidate = catalogInfo[candidate]?.alternatives.find((alternative) => !excluded.has(alternative));
    if (!nextCandidate) break;
    candidate = nextCandidate;
  }

  const safeFallback = Object.keys(catalogInfo).find((exerciseName) => !conflicts(exerciseName) && !excluded.has(exerciseName));
  return safeFallback ?? name; // catalog has no safe option left for this restriction: keep the original as a documented MVP limitation
}

function primaryForMuscleGroup(group: string) {
  return ({ pecho: "pectorals", espalda: "lats", hombros: "deltoids", biceps: "biceps", triceps: "triceps", piernas: "quadriceps", isquios: "hamstrings", gluteos: "glutes", aductores: "adductors", gemelos: "calves", core: "core" } as Record<string, string>)[group];
}

type ExerciseCatalogInfo = Record<string, { restrictions: string[]; alternatives: string[]; muscleGroups: string[] }>;

function catalogInfoFromRows(catalog: PlanningCatalogExercise[]): ExerciseCatalogInfo {
  return Object.fromEntries(catalog.map((exercise) => [exercise.name, { restrictions: exercise.restrictions, alternatives: [], muscleGroups: exercise.muscleGroups }]));
}

function catalogExerciseFor(templateName: string, catalog: PlanningCatalogExercise[], catalogInfo: ExerciseCatalogInfo, restrictions: string[], excluded: Set<string>, seed: number) {
  const templateGroups = exerciseCatalogInfo[templateName]?.muscleGroups ?? [];
  const desiredPrimary = templateGroups.map(primaryForMuscleGroup).find(Boolean);
  const candidates = catalog.filter((exercise) => {
    if (excluded.has(exercise.name)) return false;
    if (desiredPrimary && exercise.primaryMuscle !== desiredPrimary) return false;
    return !exercise.restrictions.some((restriction) => restrictions.includes(restriction));
  });
  if (candidates.length === 0) return safeExerciseName(templateName, restrictions, excluded, catalogInfo);
  return candidates[seed % candidates.length].name;
}

export function generateInitialPlan(profile: PlanningProfile, catalog: PlanningCatalogExercise[] = []): GeneratedPlan {
  const daysPerWeek = Math.min(6, Math.max(2, profile.daysPerWeek));
  const sessionMinutes = profile.sessionMinutes || 60;
  const structure = structureFor(daysPerWeek, profile.experience);
  const foodRestrictions = profile.foodRestrictions ?? [];
  const dietPreference = profile.dietPreference ?? "Omnívoro";
  const dislikedFoods = profile.dislikedFoods ?? [];
  const preferredMealStyles = profile.preferredMealStyles ?? [];
  const mealsOutSlots = profile.mealsOutSlots ?? [];
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + (profile.sex === "male" ? 5 : -161);
  const calories = Math.max(profile.sex === "male" ? 1800 : 1500, Math.round((bmr * activityFactor(profile.experience, daysPerWeek) + goalAdjustment(profile.goal) + (profile.calorieAdjustment ?? 0)) / 10) * 10);
  const proteinGrams = Math.round(profile.weightKg * (profile.goal.includes("Perder") ? 2.1 : 1.8));
  const fatsGrams = Math.round(profile.weightKg * 0.9);
  const carbsGrams = Math.max(0, Math.round((calories - proteinGrams * 4 - fatsGrams * 9) / 4));
  const mealCount = Math.min(5, Math.max(3, profile.mealCount || 4));
  const mealRatios = mealCount === 3 ? [0.3, 0.4, 0.3] : mealCount === 5 ? [0.2, 0.15, 0.3, 0.15, 0.2] : [0.25, 0.3, 0.15, 0.3];
  const mealTargets = mealRatios.map((ratio) => Math.round(calories * ratio));
  const vegetarian = dietPreference.toLowerCase().includes("vegetariano");
  const vegan = dietPreference.toLowerCase().includes("vegano");
  const varietySeed = Math.round(profile.age * 7 + profile.weightKg * 3 + mealCount * 11 + (profile.goal.includes("Perder") ? 5 : 0));
  const proteinOptions = vegan
    ? ["Tofu firme", "Tempeh", "Lentejas cocidas", "Garbanzos cocidos"]
    : vegetarian
      ? ["Huevos", "Tofu firme", "Tempeh", "Lentejas cocidas", "Garbanzos cocidos", "Yogur griego", "Skyr natural"]
      : ["Pechuga de pollo", "Pavo", "Ternera magra", "Salmón", "Atún al natural", "Huevos", "Yogur griego", "Skyr natural"];
  const breakfastCarbs = ["Avena", "Pan integral", "Tortitas de arroz", "Patata cocida", "Quinoa cocida"];
  const mainCarbs = ["Arroz cocido", "Pasta cocida", "Patata cocida", "Boniato cocido", "Quinoa cocida", "Cuscús cocido"];
  const vegetables = ["Brocoli", "Espinaca", "Calabacín", "Judías verdes", "Zanahoria", "Tomate", "Champiñones", "Espárragos"];
  const fruits = ["Platano", "Manzana", "Naranja", "Kiwi", "Frutos rojos", "Piña"];
  const fats = ["Aceite de oliva", "Aguacate", "Almendras", "Crema de cacahuete", "Semillas de chía"];
  const breakfastProtein = preferredFood(proteinOptions, foodRestrictions, dietPreference, dislikedFoods, varietySeed);
  const lunchProtein = preferredFood(proteinOptions, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 1);
  const snackProtein = preferredFood(proteinOptions, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 2);
  const dinnerProtein = preferredFood(proteinOptions, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 3);
  const breakfastCarb = preferredFood(breakfastCarbs, foodRestrictions, dietPreference, dislikedFoods, varietySeed);
  const lunchCarb = preferredFood(mainCarbs, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 2);
  const snackCarb = preferredFood(mainCarbs, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 4);
  const dinnerCarb = preferredFood(mainCarbs, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 5);
  const lunchVegetable = preferredFood(vegetables, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 1);
  const dinnerVegetable = preferredFood(vegetables, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 4);
  const breakfastFruit = preferredFood(fruits, foodRestrictions, dietPreference, dislikedFoods, varietySeed);
  const snackFruit = preferredFood(fruits, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 3);
  const lunchFat = preferredFood(fats, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 2);
  const dinnerFat = preferredFood(fats, foodRestrictions, dietPreference, dislikedFoods, varietySeed + 4);
  const dairyProteins = new Set(["Yogur griego", "Skyr natural"]);
  const proteinRole = (food: string) => dairyProteins.has(food) ? "dairy" as const : "protein" as const;
  const baseMeals = [
    { name: mealsOutSlots.includes("breakfast") ? "Desayuno fuera de casa" : preferredMealStyles.includes("Desayunos salados") ? "Desayuno salado" : "Desayuno", suggestedTime: "08:00", items: [{ name: breakfastCarb, quantityGrams: Math.max(40, Math.round(profile.weightKg * 0.8)), role: "carbohydrate", alternativeGroup: "carb_base" }, { name: breakfastProtein, quantityGrams: dairyProteins.has(breakfastProtein) ? 200 : 120, role: proteinRole(breakfastProtein), alternativeGroup: "protein" }, { name: breakfastFruit, quantityGrams: 120, role: "fruit" }] },
    { name: mealsOutSlots.includes("mid_morning") ? "Media mañana fuera de casa" : "Media mañana", suggestedTime: "11:00", items: [{ name: snackProtein, quantityGrams: 120, role: proteinRole(snackProtein), alternativeGroup: "protein" }, { name: snackFruit, quantityGrams: 150, role: "fruit" }] },
    { name: mealsOutSlots.includes("lunch") ? "Comida fuera de casa" : preferredMealStyles.includes("Bowls") ? "Bowl completo" : preferredMealStyles.includes("Ensaladas completas") ? "Ensalada completa" : "Comida", suggestedTime: "14:00", items: [{ name: lunchProtein, quantityGrams: Math.round(profile.weightKg * 2), role: proteinRole(lunchProtein), alternativeGroup: "protein" }, { name: lunchCarb, quantityGrams: Math.round(profile.weightKg * 2.2), role: "carbohydrate", alternativeGroup: "carb_base" }, { name: lunchVegetable, quantityGrams: 200, role: "vegetable", alternativeGroup: "vegetable" }, { name: lunchFat, quantityGrams: lunchFat === "Aceite de oliva" ? 10 : 45, role: "fat", alternativeGroup: "fat" }] },
    { name: mealsOutSlots.includes("afternoon_snack") ? "Merienda fuera de casa" : "Merienda", suggestedTime: "17:30", items: [{ name: snackProtein, quantityGrams: dairyProteins.has(snackProtein) ? 200 : 150, role: proteinRole(snackProtein), alternativeGroup: "protein" }, { name: snackCarb, quantityGrams: 180, role: "carbohydrate", alternativeGroup: "carb_base" }] },
    { name: mealsOutSlots.includes("dinner") ? "Cena fuera de casa" : "Cena", suggestedTime: "21:00", items: [{ name: dinnerProtein, quantityGrams: 160, role: proteinRole(dinnerProtein), alternativeGroup: "protein" }, { name: dinnerCarb, quantityGrams: 220, role: "carbohydrate", alternativeGroup: "carb_base" }, { name: dinnerVegetable, quantityGrams: 180, role: "vegetable", alternativeGroup: "vegetable" }, { name: dinnerFat, quantityGrams: dinnerFat === "Aceite de oliva" ? 10 : 45, role: "fat", alternativeGroup: "fat" }] },
  ];
  const mealIndexes = mealCount === 3 ? [0, 2, 4] : mealCount === 4 ? [0, 2, 3, 4] : [0, 1, 2, 3, 4];
  const meals = mealIndexes.map((mealIndex, index) => {
    const meal = applyFoodRestrictions({ ...baseMeals[mealIndex], targetCalories: mealTargets[index], items: baseMeals[mealIndex].items.map((item) => ({ ...item, weightBasis: item.role === "carbohydrate" ? "cooked" as const : "as_served" as const })) }, foodRestrictions, dietPreference);

    return {
      ...meal,
      targetCalories: mealTargets[index],
      items: meal.items.map((item) => ({ ...item, weightBasis: item.role === "carbohydrate" ? "cooked" as const : "as_served" as const })),
    };
  });
  const exerciseCount = sessionMinutes <= 30 ? 4 : sessionMinutes <= 45 ? 5 : 6;
  const beginner = profile.experience.includes("Nunca") || profile.experience.includes("Menos");
  const performanceFocus = profile.goal.toLowerCase().includes("rendimiento");
  type WorkoutTemplate = { name: string; exercises: string[] };
  const fullBody: WorkoutTemplate[] = beginner
    ? [
      { name: "Full Body A", exercises: ["Sentadilla goblet", "Flexiones", "Jalon al pecho", "Puente de glúteos con barra", "Plancha", "Elevación de gemelos de pie"] },
      { name: "Full Body B", exercises: ["Prensa de piernas", "Press banca con mancuernas", "Remo sentado en polea", "Curl femoral", "Pallof press", "Crunch abdominal"] },
      { name: "Full Body C", exercises: ["Sentadilla dividida con mancuernas", "Press militar con mancuernas", "Jalon al pecho", "Hip thrust", "Face pull", "Curl martillo"] },
    ]
    : [
      { name: "Full Body A", exercises: ["Sentadilla goblet", "Press banca con mancuernas", "Jalon al pecho", "Peso muerto rumano", "Plancha", "Elevaciones laterales"] },
      { name: "Full Body B", exercises: ["Prensa de piernas", "Press inclinado", "Remo sentado en polea", "Curl femoral", "Face pull", "Crunch en polea"] },
      { name: "Full Body C", exercises: ["Sentadilla dividida con mancuernas", "Flexiones", "Remo con barra", "Hip thrust", "Curl martillo", "Extensión de tríceps en polea"] },
    ];
  const fourDaySplit: WorkoutTemplate[] = performanceFocus
    ? [
      { name: "Pectoral y tríceps", exercises: ["Press banca", "Press inclinado", "Fondos para pecho", "Elevaciones laterales", "Fondos para tríceps", "Extensión de tríceps en polea"] },
      { name: "Dorsal y bíceps", exercises: ["Dominadas", "Remo con barra", "Jalon al pecho", "Face pull", "Curl con barra", "Curl martillo"] },
      { name: "Cuádriceps y gemelos", exercises: ["Sentadilla", "Zancadas con barra", "Prensa de piernas", "Extensión de cuádriceps", "Sentadilla dividida con mancuernas", "Elevación de gemelos de pie"] },
      { name: "Isquiotibiales, glúteos y core", exercises: ["Peso muerto rumano", "Curl femoral", "Hip thrust", "Puente de glúteos con barra", "Elevación de gemelos sentado", "Elevación de piernas colgado"] },
    ]
    : [
      { name: "Pectoral y tríceps", exercises: ["Press banca con mancuernas", "Press inclinado", "Flexiones", "Elevaciones laterales", "Extensión de tríceps en polea", "Fondos para tríceps"] },
      { name: "Dorsal y bíceps", exercises: ["Jalon al pecho", "Remo sentado en polea", "Remo con barra", "Face pull", "Curl martillo", "Curl con barra"] },
      { name: "Cuádriceps y gemelos", exercises: ["Sentadilla goblet", "Prensa de piernas", "Zancadas con barra", "Extensión de cuádriceps", "Sentadilla dividida con mancuernas", "Elevación de gemelos de pie"] },
      { name: "Isquiotibiales, glúteos y core", exercises: ["Peso muerto rumano", "Curl femoral", "Hip thrust", "Puente de glúteos con barra", "Crunch abdominal", "Plancha"] },
    ];
  const pushPullLegs: WorkoutTemplate[] = [
    { name: "Push · Pectoral, deltoides y tríceps", exercises: ["Press banca", "Press inclinado", "Press militar con mancuernas", "Elevaciones laterales", "Fondos para tríceps", "Extensión de tríceps en polea"] },
    { name: "Pull · Dorsal y bíceps", exercises: ["Dominadas", "Remo con barra", "Jalon al pecho", "Face pull", "Curl con barra", "Curl martillo"] },
    { name: "Legs · Piernas y glúteos", exercises: ["Sentadilla", "Peso muerto rumano", "Prensa de piernas", "Hip thrust", "Curl femoral", "Elevación de gemelos de pie"] },
    { name: "Push · Deltoides y tríceps", exercises: ["Flexiones", "Aperturas en polea", "Press militar con mancuernas", "Elevaciones frontales", "Extensión de tríceps por encima de la cabeza", "Extensión de tríceps en polea"] },
    { name: "Pull · Dorsal y core", exercises: ["Remo sentado en polea", "Jalón de brazos rectos", "Pájaros con mancuernas", "Curl predicador", "Giros rusos en polea", "Crunch en polea"] },
    { name: "Legs · Isquiotibiales y gemelos", exercises: ["Zancadas con barra", "Buenos días", "Sentadilla dividida con mancuernas", "Puente de glúteos con barra", "Elevación de gemelos sentado", "Hiperextensiones"] },
  ];
  const templates = daysPerWeek <= 3 || beginner ? fullBody : daysPerWeek === 4 ? fourDaySplit : pushPullLegs;
  const catalogInfo = catalog.length > 0 ? catalogInfoFromRows(catalog) : exerciseCatalogInfo;
  const days = Array.from({ length: daysPerWeek }, (_, index) => {
    const restrictions = profile.restrictions ?? [];
    const usedInDay = new Set<string>();
    const priorities = profile.priorities ?? [];
    const template = templates[index % templates.length];
    return {
      name: template.name,
      exercises: template.exercises.slice(0, exerciseCount).map((name, exerciseIndex) => {
        const catalogName = catalog.length > 0 ? catalogExerciseFor(name, catalog, catalogInfo, restrictions, usedInDay, index * exerciseCount + exerciseIndex + varietySeed) : name;
        const safeName = restrictions.length ? safeExerciseName(catalogName, restrictions, usedInDay, catalogInfo) : catalogName;
        usedInDay.add(safeName);
        const targetsPriority = priorities.length > 0 && (catalogInfo[safeName]?.muscleGroups ?? []).some((muscleGroup) => priorities.includes(muscleGroup));
        const baseSets = profile.experience.includes("Nunca") ? 2 : 3;
        return {
          name: safeName,
          sets: targetsPriority ? Math.min(5, baseSets + 1) : baseSets, // extra volume for the muscle groups the user asked to prioritize
          repetitions: profile.goal.includes("Perder") ? "10-12" : "8-12",
          restSeconds: sessionMinutes <= 45 ? 60 : 90,
        };
      }),
    };
  });

  return { structure, calories, proteinGrams, carbsGrams, fatsGrams, mealCount, meals, days };
}

export function parsePlanningProfile(profile: Record<string, unknown>, calorieAdjustment = 0): PlanningProfile {
  return {
    sex: profile.sex === "female" ? "female" : "male",
    age: Number(profile.age),
    heightCm: Number(profile.height_cm),
    weightKg: Number(profile.current_weight_kg),
    goal: String(profile.primary_goal),
    experience: String(profile.experience),
    daysPerWeek: numberFromText(String(profile.days_per_week ?? "3"), 3),
    sessionMinutes: numberFromText(String(profile.session_duration ?? "60"), 60),
    mealCount: Number(profile.meal_count ?? 4),
    dietPreference: String(profile.diet_preference ?? "Omnívoro"),
    calorieAdjustment,
    restrictions: Array.isArray(profile.restrictions) ? (profile.restrictions as string[]) : [],
    foodRestrictions: Array.isArray(profile.food_restrictions) ? (profile.food_restrictions as string[]) : [],
    priorities: Array.isArray(profile.priorities) ? (profile.priorities as string[]) : [],
    dislikedFoods: Array.isArray(profile.disliked_foods) ? (profile.disliked_foods as string[]) : [],
    preferredMealStyles: Array.isArray(profile.preferred_meal_styles) ? (profile.preferred_meal_styles as string[]) : [],
    mealsOutSlots: Array.isArray(profile.meals_out_slots) ? (profile.meals_out_slots as string[]) : [],
  };
}
