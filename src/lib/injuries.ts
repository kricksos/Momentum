export const injuryOptions = ["Ninguna", "Hombro", "Rodilla", "Espalda", "Codo", "Tobillo", "Cuello", "Muñeca"] as const;

const injuryLabelToRestriction: Record<string, string> = {
  Hombro: "shoulder_injury",
  Rodilla: "knee_injury",
  Espalda: "back_injury",
  Codo: "elbow_injury",
  Tobillo: "ankle_injury",
  Cuello: "neck_injury",
  Muñeca: "wrist_injury",
};

const restrictionToInjuryLabel = Object.fromEntries(Object.entries(injuryLabelToRestriction).map(([label, restriction]) => [restriction, label]));

export function restrictionsFromInjuryLabels(labels: unknown): string[] {
  const values = Array.isArray(labels) ? labels : [];
  return values.map((label) => injuryLabelToRestriction[String(label)]).filter((restriction): restriction is string => Boolean(restriction));
}

export function injuryLabelsFromRestrictions(restrictions: unknown): string[] {
  const values = Array.isArray(restrictions) ? restrictions : [];
  const labels = values.map((restriction) => restrictionToInjuryLabel[String(restriction)]).filter((label): label is string => Boolean(label));
  return labels.length ? labels : ["Ninguna"];
}
