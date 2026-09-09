export const priorityOptions = ["Pecho", "Espalda", "Hombros", "Brazos", "Piernas", "Glúteos", "Core"] as const;

const priorityLabelToTags: Record<string, string[]> = {
  Pecho: ["pecho"],
  Espalda: ["espalda"],
  Hombros: ["hombros"],
  Brazos: ["biceps", "triceps"],
  Piernas: ["piernas"],
  Glúteos: ["gluteos"],
  Core: ["core"],
};

export function priorityTagsFromLabels(labels: unknown): string[] {
  const values = Array.isArray(labels) ? labels : [];
  return [...new Set(values.flatMap((label) => priorityLabelToTags[String(label)] ?? []))];
}
