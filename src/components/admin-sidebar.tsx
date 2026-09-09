import { LayoutDashboard, Dumbbell, ShieldCheck } from "lucide-react";
import Link from "next/link";

type AdminSidebarProps = { active: "overview" | "users" | "plans" };

const items = [
  { id: "overview", label: "Centro de control", href: "/admin", icon: LayoutDashboard },
  { id: "plans", label: "Planificación", href: "/admin/plans", icon: Dumbbell },
] as const;

export function AdminSidebar({ active }: AdminSidebarProps) {
  return <aside className="border-b border-[#d3dbcf] bg-[#f4f1e9] px-5 py-5 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r lg:px-6 lg:py-8"><Link href="/admin" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]"><ShieldCheck size={18} /></span><span className="font-semibold">Momentum Admin</span></Link><nav className="mt-6 flex gap-2 overflow-x-auto lg:mt-14 lg:block lg:space-y-2" aria-label="Navegación de administración">{items.map((item) => { const Icon = item.icon; const isActive = active === item.id; return <Link key={item.id} href={item.href} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? "bg-[#18231f] text-white" : "text-[#819078] hover:bg-white/70 hover:text-[#18231f]"}`}><Icon size={17} /> {item.label}</Link>; })}</nav><Link href="/dashboard" className="mt-6 hidden text-sm font-semibold text-[#68736b] hover:text-[#18231f] lg:block">Volver al dashboard</Link></aside>;
}
