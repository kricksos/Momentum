import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const completionSchema = z.object({ mealId: z.string().uuid(), completed: z.boolean(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = completionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid meal completion." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data: meal } = await supabase.from("nutrition_meals").select("id, nutrition_plan_version_id").eq("id", parsed.data.mealId).single();
    const { data: plan } = await supabase.from("nutrition_plans").select("id").eq("user_id", authData.user.id).eq("active", true).single();
    const { data: version } = plan ? await supabase.from("nutrition_plan_versions").select("id").eq("nutrition_plan_id", plan.id).eq("active", true).single() : { data: null };
    if (!meal || !version || meal.nutrition_plan_version_id !== version.id) {
      console.error("Nutrition meal ownership check failed", {
        hasMeal: Boolean(meal),
        hasPlan: Boolean(plan),
        hasVersion: Boolean(version),
      });
      return NextResponse.json({ error: "Meal is not available for this user." }, { status: 403 });
    }

    if (parsed.data.completed) {
      const { error } = await supabase.from("nutrition_meal_completions").upsert({ user_id: authData.user.id, meal_id: parsed.data.mealId, completed_on: parsed.data.date }, { onConflict: "user_id,meal_id,completed_on" });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("nutrition_meal_completions").delete().eq("user_id", authData.user.id).eq("meal_id", parsed.data.mealId).eq("completed_on", parsed.data.date);
      if (error) throw error;
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to save meal completion", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to save meal completion." }, { status: 500 });
  }
}
