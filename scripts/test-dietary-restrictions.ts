import { generateInitialPlan } from "../src/features/planning/engine";

function assert(description: string, condition: boolean, details?: unknown) {
  if (!condition) {
    console.error(description, details ?? "");
    process.exit(1);
  }
}

const plan = generateInitialPlan({
  sex: "male",
  age: 30,
  heightCm: 180,
  weightKg: 80,
  goal: "Perder grasa",
  experience: "Entre 1 y 3 años",
  daysPerWeek: 4,
  sessionMinutes: 60,
  mealCount: 4,
  restrictions: [],
  priorities: [],
  foodRestrictions: ["lactose", "gluten"],
});

const foods = plan.meals.flatMap((meal) => meal.items.map((item) => item.name));
const roles = plan.meals.flatMap((meal) => meal.items.map((item) => item.role));
const blocked = foods.filter((food) => ["Yogur griego", "Pasta cocida", "Avena"].includes(food));

assert("Food restrictions were ignored:", blocked.length === 0, blocked);
assert("Generated meals should keep fruit and vegetables visible:", roles.includes("fruit") && roles.includes("vegetable"), roles);
assert("Produce should be intentional, not forced into every meal:", plan.meals.some((meal) => meal.items.every((item) => item.role !== "fruit" && item.role !== "vegetable")), plan.meals);

const veganSoyFreePlan = generateInitialPlan({
  sex: "female",
  age: 34,
  heightCm: 166,
  weightKg: 62,
  goal: "Mantener peso",
  experience: "Entre 1 y 3 años",
  daysPerWeek: 3,
  sessionMinutes: 45,
  mealCount: 4,
  dietPreference: "Vegano",
  foodRestrictions: ["soy", "gluten"],
});

const veganFoods = veganSoyFreePlan.meals.flatMap((meal) => meal.items.map((item) => item.name));
const animalFoods = veganFoods.filter((food) => ["Pechuga de pollo", "Pavo", "Huevos", "Yogur griego"].includes(food));
const soyOrGlutenFoods = veganFoods.filter((food) => ["Tofu firme", "Pasta cocida", "Avena"].includes(food));

assert("Vegan preference should avoid animal foods:", animalFoods.length === 0, animalFoods);
assert("Soy/gluten restrictions should still be respected in vegan plans:", soyOrGlutenFoods.length === 0, soyOrGlutenFoods);
assert("Vegan soy-free plans should keep a protein fallback:", veganFoods.includes("Lentejas cocidas"), veganFoods);

const preferencePlan = generateInitialPlan({
  sex: "female",
  age: 29,
  heightCm: 168,
  weightKg: 60,
  goal: "Mantener peso",
  experience: "Entre 1 y 3 años",
  daysPerWeek: 3,
  sessionMinutes: 45,
  mealCount: 4,
  foodRestrictions: ["lactose"],
  dislikedFoods: ["Pescado", "Pollo y pavo", "Lácteos"],
  preferredMealStyles: ["Bowls"],
});

const preferenceFoods = preferencePlan.meals.flatMap((meal) => meal.items.map((item) => item.name));
assert("Disliked foods should not be selected when alternatives exist:", !preferenceFoods.some((food) => ["Salmón", "Atún al natural", "Pechuga de pollo", "Pavo", "Yogur griego", "Skyr natural"].includes(food)), preferenceFoods);
assert("Preferred meal styles should influence the generated meals:", preferencePlan.meals.some((meal) => meal.name === "Bowl completo"), preferencePlan.meals);

const mealsOutPlan = generateInitialPlan({
  sex: "male",
  age: 31,
  heightCm: 178,
  weightKg: 76,
  goal: "Ganar masa muscular",
  experience: "Entre 1 y 3 años",
  daysPerWeek: 4,
  sessionMinutes: 60,
  mealCount: 5,
  mealsOutSlots: ["breakfast", "lunch", "dinner"],
});

assert("Meals out should only affect the selected slots:", mealsOutPlan.meals.some((meal) => meal.name === "Desayuno fuera de casa") && mealsOutPlan.meals.some((meal) => meal.name === "Comida fuera de casa") && mealsOutPlan.meals.some((meal) => meal.name === "Cena fuera de casa") && mealsOutPlan.meals.some((meal) => meal.name === "Merienda"), mealsOutPlan.meals);

console.log("Dietary restrictions are respected for the generated meals.");
