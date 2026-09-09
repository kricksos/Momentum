import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.generated";

const answerSchema = z.object({
  sessionToken: z.string().min(32),
  questionKey: z.string().min(1).max(80),
  answerValue: z.unknown(),
  answerType: z.enum([
    "number",
    "single_select",
    "multi_select",
    "text",
    "date",
    "boolean",
  ]),
});

export async function POST(request: Request) {
  const parsedBody = answerSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid answer." }, { status: 400 });
  }

  const { sessionToken, questionKey, answerType } = parsedBody.data;
  const answerValue = parsedBody.data.answerValue as Json;
  const sessionTokenHash = createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  try {
    const supabase = createAdminClient();
    const { data: session, error: sessionError } = await supabase
      .from("onboarding_sessions")
      .select("id, status, expires_at")
      .eq("session_token_hash", sessionTokenHash)
      .single();

    if (sessionError || !session || session.status !== "active" || new Date(session.expires_at) <= new Date()) {
      return NextResponse.json({ error: "Onboarding session is invalid or expired." }, { status: 401 });
    }

    const { error } = await supabase.from("onboarding_answers").upsert(
      {
        onboarding_session_id: session.id,
        question_key: questionKey,
        answer_value: answerValue,
        answer_type: answerType,
      },
      { onConflict: "onboarding_session_id,question_key" },
    );

    if (error) {
      console.error("Unable to save onboarding answer", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json({ error: "Unable to save onboarding answer." }, { status: 500 });
    }

    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Supabase server credentials are not configured." }, { status: 503 });
  }
}
