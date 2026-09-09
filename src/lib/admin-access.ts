import type { User } from "@supabase/supabase-js";

export function isAdminUser(user: Pick<User, "email"> | null | undefined) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));
}
