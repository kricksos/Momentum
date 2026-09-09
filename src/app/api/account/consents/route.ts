import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const consentSchema = z.object({
  consentType: z.enum(["analytics", "health_data"]),
  accepted: z.boolean(),
});

export async function PATCH(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = consentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid consent." }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from("user_consents").insert({
    user_id: auth.user.id,
    consent_type: parsed.data.consentType,
    accepted: parsed.data.accepted,
    document_version: "1.0",
    language: "es",
    withdrawn_at: parsed.data.accepted ? null : new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "Unable to save consent." }, { status: 500 });

  return NextResponse.json({ saved: true });
}

export async function DELETE() {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const db = createAdminClient();
  const { error } = await db.from("user_consents").insert({
    user_id: auth.user.id,
    consent_type: "health_data",
    accepted: false,
    document_version: "1.0",
    language: "es",
    withdrawn_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "Unable to withdraw consent." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
