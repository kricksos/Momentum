import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata = { title: "Salud y seguridad | Momentum", description: "Advertencias importantes sobre entrenamiento, nutrición y datos de salud." };

export default function HealthSafetyPage() {
  return <LegalPage eyebrow="Información importante" title="Salud y seguridad">
    <LegalSection title="1. Momentum no es un servicio sanitario">
      <p>Momentum ofrece planificación digital orientativa y herramientas de seguimiento. No diagnostica, trata ni previene enfermedades y no sustituye a un médico, fisioterapeuta, dietista-nutricionista u otro profesional cualificado.</p>
    </LegalSection>
    <LegalSection title="2. Antes de entrenar">
      <p>Consulta con un profesional sanitario antes de empezar o cambiar un programa si tienes una enfermedad, lesión, dolor persistente, embarazo o posparto, síntomas, antecedentes relevantes, tomas medicación o llevas tiempo sin hacer ejercicio.</p>
      <p>Detén la actividad y solicita atención urgente ante dolor torácico, dificultad respiratoria intensa, desmayo, confusión, debilidad repentina o cualquier síntoma grave.</p>
    </LegalSection>
    <LegalSection title="3. Nutrición y alergias">
      <p>Las propuestas nutricionales son generales y no sustituyen una valoración profesional. Comprueba siempre los ingredientes y el etiquetado. No utilices Momentum como única fuente de decisión ante alergias, intolerancias, trastornos de la conducta alimentaria, diabetes u otras condiciones clínicas.</p>
    </LegalSection>
    <LegalSection title="4. Datos de salud">
      <p>Solo debes introducir información que quieras compartir para personalizar tu experiencia. Puedes retirar el consentimiento desde tu cuenta. Al hacerlo, algunas recomendaciones pueden dejar de adaptarse a lesiones o restricciones.</p>
      <LegalList><li>No introduzcas datos de otras personas sin autorización.</li><li>No compartas información de emergencia ni esperes monitorización en tiempo real.</li><li>Revisa y corrige tus datos antes de usarlos para generar un plan.</li></LegalList>
    </LegalSection>
    <LegalSection title="5. Si tienes dudas">
      <p>Si no sabes si una actividad o recomendación es adecuada para ti, no la realices hasta consultarlo con un profesional. Para incidencias del producto: <strong>[EMAIL DE SOPORTE PENDIENTE]</strong>.</p>
    </LegalSection>
  </LegalPage>;
}
