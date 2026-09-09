"use client";

import { jsPDF } from "jspdf";
import { BarChart3, CreditCard, Download, LayoutDashboard, LoaderCircle, Save, Users } from "lucide-react";
import { type ReactNode, useState } from "react";
import * as XLSX from "xlsx";

import { AdminPlanActions } from "@/components/admin-plan-actions";
import { AdminRestrictionsForm } from "@/components/admin-restrictions-form";
import { AdminUserForm } from "@/components/admin-user-form";

type UserRow = {
  id: string;
  email?: string;
  name: string;
  goal: string;
  diet: string;
  targetWeight: number | null;
  plan?: "free" | "monthly" | "quarterly" | "annual" | "starter" | "pro" | "elite";
  status?: "pending" | "active" | "paused" | "cancelled";
  startedAt: string | null;
  renewsAt: string | null;
  autoRenew: boolean;
  complete: boolean;
  createdAt: string;
  lastAccess: string;
};
type Props = { overview: ReactNode; users: UserRow[] };
type AnalyticsSummary = { consentedUsers: number; events: number; uniqueUsers: number; byEvent: Array<{ eventName: string; count: number }> };

function formatSubscriptionDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Sin renovación";
}

const tabs = [
  { id: "overview", label: "Vista general", icon: LayoutDashboard },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "plans", label: "Suscripciones", icon: CreditCard },
  { id: "analytics", label: "Analítica", icon: BarChart3 },
] as const;
type TabId = (typeof tabs)[number]["id"];

export function AdminWorkspace({ overview, users, analytics }: Props & { analytics: AnalyticsSummary }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const content =
    activeTab === "overview" ? overview : activeTab === "users" ? <UsersPanel users={users} /> : activeTab === "plans" ? <SubscriptionPanel users={users} /> : <AnalyticsPanel analytics={analytics} />;

  return (
    <div>
      <nav
        className="mt-8 grid grid-cols-2 gap-1 rounded-2xl border border-[#d3dbcf] bg-[#eef0e8] p-1 sm:grid-cols-4"
        aria-label="Secciones de administración"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-xs font-semibold transition sm:text-sm ${
                activeTab === tab.id ? "bg-[#18231f] text-[#f6f4ed] shadow-sm" : "text-[#68736b] hover:bg-white/70"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-7">{content}</div>
    </div>
  );
}

function UsersPanel({ users }: { users: UserRow[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [goalFilter, setGoalFilter] = useState<Set<string>>(new Set());

  // Obtener objetivos únicos
  const uniqueGoals = Array.from(new Set(users.map((u) => u.goal).filter((g) => g !== "Pendiente"))).sort();
  const subscriptionLabel = (plan: UserRow["plan"]) => plan === "monthly" || plan === "starter" ? "Mensual" : plan === "quarterly" || plan === "pro" ? "Cada 3 meses" : plan === "annual" || plan === "elite" ? "Anual" : "Free";

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(term) ||
      (user.email?.toLowerCase().includes(term)) ||
      user.goal.toLowerCase().includes(term);

    const matchesStatus = statusFilter.size === 0 || statusFilter.has(user.complete ? "Completo" : "Pendiente");

    const matchesGoal = goalFilter.size === 0 || goalFilter.has(user.goal);

    return matchesSearch && matchesStatus && matchesGoal;
  });

  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId) ?? null;

  const toggleStatusFilter = (status: string) => {
    const newSet = new Set(statusFilter);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setStatusFilter(newSet);
  };

  const toggleGoalFilter = (goal: string) => {
    const newSet = new Set(goalFilter);
    if (newSet.has(goal)) {
      newSet.delete(goal);
    } else {
      newSet.add(goal);
    }
    setGoalFilter(newSet);
  };

  const exportRows = filteredUsers.map((user) => ({
    nombre: user.name,
    email: user.email ?? "Sin email",
    objetivo: user.goal,
    alimentacion: user.diet,
    planActivo: user.plan ?? "free",
    estadoPlan: user.status ?? "pending",
    plan: user.complete ? "Completo" : "Pendiente",
    alta: user.createdAt,
    ultimoAcceso: user.lastAccess,
  }));

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = ["Nombre", "Email", "Objetivo", "Alimentación", "Plan activo", "Estado", "Plan", "Alta", "Último acceso"];
    const rows = exportRows.map((row) => [
      row.nombre,
      row.email,
      row.objetivo,
      row.alimentacion,
      row.planActivo,
      row.estadoPlan,
      row.plan,
      row.alta,
      row.ultimoAcceso,
    ]);

    const csv = [headers, ...rows]
      .map((line) =>
        line
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    downloadBlob(`usuarios-${new Date().toISOString().slice(0, 10)}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    XLSX.writeFile(workbook, `usuarios-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const total = exportRows.length;
    const completed = exportRows.filter((row) => row.plan === "Completo").length;
    const pending = total - completed;
    const goalCounts = exportRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.objetivo] = (acc[row.objetivo] ?? 0) + 1;
      return acc;
    }, {});
    const topGoal = Object.entries(goalCounts).sort((a, b) => b[1] - a[1])[0];

    doc.setFillColor(24, 35, 31);
    doc.rect(0, 0, 210, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Reporte ejecutivo", 14, 15);

    doc.setTextColor(24, 35, 31);
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 14, 34);
    doc.text(`Cohorte filtrado: ${total} usuarios`, 14, 41);

    const metricY = 54;
    const metrics = [
      { label: "Total", value: String(total) },
      { label: "Completos", value: String(completed) },
      { label: "Pendientes", value: String(pending) },
      { label: "Objetivo principal", value: topGoal ? `${topGoal[0]} (${topGoal[1]})` : "Sin datos" },
    ];

    metrics.forEach((metric, index) => {
      const x = 14 + index * 47;
      doc.setFillColor(244, 241, 233);
      doc.roundedRect(x, metricY, 42, 18, 2, 2, "F");
      doc.setTextColor(104, 115, 107);
      doc.setFontSize(8);
      doc.text(metric.label, x + 3, metricY + 6);
      doc.setTextColor(24, 35, 31);
      doc.setFontSize(10);
      const valueText = metric.value.length > 14 ? `${metric.value.slice(0, 14)}…` : metric.value;
      doc.text(valueText, x + 3, metricY + 13);
    });

    doc.setTextColor(24, 35, 31);
    doc.setFontSize(11);
    doc.text("Distribución por objetivo", 14, 86);

    let yPosition = 94;
    Object.entries(goalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([goal, count]) => {
        doc.setFontSize(10);
        doc.text(`• ${goal}: ${count} usuarios`, 18, yPosition);
        yPosition += 8;
      });

    yPosition += 10;
    doc.text("Usuarios", 14, yPosition);
    yPosition += 8;

    exportRows.slice(0, 14).forEach((row, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 18;
      }

      doc.setFillColor(index % 2 === 0 ? 248 : 255, 247, 241);
      doc.rect(12, yPosition - 5, 186, 15, "F");
      doc.setTextColor(24, 35, 31);
      doc.setFontSize(9);
      doc.text(`${index + 1}. ${row.nombre} • ${row.objetivo} • ${row.plan}`, 16, yPosition + 2);
      yPosition += 16;
    });

    doc.save(`reporte-ejecutivo-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1]">
        <div className="space-y-4 border-b border-[#d3dbcf] p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Directorio</p>
              <h2 className="mt-2 text-2xl font-semibold">Usuarios</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#68736b]">
                {filteredUsers.length} de {users.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={filteredUsers.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-xs font-semibold text-[#18231f] hover:bg-[#eef0e8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={14} />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={exportExcel}
                  disabled={filteredUsers.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-xs font-semibold text-[#18231f] hover:bg-[#eef0e8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={14} />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  disabled={filteredUsers.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d3dbcf] bg-white px-3 py-2 text-xs font-semibold text-[#18231f] hover:bg-[#eef0e8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={14} />
                  Resumen
                </button>
              </div>
            </div>
          </div>

          {/* Search input */}
          <input
            type="text"
            placeholder="Buscar por nombre, email u objetivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#d3dbcf] bg-white px-4 py-2 text-sm placeholder-[#a8aaa5] focus:border-[#60703d] focus:outline-none"
          />

          {/* Filtros avanzados */}
          <div className="space-y-3 border-t border-[#d3dbcf] pt-4">
            {/* Estado filter */}
            <div>
              <p className="text-xs font-semibold text-[#819078]">Estado de planificación</p>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilter.has("Completo")}
                    onChange={() => toggleStatusFilter("Completo")}
                    className="h-4 w-4 rounded border-[#d3dbcf] accent-[#60703d]"
                  />
                  <span className="text-sm text-[#68736b]">Completo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilter.has("Pendiente")}
                    onChange={() => toggleStatusFilter("Pendiente")}
                    className="h-4 w-4 rounded border-[#d3dbcf] accent-[#60703d]"
                  />
                  <span className="text-sm text-[#68736b]">Pendiente</span>
                </label>
              </div>
            </div>

            {/* Goal filter */}
            {uniqueGoals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#819078]">Objetivo</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {uniqueGoals.map((goal) => (
                    <label key={goal} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={goalFilter.has(goal)}
                        onChange={() => toggleGoalFilter(goal)}
                        className="h-4 w-4 rounded border-[#d3dbcf] accent-[#60703d]"
                      />
                      <span className="text-sm text-[#68736b]">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Botón limpiar filtros */}
            {(statusFilter.size > 0 || goalFilter.size > 0) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter(new Set());
                  setGoalFilter(new Set());
                }}
                className="text-xs font-semibold text-[#60703d] hover:text-[#18231f]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-[#d3dbcf] text-xs uppercase tracking-[0.12em] text-[#819078]">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Objetivo</th>
                <th className="px-6 py-4">Alimentación</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Alta</th>
                <th className="px-6 py-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#e3e7dd] last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold">{user.name}</p>
                      <p className="mt-1 text-xs text-[#819078]">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-[#68736b]">{user.goal}</td>
                    <td className="px-6 py-4 text-[#68736b]">{user.diet}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.plan && user.plan !== "free" ? "bg-[#e7f5b4] text-[#60703d]" : "bg-[#eef0e8] text-[#68736b]"
                        }`}
                      >
                        {subscriptionLabel(user.plan)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#68736b]">{user.createdAt}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className="font-semibold text-[#60703d] hover:text-[#18231f]"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#68736b]">
                    No se encontraron usuarios coincidentes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser ? (
        <section className="rounded-3xl border-2 border-[#60703d] bg-gradient-to-br from-[#faf9f6] to-[#f8f7f1] p-6 shadow-sm">
          {/* Header del usuario seleccionado */}
          <div className="mb-6 border-b border-[#d3dbcf] pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#60703d]">Usuario seleccionado</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#18231f]">{selectedUser.name}</h3>
                <p className="mt-1 text-sm text-[#68736b]">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#68736b] hover:bg-[#f0ede4] hover:text-[#18231f]"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>

          {/* Formularios y acciones */}
          <div className="space-y-6">
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <AdminUserForm
                userId={selectedUser.id}
                initialName={selectedUser.name === "Sin perfil" ? "" : selectedUser.name}
                initialGoal={selectedUser.goal === "Pendiente" ? "Ganar masa muscular" : selectedUser.goal}
                initialDiet={selectedUser.diet === "No indicada" ? "Omnívoro" : selectedUser.diet}
                initialTargetWeight={selectedUser.targetWeight}
                initialPlan={selectedUser.plan ?? "free"}
              />
              <AdminPlanActions userId={selectedUser.id} />
            </section>

            <AdminRestrictionsForm userId={selectedUser.id} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SubscriptionPanel({ users }: { users: UserRow[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const paidUsers = users.filter((user) => user.plan && user.plan !== "free").length;
  const planCounts = [
    ["Free", users.filter((user) => !user.plan || user.plan === "free").length],
    ["Mensual", users.filter((user) => user.plan === "monthly" || user.plan === "starter").length],
    ["Cada 3 meses", users.filter((user) => user.plan === "quarterly" || user.plan === "pro").length],
    ["Anual", users.filter((user) => user.plan === "annual" || user.plan === "elite").length],
  ] as const;
  const planLabel = (plan: UserRow["plan"]) => {
    if (plan === "monthly" || plan === "starter") return "Mensual";
    if (plan === "quarterly" || plan === "pro") return "Cada 3 meses";
    if (plan === "annual" || plan === "elite") return "Anual";
    return "Free";
  };
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || user.name.toLowerCase().includes(term) || (user.email ?? "").toLowerCase().includes(term);
    const matchesPlan = planFilter === "all" || planLabel(user.plan).toLowerCase() === ({ free: "free", monthly: "mensual", quarterly: "cada 3 meses", annual: "anual" }[planFilter] ?? "");
    return matchesSearch && matchesPlan;
  });
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  return (
    <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Monetización</p>
          <h2 className="mt-2 text-2xl font-semibold">Planes de pago</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#68736b]">
            Filtra la cartera y corrige el plan activo de cada usuario sin salir de esta vista.
          </p>
        </div>
        <CreditCard className="text-[#72873f]" size={24} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs text-[#819078]">Planes activos</p>
          <p className="mt-2 text-2xl font-semibold">{paidUsers}</p>
          <p className="mt-1 text-xs text-[#68736b]">Usuarios con un plan de pago</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs text-[#819078]">Planes de pago</p>
          <p className="mt-2 text-2xl font-semibold">{paidUsers}</p>
          <p className="mt-1 text-xs text-[#68736b]">Usuarios con plan seleccionado</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-[#18231f] p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d7f36b]">Distribución actual</p>
            <h3 className="mt-2 text-lg font-semibold">Qué plan tiene cada usuario</h3>
          </div>
          <CreditCard className="text-[#d7f36b]" size={20} />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {planCounts.map(([label, count]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[11px] text-[#b9c2b7]">{label}</p><p className="mt-1 text-xl font-semibold">{count}</p></div>)}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-xs text-[#c8d0c5]">Selecciona un usuario en la cartera para cambiar su plan activo desde aquí.</p>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-[#d3dbcf] bg-white">
        <div className="border-b border-[#e3e7dd] p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Cartera</p>
              <h3 className="mt-2 text-xl font-semibold">Suscripciones por usuario</h3>
            </div>
            <p className="text-sm text-[#68736b]">{filteredUsers.length} de {users.length} usuarios</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nombre o email" className="rounded-xl border border-[#d3dbcf] bg-[#f8f7f1] px-3.5 py-2.5 text-sm text-[#18231f] outline-none focus:border-[#60703d]" />
            <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="rounded-xl border border-[#d3dbcf] bg-[#f8f7f1] px-3.5 py-2.5 text-sm text-[#18231f] outline-none focus:border-[#60703d]"><option value="all">Todos los planes</option><option value="free">Free</option><option value="monthly">Mensual</option><option value="quarterly">Cada 3 meses</option><option value="annual">Anual</option></select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#e3e7dd] text-[10px] uppercase tracking-[0.14em] text-[#819078]"><tr><th className="px-5 py-3">Usuario</th><th className="px-5 py-3">Plan activo</th><th className="px-5 py-3">Próxima renovación</th><th className="px-5 py-3 text-right">Acción</th></tr></thead>
            <tbody>{filteredUsers.map((user) => <tr key={user.id} className="border-b border-[#eef0e8] last:border-0"><td className="px-5 py-4"><p className="font-semibold text-[#18231f]">{user.name}</p><p className="mt-1 text-xs text-[#819078]">{user.email ?? "Sin email"}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.plan === "free" || !user.plan ? "bg-[#eef0e8] text-[#68736b]" : "bg-[#e7f5b4] text-[#60703d]"}`}>{planLabel(user.plan)}</span></td><td className="px-5 py-4 text-xs text-[#68736b]">{formatSubscriptionDate(user.renewsAt)}{user.autoRenew && user.renewsAt ? <span className="ml-2 text-[#60703d]">Auto</span> : null}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelectedUserId(user.id)} className="rounded-full border border-[#b6c77b] px-3 py-1.5 text-xs font-semibold text-[#60703d] hover:bg-[#e7f5b4]">Editar plan</button></td></tr>)}</tbody>
          </table>
          {filteredUsers.length === 0 ? <p className="p-8 text-center text-sm text-[#68736b]">No hay usuarios con esos filtros.</p> : null}
        </div>
      </section>

      {selectedUser ? <SubscriptionEditor key={selectedUser.id} user={selectedUser} onClose={() => setSelectedUserId(null)} /> : null}
    </section>
  );
}

function AnalyticsPanel({ analytics }: { analytics: AnalyticsSummary }) {
  const labels: Record<string, string> = {
    signup_completed: "Cuentas creadas",
    plan_generated: "Planes generados",
    workout_started: "Entrenamientos iniciados",
    workout_completed: "Entrenamientos completados",
    weight_logged: "Pesos registrados",
  };

  return <section className="space-y-6">
    <div className="rounded-3xl bg-[#18231f] p-6 text-white shadow-[0_18px_36px_rgba(24,35,31,0.14)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d7f36b]">Señales del producto</p><h2 className="mt-2 text-2xl font-semibold">Analítica respetuosa</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#c8d0c5]">Eventos agregados de los últimos 30 días. Solo se registran cuando el usuario acepta la analítica no esencial.</p></div><BarChart3 className="text-[#d7f36b]" size={24} /></div><div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-[#b9c2b7]">Usuarios con consentimiento</p><p className="mt-2 text-3xl font-semibold">{analytics.consentedUsers}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-[#b9c2b7]">Eventos registrados</p><p className="mt-2 text-3xl font-semibold">{analytics.events}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-[#b9c2b7]">Usuarios activos medidos</p><p className="mt-2 text-3xl font-semibold">{analytics.uniqueUsers}</p></div></div></div>
    <section className="rounded-3xl border border-[#d3dbcf] bg-[#f8f7f1] p-6"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#819078]">Embudo de activación</p><h3 className="mt-2 text-2xl font-semibold">Qué está ocurriendo</h3></div><span className="rounded-full bg-[#e7f5b4] px-3 py-1.5 text-xs font-semibold text-[#60703d]">Últimos 30 días</span></div><div className="mt-6 space-y-4">{analytics.byEvent.map((event, index) => { const max = Math.max(...analytics.byEvent.map((item) => item.count), 1); return <div key={event.eventName}><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-[#18231f]">{labels[event.eventName] ?? event.eventName}</span><span className="font-semibold text-[#60703d]">{event.count}</span></div><div className="h-2 rounded-full bg-[#e3e7dd]"><div className={`h-full rounded-full ${index === analytics.byEvent.length - 1 ? "bg-[#72873f]" : "bg-[#b6c77b]"}`} style={{ width: `${Math.min(100, (event.count / max) * 100)}%` }} /></div></div>; })}</div></section>
  </section>;
}

function SubscriptionEditor({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [plan, setPlan] = useState<UserRow["plan"]>(user.plan ?? "free");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscriptionPlan: plan }) });
    setSaving(false);
    setMessage(response.ok ? "Suscripción actualizada." : "No se ha podido actualizar la suscripción.");
    if (response.ok) window.location.reload();
  }

  return <section className="mt-6 rounded-2xl border border-[#60703d] bg-[#18231f] p-5 text-white shadow-[0_16px_30px_rgba(24,35,31,0.16)]"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d7f36b]">Edición rápida</p><h3 className="mt-2 text-xl font-semibold">{user.name}</h3><p className="mt-1 text-sm text-[#c8d0c5]">{user.email ?? "Sin email"}</p></div><button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-[#c8d0c5] hover:bg-white/10">Cerrar</button></div><div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,240px)_1fr]"><label className="text-xs font-semibold uppercase tracking-[0.1em] text-[#b9c2b7]">Nuevo plan activo<select value={plan} onChange={(event) => setPlan(event.target.value as UserRow["plan"])} className="mt-2 w-full rounded-xl border-0 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-[#18231f]"><option value="free">Free</option><option value="monthly">Mensual</option><option value="quarterly">Cada 3 meses</option><option value="annual">Anual</option></select></label><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-[#c8d0c5]"><p>Activada el <span className="font-semibold text-white">{formatSubscriptionDate(user.startedAt)}</span></p><p className="mt-1">Próxima renovación <span className="font-semibold text-[#d7f36b]">{formatSubscriptionDate(user.renewsAt)}</span></p><p className="mt-1">Auto-renovación <span className="font-semibold text-white">{user.autoRenew && user.renewsAt ? "Activa" : "No aplica"}</span></p></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#c8d0c5]">Al guardar, comienza un nuevo periodo y se calcula su próxima renovación.</p><button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-[#d7f36b] px-4 py-2.5 text-sm font-semibold text-[#18231f] disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} {saving ? "Guardando..." : "Guardar plan activo"}</button></div>{message ? <p className="mt-3 text-sm font-semibold text-[#d7f36b]">{message}</p> : null}</section>;
}
