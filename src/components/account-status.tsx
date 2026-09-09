"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AccountStatusProps = {
  email: string;
  name: string;
};

export function AccountStatus({ email, name }: AccountStatusProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-[#aeb9a2] px-3 py-2 text-left transition-colors hover:border-[#18231f]">
        <span className="grid size-7 place-items-center rounded-full bg-[#e7f5b4] text-[#60703d]"><UserRound size={14} /></span>
        <span className="hidden sm:block"><span className="block text-xs font-semibold text-[#60703d]">Online</span><span className="block max-w-32 truncate text-xs text-[#59645e]" title={email}>{name}</span></span>
      </Link>
      <Link href="/account" aria-label="Mi perfil" title="Mi perfil" className="grid size-10 place-items-center rounded-full border border-[#aeb9a2] text-[#59645e] transition-colors hover:border-[#18231f] hover:text-[#18231f]"><Settings size={16} /></Link>
      <button type="button" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión" className="grid size-10 place-items-center rounded-full border border-[#aeb9a2] text-[#59645e] transition-colors hover:border-[#18231f] hover:text-[#18231f]"><LogOut size={16} /></button>
    </div>
  );
}
