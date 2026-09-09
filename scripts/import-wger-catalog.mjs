import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const endpoint = "https://wger.de/api/v2/exerciseinfo/?language=4&limit=1000";
const output = path.join(root, "supabase", "migrations", "0033_wger_exercise_catalog.sql");
const source = "wger.de";
const license = "CC BY-SA";

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sql(value) {
  return value === null || value === undefined ? "null" : `'${String(value).replaceAll("'", "''")}'`;
}

function cleanDescription(value) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 800) || "Ejercicio de entrenamiento guiado.";
}

function primaryMuscle(record) {
  const names = (record.muscles ?? []).map((muscle) => `${muscle.name_en ?? ""} ${muscle.name ?? ""}`.toLowerCase());
  const category = record.category?.name ?? "";
  const spanishText = `${record.name ?? ""} ${record.translations?.find((translation) => translation.language === 4)?.description ?? ""}`.toLowerCase();
  if (/(aductor|adduccion|adducción)/.test(spanishText)) return "adductors";
  if (/(lumbar|erector|espalda baja|extensi[oó]n lumbar)/.test(spanishText)) return "lower_back";
  if (names.some((name) => name.includes("hamstring") || name.includes("biceps femoris") || name.includes("isquio"))) return "hamstrings";
  if (names.some((name) => name.includes("adductor") || name.includes("aductor"))) return "adductors";
  if (names.some((name) => name.includes("lower back") || name.includes("erector spinae") || name.includes("lumbar"))) return "lower_back";
  if (names.some((name) => name.includes("triceps"))) return "triceps";
  if (names.some((name) => name.includes("biceps"))) return "biceps";
  if (names.some((name) => name.includes("chest") || name.includes("pectoral"))) return "pectorals";
  if (names.some((name) => name.includes("lat") || name.includes("back") || name.includes("dorsal"))) return "lats";
  if (names.some((name) => name.includes("shoulder") || name.includes("deltoid"))) return "deltoids";
  if (names.some((name) => name.includes("quad"))) return "quadriceps";
  if (names.some((name) => name.includes("hamstring") || name.includes("biceps femoris"))) return "hamstrings";
  if (names.some((name) => name.includes("glute"))) return "glutes";
  if (names.some((name) => name.includes("calf") || name.includes("gastrocnemius"))) return "calves";
  if (names.some((name) => name.includes("abdominal") || name.includes("obliquus") || name.includes("abs"))) return "core";
  return ({ Chest: "pectorals", Back: "lats", Shoulders: "deltoids", Legs: "quadriceps", Arms: "biceps", Abs: "core", Calves: "calves" })[category] ?? "core";
}

function muscleGroups(record, primary) {
  const groups = new Set([primary]);
  for (const muscle of record.muscles ?? []) {
    const value = `${muscle.name_en ?? ""} ${muscle.name ?? ""}`.toLowerCase();
    if (value.includes("chest") || value.includes("pectoral")) groups.add("pecho");
    if (value.includes("back") || value.includes("lat") || value.includes("dorsal")) groups.add("espalda");
    if (value.includes("shoulder") || value.includes("deltoid")) groups.add("hombros");
    if (value.includes("biceps")) groups.add("biceps");
    if (value.includes("triceps")) groups.add("triceps");
    if (value.includes("quad")) groups.add("piernas");
    if (value.includes("hamstring")) groups.add("isquios");
    if (value.includes("glute")) groups.add("gluteos");
    if (value.includes("calf") || value.includes("gastrocnemius")) groups.add("gemelos");
    if (value.includes("abdominal") || value.includes("obliquus") || value.includes("abs")) groups.add("core");
  }
  return [...groups].filter((group) => !group.includes("-"));
}

function restrictions(record) {
  const text = `${record.name ?? ""} ${record.translations?.[0]?.description ?? ""}`.toLowerCase();
  const result = [];
  if (/(squat|lunge|leg press|sentadilla|zancada|jump|salto|running|correr)/.test(text)) result.push("knee_injury");
  if (/(deadlift|row|good morning|hyperextension|crunch|rotat|peso muerto|remo|hiperext|crunch|giro)/.test(text)) result.push("back_injury");
  if (/(press|dip|fly|raise|pull[- ]?up|shoulder|press|fondos|apertura|elevaci)/.test(text)) result.push("shoulder_injury");
  if (/(curl|extension|tricep|bicep|curl|extensi)/.test(text)) result.push("elbow_injury");
  return [...new Set(result)];
}

const response = await fetch(endpoint);
if (!response.ok) throw new Error(`wger API returned ${response.status}`);
const payload = await response.json();
const candidates = payload.results.map((record) => ({
  ...record,
  name: record.translations?.find((translation) => translation.language === 4)?.name ?? record.translations?.[0]?.name,
})).filter((record) => record.name && record.images?.length && record.license?.url?.includes("creativecommons.org"));
const selected = [];
const seen = new Set();
for (const record of candidates) {
  const name = record.name.trim();
  const key = name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  selected.push({ record, name });
}

if (selected.length < 250) throw new Error(`Only selected ${selected.length} exercises`);

const primaryCounts = new Map();
for (const { record } of selected) {
  const primary = primaryMuscle(record);
  primaryCounts.set(primary, (primaryCounts.get(primary) ?? 0) + 1);
}
console.log(`Primary muscle distribution: ${JSON.stringify(Object.fromEntries(primaryCounts))}`);

const usedSlugs = new Set();
const rows = selected.map(({ record, name }) => {
  const primary = primaryMuscle(record);
  const images = record.images ?? [];
  const first = images[0]?.image ?? null;
  const second = images[1]?.image ?? first;
  const groups = muscleGroups(record, primary);
  const equipment = (record.equipment ?? []).map((item) => item.name.toLowerCase().replaceAll(" ", "_"));
  const difficulty = record.category?.name === "Cardio" ? "beginner" : "intermediate";
  const alternatives = [];
  const baseSlug = slugify(name);
  let slug = baseSlug;
  if (usedSlugs.has(slug)) slug = `${baseSlug}-${record.id}`;
  usedSlugs.add(slug);
    return `(${sql(name)}, ${sql(cleanDescription(record.translations?.find((item) => item.language === 4)?.description))}, ${sql(record.category?.name === "Abs" ? "core" : record.category?.name === "Cardio" ? "cardio" : "accessory")}, ${sql(difficulty)}, ${sql(JSON.stringify(equipment))}::jsonb, ${sql(JSON.stringify(restrictions(record)))}::jsonb, ${sql(JSON.stringify(alternatives))}::jsonb, ${sql(JSON.stringify(groups))}::jsonb, ${sql(primary)}, ${sql(slug)}, ${sql(first)}, ${sql(second)}, ${sql(source)}, ${sql(record.license?.short_name ?? license)}, ${sql(record.license_author ?? "wger contributors")})`;
});

const migration = `-- Generated from wger.de exerciseinfo API. Source data is Creative Commons licensed.\ninsert into public.exercises (name, description, category, difficulty, equipment_required, restrictions, alternatives, muscle_groups, primary_muscle, slug, image_start_url, image_end_url, media_source, media_license, media_author)\nvalues\n  ${rows.join(",\n  ")}\non conflict (name) do update set\n  description = excluded.description, equipment_required = excluded.equipment_required, restrictions = excluded.restrictions, muscle_groups = excluded.muscle_groups, primary_muscle = excluded.primary_muscle, slug = excluded.slug, image_start_url = excluded.image_start_url, image_end_url = excluded.image_end_url, media_source = excluded.media_source, media_license = excluded.media_license, media_author = excluded.media_author, updated_at = now();\n`;
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, migration, "utf8");
console.log(`Generated ${selected.length} exercises at ${output}`);