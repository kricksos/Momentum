import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AccountStatus } from "@/components/account-status";
import { NotificationBell } from "@/components/notification-bell";

type AppHeaderProps = { email: string; name: string; daysSinceLastMeasurement: number | null; hasProfile: boolean; workoutLabel?: string | null; workoutHref?: string | null; workoutDue?: boolean };

export function AppHeader({ email, name, daysSinceLastMeasurement, hasProfile, workoutLabel, workoutHref, workoutDue }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3" aria-label="Volver a la portada de Momentum">
        <span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><Sparkles size={18} /></span>
        <span className="font-semibold">Momentum</span>
      </Link>
      <div className="flex items-center gap-3">
        <NotificationBell daysSinceLastMeasurement={daysSinceLastMeasurement} hasProfile={hasProfile} workoutLabel={workoutLabel} workoutHref={workoutHref} workoutDue={workoutDue} />
        <AccountStatus email={email} name={name} />
      </div>
    </header>
  );
}
