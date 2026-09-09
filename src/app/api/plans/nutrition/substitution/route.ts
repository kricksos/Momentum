import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const substitutionSchema = z.object({
  mealItemId: z.string().uuid(),
  selectedFoodId: z.string().uuid(),
  quantityGrams: z.number().int().positive(),
});

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = substitutionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid substitution." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data: item } = await supabase.from("nutrition_meal_items").select("id, meal_id, alternative_group").eq("id", parsed.data.mealItemId).single();
    const { data: meal } = item ? await supabase.from("nutrition_meals").select("nutrition_plan_version_id").eq("id", item.meal_id).single() : { data: null };
    const { data: version } = meal ? await supabase.from("nutrition_plan_versions").select("nutrition_plan_id").eq("id", meal.nutrition_plan_version_id).single() : { data: null };
    const { data: plan } = version ? await supabase.from("nutrition_plans").select("user_id").eq("id", version.nutrition_plan_id).single() : { data: null };
    if (!item || plan?.user_id !== authData.user.id || !item.alternative_group) {
      return NextResponse.json({ error: "This substitution is not available for the current user." }, { status: 403 });
    }

    const { data: selectedFood } = await supabase.from("foods_catalog").select("id").eq("id", parsed.data.selectedFoodId).single();
    if (!selectedFood) return NextResponse.json({ error: "Food not found." }, { status: 404 });

    const { error } = await supabase.from("nutrition_item_selections").upsert({
      user_id: authData.user.id,
      meal_item_id: parsed.data.mealItemId,
      selected_food_id: parsed.data.selectedFoodId,
      quantity_grams: parsed.data.quantityGrams,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,meal_item_id" });
    if (error) throw error;

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to save nutrition substitution", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to save nutrition substitution." }, { status: 500 });
  }
}
