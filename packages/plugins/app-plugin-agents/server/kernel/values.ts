/** Reading column values defensively: JSON columns may hold anything an older version wrote. */

/** The strings in a JSON array column; anything else reads as empty. */
export function stringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    try {
      return stringArray(JSON.parse(value) as unknown);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** Trimmed, non-empty and unique, in order. */
export function cleanList(values: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen];
}

/** Whether every item of `wanted` is in `available`. */
export function covers(
  available: readonly string[],
  wanted: readonly string[],
): boolean {
  const set = new Set(available);
  return wanted.every((item) => set.has(item));
}

/** A JSON object column, or an empty object. */
export function jsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return jsonObject(JSON.parse(value) as unknown);
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** What a JSON column holds. */
export type JsonColumn =
  | string
  | number
  | boolean
  | null
  | readonly unknown[]
  | Readonly<Record<string, unknown>>;

/** `value` as a JSON column value: plain JSON as is, anything else through a JSON round trip. */
export function asJson(value: unknown): JsonColumn {
  if (value === undefined) return null;
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return value;
  return JSON.parse(JSON.stringify(value)) as JsonColumn;
}

/** `text` cut to at most `bytes` of UTF-8, and whether it was cut. */
export function truncateBytes(
  text: string,
  bytes: number,
): { text: string; truncated: boolean } {
  if (Buffer.byteLength(text, 'utf8') <= bytes)
    return { text, truncated: false };
  const cut = Buffer.from(text, 'utf8').subarray(0, bytes).toString('utf8');
  // A cut inside a multi-byte character decodes to U+FFFD at the end; drop it.
  return { text: cut.replace(/\uFFFD$/u, ''), truncated: true };
}
