/** Reading rows back: SQLite returns dates as numbers or strings and JSON as text. */
import type { Labels } from '../../shared/releases.js';

export function decodeDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string' && /^\d+$/u.test(value))
    return new Date(Number(value));
  return new Date(String(value));
}

export function decodeOptionalDate(value: unknown): Date | null {
  return value == null ? null : decodeDate(value);
}

export function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function decodeJson(value: unknown): unknown {
  return typeof value === 'string' ? (JSON.parse(value) as unknown) : value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function decodeRecord(value: unknown): Record<string, unknown> {
  if (value == null) return {};
  const decoded = decodeJson(value);
  return isRecord(decoded) ? decoded : {};
}

export function decodeLabels(value: unknown): Labels {
  const record = decodeRecord(value);
  return Object.fromEntries(
    Object.entries(record).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

export function decodeStringArray(value: unknown): string[] {
  if (value == null) return [];
  const decoded = decodeJson(value);
  return Array.isArray(decoded)
    ? decoded.filter((item): item is string => typeof item === 'string')
    : [];
}

export function nullableString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  throw new Error('Expected a scalar database value.');
}

export function nullableNumber(value: unknown): number | null {
  return value == null ? null : Number(value);
}

/** True when every label in `filter` is set to the same value in `labels`. */
export function matchesLabels(
  labels: Labels,
  filter: Labels | undefined,
): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([key, value]) => labels[key] === value);
}
