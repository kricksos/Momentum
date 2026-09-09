export const foodRestrictionOptions = ["Ninguna", "Lactosa", "Gluten", "Huevos", "Frutos secos", "Soja", "Marisco"] as const;

const foodRestrictionLabelToKey: Record<string, string> = {
  Lactosa: "lactose",
  Gluten: "gluten",
  Huevos: "eggs",
  "Frutos secos": "nuts",
  Soja: "soy",
  Marisco: "seafood",
};

const foodRestrictionToLabel = Object.fromEntries(
  Object.entries(foodRestrictionLabelToKey).map(([label, restriction]) => [restriction, label]),
);

export function foodRestrictionsFromLabels(labels: unknown): string[] {
  const values = Array.isArray(labels) ? labels : [];
  return values
    .map((label) => foodRestrictionLabelToKey[String(label)])
    .filter((restriction): restriction is string => Boolean(restriction));
}

export function foodRestrictionLabelsFromRestrictions(restrictions: unknown): string[] {
  const values = Array.isArray(restrictions) ? restrictions : [];
  const labels = values
    .map((restriction) => foodRestrictionToLabel[String(restriction)])
    .filter((label): label is string => Boolean(label));

  return labels.length ? labels : ["Ninguna"];
}

export function foodAllowedForRestrictions(foodName: string, restrictions: string[]) {
  const activeRestrictions = new Set(restrictions);
  const food = foodName.toLowerCase();

  if (activeRestrictions.has("lactose") && (food.includes("yogur") || food.includes("leche") || food.includes("queso") || food.includes("skyr"))) return false;
  if (activeRestrictions.has("gluten") && (food.includes("pasta") || food.includes("avena") || food.includes("pan") || food.includes("tostada") || food.includes("harina") || food.includes("cuscús"))) return false;
  if (activeRestrictions.has("eggs") && food.includes("huevo")) return false;
  if (activeRestrictions.has("nuts") && (food.includes("almendra") || food.includes("nuez") || food.includes("avellana") || food.includes("pistacho") || food.includes("cacahuete"))) return false;
  if (activeRestrictions.has("soy") && (food.includes("tofu") || food.includes("soja") || food.includes("edamame") || food.includes("tempeh"))) return false;
  if (activeRestrictions.has("seafood") && (food.includes("sardina") || food.includes("atún") || food.includes("salmon") || food.includes("salmón") || food.includes("pescado") || food.includes("marisco"))) return false;

  return true;
}

export function foodAllowedForDiet(foodName: string, dietPreference: string) {
  const diet = dietPreference.toLowerCase();
  const food = foodName.toLowerCase();

  if (diet.includes("vegano")) return !["pollo", "pavo", "ternera", "huevo", "yogur", "leche", "queso", "skyr", "salmón", "salmon", "atún"].some((item) => food.includes(item));
  if (diet.includes("vegetariano")) return !["pollo", "pavo", "ternera", "salmón", "salmon", "atún"].some((item) => food.includes(item));
  return true;
}

export function foodAllowedForPlan(foodName: string, restrictions: string[], dietPreference: string) {
  return foodAllowedForRestrictions(foodName, restrictions) && foodAllowedForDiet(foodName, dietPreference);
}