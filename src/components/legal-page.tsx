import Link from "next/link";
import type { ReactNode } from "react";

const legalLinks = [
  ["Privacidad", "/privacy"],
  ["Términos", "/terms"],
  ["Cookies", "/cookies"],
  ["Aviso legal", "/legal-notice"],
  ["Salud y seguridad", "/health-safety"],
] as const;

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updatedAt?: string;
  children: ReactNode;
};

export function LegalPage({ eyebrow, title, updatedAt = "12 de septiembre de 2026", children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-6 text-[#18231f] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d9ddd3] pb-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver a Momentum">
            <span className="grid size-10 place-items-center rounded-xl bg-[#18231f] text-[#d7f36b]">M</span>
            <span className="font-semibold">Momentum</span>
          </Link>
          <Link href="/register" className="text-sm font-semibold text-[#60703d] hover:text-[#18231f]">Crear cuenta</Link>
        </header>
        <article className="py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#819078]">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">{title}</h1>
          <p className="mt-5 text-sm text-[#68736b]">Última actualización: {updatedAt}</p>
          <div className="mt-10 space-y-8 rounded-[2rem] border border-[#d3dbcf] bg-[#f8f7f1] p-6 shadow-[0_20px_60px_rgba(50,65,49,0.07)] sm:p-10">{children}</div>
        </article>
        <nav className="flex flex-wrap gap-x-5 gap-y-3 border-t border-[#d9ddd3] py-6 text-sm text-[#68736b]" aria-label="Documentos legales">
          {legalLinks.map(([label, href]) => <Link key={href} href={href} className="hover:text-[#18231f]">{label}</Link>)}
        </nav>
        <p className="pb-6 text-xs leading-5 text-[#819078]">Los textos deben revisarse y completarse con la identidad jurídica y los datos de contacto del responsable antes de publicar.</p>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2><div className="mt-3 space-y-3 text-sm leading-7 text-[#59645e]">{children}</div></section>;
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}
