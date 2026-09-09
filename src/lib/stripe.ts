import Stripe from "stripe";

export type StripePlan = "monthly" | "quarterly" | "annual";

export const stripePlanPriceEnv: Record<StripePlan, string> = {
  monthly: "STRIPE_PRICE_MONTHLY",
  quarterly: "STRIPE_PRICE_QUARTERLY",
  annual: "STRIPE_PRICE_ANNUAL",
};

export function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return new Stripe(apiKey, {
    apiVersion: "2026-08-26.dahlia",
  });
}

export function getStripePriceId(plan: StripePlan) {
  const envKey = stripePlanPriceEnv[plan];
  const value = process.env[envKey];

  if (!value) {
    throw new Error(`${envKey} is not configured.`);
  }

  return value;
}

export function getProfilePlanFromStripePlan(plan: string) {
  if (plan === "monthly") return "monthly";
  if (plan === "quarterly") return "quarterly";
  if (plan === "annual") return "annual";
  return "free";
}

export function getRenewalDate(plan: string, startedAt: Date) {
  const renewal = new Date(startedAt);

  if (plan === "monthly") renewal.setUTCMonth(renewal.getUTCMonth() + 1);
  if (plan === "quarterly") renewal.setUTCMonth(renewal.getUTCMonth() + 3);
  if (plan === "annual") renewal.setUTCFullYear(renewal.getUTCFullYear() + 1);

  return plan === "free" ? null : renewal.toISOString();
}
