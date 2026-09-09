import type { SupabaseClient } from "@supabase/supabase-js";

/** Days since the user's last body measurement, or null if they've never logged one. */
export async function getDaysSinceLastMeasurement(db: SupabaseClient, userId: string): Promise<number | null> {
  const { data: latest } = await db
    .from("body_measurements")
    .select("measured_at")
    .eq("user_id", userId)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest?.measured_at) return null;
  return Math.floor((Date.now() - new Date(`${latest.measured_at}T00:00:00Z`).getTime()) / 86400000);
}
