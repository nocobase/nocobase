/** Reading what the agents plugin stored: a JSON column may hold anything an older version wrote. */

/** A JSON object value, or an empty object. */
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
