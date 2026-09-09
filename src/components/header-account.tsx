"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { AccountStatus } from "@/components/account-status";
import { createClient } from "@/lib/supabase/client";

type HeaderAccountProps = {
  initialUser: { email: string; name: string } | null;
};

export function HeaderAccount({ initialUser }: HeaderAccountProps) {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setUser(null);
        return;
      }
      const name = typeof data.user.user_metadata?.name === "string" ? data.user.user_metadata.name : "Mi cuenta";
      setUser({ email: data.user.email ?? "", name });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }

      const name = typeof session.user.user_metadata?.name === "string" ? session.user.user_metadata.name : "Mi cuenta";
      setUser({ email: session.user.email ?? "", name });
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (user) return <AccountStatus email={user.email} name={user.name} />;

  return <div className="flex items-center gap-2 sm:gap-3"><Link href="/login" className="inline-flex items-center rounded-full border border-[#aeb9a2] px-3.5 py-2.5 text-sm font-semibold text-[#59645e] transition-colors hover:border-[#18231f] hover:text-[#18231f] sm:px-4"><span className="sm:hidden">Entrar</span><span className="hidden sm:inline">Iniciar sesión</span></Link><Link href="/onboarding" className="inline-flex items-center gap-2 rounded-full bg-[#d7f36b] px-3.5 py-2.5 text-sm font-semibold text-[#18231f] transition-transform hover:-translate-y-0.5 sm:px-4">Comenzar mi plan <ArrowUpRight size={16} /></Link></div>;
}
