import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const targetSchema = z.object({ targetWeightKg: z.number().min(20).max(400).nullable() });

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = targetSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid target weight." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").update({ target_weight_kg: parsed.data.targetWeightKg }).eq("user_id", authData.user.id);
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to save target weight", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to save target weight." }, { status: 500 });
  }
}
