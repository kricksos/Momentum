import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = { title: "Política de cookies | Momentum", description: "Información sobre cookies y tecnologías similares en Momentum." };

export default function CookiesPage() {
  return <LegalPage eyebrow="Control de tecnologías" title="Política de cookies">
    <LegalSection title="1. Qué son las cookies">
      <p>Las cookies y tecnologías similares son pequeños datos que un sitio puede guardar en el dispositivo para mantener una sesión, recordar preferencias o medir el uso.</p>
    </LegalSection>
    <LegalSection title="2. Cookies necesarias">
      <p>Momentum puede usar cookies estrictamente necesarias para autenticación, seguridad, gestión de sesión y funcionamiento técnico. No requieren consentimiento cuando son imprescindibles para prestar el servicio solicitado.</p>
      <LegalList><li>Sesión de autenticación.</li><li>Protección y continuidad del flujo de onboarding.</li><li>Preferencias necesarias para seguridad y funcionamiento.</li></LegalList>
    </LegalSection>
    <LegalSection title="3. Analítica no esencial">
      <p>No activaremos analítica no esencial ni tecnologías de publicidad antes de obtener una acción afirmativa del usuario. Rechazarla no impedirá usar las funciones principales.</p>
      <p>La preferencia puede modificarse desde la cuenta. La versión, estado y fecha del consentimiento se registran para poder demostrar la elección.</p>
    </LegalSection>
    <LegalSection title="4. Terceros">
      <p>Si incorporamos un proveedor de analítica, publicaremos su identidad, finalidad, duración, datos tratados, posibles transferencias internacionales y la forma de retirar el consentimiento antes de activarlo.</p>
      <p>Actualmente no debe configurarse Google Analytics, publicidad ni seguimiento equivalente sin completar esa documentación y el mecanismo de consentimiento.</p>
    </LegalSection>
    <LegalSection title="5. Configuración del navegador">
      <p>Puedes bloquear o eliminar cookies desde tu navegador. El bloqueo de cookies necesarias puede impedir iniciar sesión o utilizar partes del servicio.</p>
    </LegalSection>
    <LegalSection title="6. Contacto">
      <p>Para consultas sobre cookies: <strong>[EMAIL LEGAL PENDIENTE]</strong>.</p>
    </LegalSection>
  </LegalPage>;
}
