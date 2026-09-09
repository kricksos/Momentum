import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminUsersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen lg:pl-64"><AdminSidebar active="users" />{children}</div>;
}