/** Normalize JSONB / unknown values from Supabase into string arrays. */
export function asStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}
