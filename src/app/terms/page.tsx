import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = { title: "Términos y condiciones | Momentum", description: "Condiciones de uso de Momentum." };

export default function TermsPage() {
  return <LegalPage eyebrow="Condiciones de uso" title="Términos y condiciones">
    <LegalSection title="1. Identificación y aceptación">
      <p>Momentum es un servicio digital de planificación orientativa de entrenamiento y nutrición. El responsable legal es <strong>[NOMBRE O RAZÓN SOCIAL PENDIENTE DE COMPLETAR]</strong>, con NIF/CIF <strong>[PENDIENTE]</strong> y domicilio en <strong>[PENDIENTE]</strong>.</p>
      <p>Al crear una cuenta aceptas estos términos y la Política de privacidad. Si no estás de acuerdo, no utilices el servicio.</p>
    </LegalSection>
    <LegalSection title="2. Uso permitido">
      <LegalList><li>Debes proporcionar información veraz y mantenerla actualizada.</li><li>Debes proteger tus credenciales y avisarnos si detectas un acceso no autorizado.</li><li>No puedes intentar acceder a cuentas, datos o funciones administrativas de otras personas.</li><li>No puedes usar Momentum para fines ilícitos, para prestar consejo profesional a terceros ni para interferir con el servicio.</li></LegalList>
    </LegalSection>
    <LegalSection title="3. Naturaleza del servicio">
      <p>Las rutinas y recomendaciones nutricionales se generan con fines informativos y de acompañamiento. No constituyen diagnóstico, tratamiento médico, prescripción sanitaria ni asesoramiento dietético individualizado por un profesional sanitario.</p>
      <p>Consulta a un médico o profesional cualificado antes de iniciar actividad física si tienes síntomas, una enfermedad, embarazo, una lesión, tomas medicación o tienes dudas sobre tu seguridad. Detén la actividad y busca atención si aparece dolor intenso, mareo, dificultad respiratoria u otros síntomas preocupantes.</p>
    </LegalSection>
    <LegalSection title="4. Cuenta, disponibilidad y cambios">
      <p>Puedes cerrar tu cuenta desde la configuración. Podemos limitar temporalmente el acceso para mantener la seguridad, corregir errores o cumplir la ley. Avisaremos de cambios relevantes en las funciones o condiciones cuando sea razonable.</p>
      <p>El servicio se proporciona con una expectativa razonable de disponibilidad, pero no garantizamos funcionamiento ininterrumpido ni ausencia absoluta de errores.</p>
    </LegalSection>
    <LegalSection title="5. Propiedad intelectual">
      <p>El software, marca, textos, diseño y materiales de Momentum pertenecen a su titular o se usan con autorización. Te concedemos una licencia personal, limitada, no exclusiva y no transferible para utilizar el servicio mientras mantengas una cuenta válida.</p>
    </LegalSection>
    <LegalSection title="6. Responsabilidad del usuario">
      <p>Eres responsable de valorar si una actividad es adecuada para ti y de seguir las indicaciones de profesionales sanitarios. Momentum no será responsable de daños derivados de ignorar advertencias, introducir información incorrecta o usar el servicio fuera de su finalidad.</p>
    </LegalSection>
    <LegalSection title="7. Pagos y cancelación">
      <p>El MVP no activa cobros automáticos por defecto. Si se habilitan planes de pago, se mostrarán precio, impuestos, periodicidad, renovación, cancelación y condiciones antes de confirmar la compra. Las condiciones de desistimiento y sus excepciones se presentarán conforme a la normativa aplicable.</p>
    </LegalSection>
    <LegalSection title="8. Ley aplicable y contacto">
      <p>Estas condiciones se regirán por la legislación aplicable al responsable y a la relación con el usuario, respetando los derechos imperativos que correspondan a los consumidores.</p>
      <p><strong>Contacto:</strong> [EMAIL LEGAL PENDIENTE]</p>
    </LegalSection>
  </LegalPage>;
}
