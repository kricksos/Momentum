import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminPlansLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen lg:pl-64"><AdminSidebar active="plans" />{children}</div>;
}