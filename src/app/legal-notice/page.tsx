import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = { title: "Aviso legal | Momentum", description: "Información legal del titular y del servicio Momentum." };

export default function LegalNoticePage() {
  return <LegalPage eyebrow="Información corporativa" title="Aviso legal">
    <LegalSection title="1. Titular del sitio">
      <p><strong>Titular:</strong> [NOMBRE O RAZÓN SOCIAL PENDIENTE DE COMPLETAR]</p>
      <p><strong>NIF/CIF:</strong> [PENDIENTE]</p>
      <p><strong>Domicilio:</strong> [PENDIENTE]</p>
      <p><strong>Email:</strong> [EMAIL LEGAL PENDIENTE]</p>
      <p><strong>Datos registrales:</strong> [PENDIENTE, SI APLICA]</p>
      <p>Estos campos son obligatorios para la publicación comercial y deben sustituirse por datos reales antes del despliegue.</p>
    </LegalSection>
    <LegalSection title="2. Objeto">
      <p>Este sitio presenta y permite utilizar Momentum, una plataforma digital de planificación orientativa de entrenamiento, nutrición y seguimiento del progreso.</p>
    </LegalSection>
    <LegalSection title="3. Condiciones de acceso">
      <p>El acceso y uso del sitio implica aceptar las condiciones aplicables. El titular puede actualizar contenidos, suspender funcionalidades por mantenimiento o limitar accesos para proteger el servicio.</p>
    </LegalSection>
    <LegalSection title="4. Propiedad intelectual e industrial">
      <p>Los contenidos, código, marca, logotipos, diseño y elementos audiovisuales están protegidos por la normativa aplicable. Queda prohibida su reproducción, distribución o explotación fuera de lo permitido sin autorización.</p>
    </LegalSection>
    <LegalSection title="5. Enlaces y responsabilidad">
      <p>Los enlaces a terceros pueden estar sujetos a sus propias condiciones y políticas. El titular no controla ni garantiza el contenido, disponibilidad o seguridad de sitios externos.</p>
      <p>La información de Momentum no sustituye consejo médico, nutricional o deportivo profesional. Consulta el <a className="font-semibold text-[#60703d] underline" href="/health-safety">aviso de salud y seguridad</a>.</p>
    </LegalSection>
    <LegalSection title="6. Comunicaciones y reclamaciones">
      <LegalList><li>Consultas generales: [EMAIL DE SOPORTE PENDIENTE].</li><li>Privacidad y derechos: [EMAIL LEGAL PENDIENTE].</li><li>Reclamaciones: [DIRECCIÓN O CANAL PENDIENTE].</li></LegalList>
    </LegalSection>
  </LegalPage>;
}
