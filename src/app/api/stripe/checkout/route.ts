import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, getStripePriceId } from "@/lib/stripe";

const bodySchema = z.object({
  plan: z.enum(["monthly", "quarterly", "annual"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: auth } = await authClient.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription request." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: profile } = await db.from("profiles").select("subscription_plan, subscription_status, subscription_renews_at").eq("user_id", auth.user.id).maybeSingle();
  const keepsPremiumAccess = profile?.subscription_plan && profile.subscription_plan !== "free" && (
    profile.subscription_status === "active" ||
    (profile.subscription_status === "cancelled" && profile.subscription_renews_at && new Date(profile.subscription_renews_at) > new Date())
  );

  if (keepsPremiumAccess) {
    return NextResponse.json({ error: "Ya tienes una suscripción activa. Podrás cambiar de plan cuando finalice el periodo actual." }, { status: 409 });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: auth.user.email ?? undefined,
      line_items: [{ price: getStripePriceId(parsed.data.plan), quantity: 1 }],
      success_url: parsed.data.successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/account?checkout=success`,
      cancel_url: parsed.data.cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/account?checkout=cancelled`,
      client_reference_id: auth.user.id,
      metadata: {
        user_id: auth.user.id,
        plan: parsed.data.plan,
      },
      subscription_data: {
        metadata: {
          user_id: auth.user.id,
          plan: parsed.data.plan,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Unable to create Stripe checkout session", error);
    return NextResponse.json({ error: "Stripe checkout is not configured yet." }, { status: 500 });
  }
}
