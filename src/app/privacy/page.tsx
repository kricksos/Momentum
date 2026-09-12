import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = { title: "Política de privacidad | Momentum", description: "Información sobre el tratamiento de datos personales en Momentum." };

export default function PrivacyPage() {
  return <LegalPage eyebrow="Transparencia" title="Política de privacidad">
    <LegalSection title="1. Responsable del tratamiento">
      <p><strong>Responsable:</strong> [NOMBRE O RAZÓN SOCIAL PENDIENTE DE COMPLETAR]</p>
      <p><strong>NIF/CIF:</strong> [PENDIENTE] · <strong>Domicilio:</strong> [PENDIENTE]</p>
      <p><strong>Contacto de privacidad:</strong> [EMAIL LEGAL PENDIENTE]</p>
      <p>Estos datos deben completarse antes de publicar Momentum para identificar al responsable conforme al RGPD, la LOPDGDD y la LSSI-CE.</p>
    </LegalSection>
    <LegalSection title="2. Qué datos tratamos">
      <LegalList><li>Datos de cuenta: nombre, email y credenciales gestionadas por nuestro proveedor de autenticación.</li><li>Datos de perfil y objetivos: edad, medidas, experiencia, disponibilidad, preferencias y equipamiento.</li><li>Datos de entrenamiento, progreso, nutrición, alergias e intolerancias.</li><li>Datos de salud declarados voluntariamente, como lesiones o limitaciones físicas, solo cuando el usuario los facilita.</li><li>Consentimientos, solicitudes de derechos, registros técnicos y eventos de uso.</li></LegalList>
    </LegalSection>
    <LegalSection title="3. Para qué los usamos">
      <LegalList><li>Crear y proteger la cuenta.</li><li>Generar y mostrar planes de entrenamiento y nutrición orientativos.</li><li>Registrar sesiones, medidas y progreso solicitado por el usuario.</li><li>Atender solicitudes, mantener la seguridad y resolver incidencias.</li><li>Medir y mejorar el servicio con analítica no esencial únicamente cuando exista consentimiento.</li></LegalList>
      <p>No vendemos datos ni los usamos para publicidad personalizada invasiva. Momentum no sustituye a profesionales sanitarios.</p>
    </LegalSection>
    <LegalSection title="4. Bases jurídicas y datos de salud">
      <p>La gestión de la cuenta y la prestación del servicio se basan en la ejecución del contrato o de medidas precontractuales. Las comunicaciones y tratamientos opcionales se basan en el consentimiento, que puede retirarse en cualquier momento.</p>
      <p>Los datos relativos a lesiones, limitaciones o salud se consideran especialmente protegidos. Solo se tratarán con una acción afirmativa separada cuando sea necesario para personalizar el servicio. Retirar ese consentimiento puede limitar la personalización, sin impedir el uso de las funciones que no dependan de esos datos.</p>
    </LegalSection>
    <LegalSection title="5. Proveedores">
      <p>Usamos proveedores que prestan servicios de alojamiento, autenticación, base de datos, correo y, si se activa, pagos. Antes de producción se documentarán sus identidades, ubicaciones, transferencias internacionales, garantías y contratos de encargo.</p>
      <LegalList><li>Supabase: autenticación y base de datos.</li><li>Vercel: alojamiento y ejecución de la aplicación.</li><li>Stripe: pagos, solo si se activa una suscripción.</li><li>Proveedor de correo transaccional: solo si se activa dicho servicio.</li></LegalList>
    </LegalSection>
    <LegalSection title="6. Conservación y seguridad">
      <p>Conservaremos los datos mientras la cuenta esté activa y durante los plazos necesarios para cumplir obligaciones legales, resolver reclamaciones y proteger el servicio. Definiremos y publicaremos los plazos concretos antes del lanzamiento.</p>
      <p>Aplicamos control de acceso, aislamiento por usuario, cifrado en tránsito, gestión separada de secretos y políticas RLS. Ninguna medida elimina por completo los riesgos de Internet.</p>
    </LegalSection>
    <LegalSection title="7. Tus derechos">
      <p>Puedes solicitar acceso, rectificación, supresión, portabilidad, limitación u oposición escribiendo al contacto de privacidad. Desde tu cuenta puedes exportar tus datos, retirar consentimientos y eliminar la cuenta. Responderemos dentro de los plazos legales aplicables.</p>
      <p>También puedes reclamar ante la Agencia Española de Protección de Datos (AEPD) u otra autoridad de control competente.</p>
    </LegalSection>
    <LegalSection title="8. Cambios y contacto">
      <p>Informaremos de cambios relevantes en esta política y conservaremos la versión aceptada junto con la fecha y el idioma del consentimiento.</p>
      <p><strong>Contacto:</strong> [EMAIL LEGAL PENDIENTE]</p>
    </LegalSection>
  </LegalPage>;
}
