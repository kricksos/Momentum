import { isAdminUser } from "@/lib/admin-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function sameSet(left: string[], right: string[]) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const db = createAdminClient();

  try {
    const { data: profile, error } = await db
      .from("profiles")
      .select("food_restrictions, restrictions")
      .eq("user_id", userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      foodRestrictions: Array.isArray(profile.food_restrictions) ? profile.food_restrictions : [],
      injuries: Array.isArray(profile.restrictions) ? profile.restrictions : [],
    });
  } catch (error) {
    console.error("Restrictions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const db = createAdminClient();
  
  try {
    const body = await request.json();
    const { foodRestrictions = [], injuries = [] } = body;

    // Validate inputs
    if (!Array.isArray(foodRestrictions) || !Array.isArray(injuries)) {
      return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
    }

    const [{ data: currentProfile, error: currentProfileError }, { data: nutritionPlan }, { data: workoutPlan }] = await Promise.all([
      db.from("profiles").select("food_restrictions, restrictions").eq("user_id", userId).single(),
      db.from("nutrition_plans").select("id").eq("user_id", userId).eq("active", true).maybeSingle(),
      db.from("workout_plans").select("id").eq("user_id", userId).eq("active", true).maybeSingle(),
    ]);

    if (currentProfileError || !currentProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const [{ data: nutritionVersion }, { data: workoutVersion }] = await Promise.all([
      nutritionPlan ? db.from("nutrition_plan_versions").select("profile_snapshot").eq("nutrition_plan_id", nutritionPlan.id).eq("active", true).maybeSingle() : Promise.resolve({ data: null }),
      workoutPlan ? db.from("workout_plan_versions").select("profile_snapshot").eq("workout_plan_id", workoutPlan.id).eq("active", true).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const nutritionSnapshot = nutritionVersion?.profile_snapshot as Record<string, unknown> | null;
    const workoutSnapshot = workoutVersion?.profile_snapshot as Record<string, unknown> | null;
    const nutritionPlanNeedsReview = !sameSet(stringArray(nutritionSnapshot?.food_restrictions), foodRestrictions);
    const workoutPlanNeedsReview = !sameSet(stringArray(workoutSnapshot?.restrictions), injuries);

    // Update profile with restrictions
    const { data: profile, error: updateError } = await db
      .from("profiles")
      .update({
        food_restrictions: foodRestrictions,
        restrictions: injuries,
        nutrition_plan_review_needed: nutritionPlanNeedsReview,
        workout_plan_review_needed: workoutPlanNeedsReview,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !profile) {
      return NextResponse.json({ error: "Failed to update restrictions" }, { status: 500 });
    }

    // Log audit event
    await db.from("audit_events").insert({
      user_id: userId,
      entity_type: "profile_restrictions",
      entity_id: userId,
      action: "update",
      metadata: {
        actor_user_id: auth.user.id,
        foodRestrictions,
        injuries,
      },
    });

    return NextResponse.json({
      success: true,
      foodRestrictions: profile.food_restrictions,
      injuries: profile.restrictions,
    });
  } catch (error) {
    console.error("Restrictions update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
