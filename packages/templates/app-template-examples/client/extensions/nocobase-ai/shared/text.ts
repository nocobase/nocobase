/**
 * Coerces a value that reaches the client untyped — a server payload field, a
 * tool result — into display text. Only a primitive has a meaningful string
 * form; an object or an array would stringify to `[object Object]`, so the
 * fallback is returned for those instead of a placeholder the user cannot act
 * on.
 */
export function toText(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  return fallback;
}
