/**
 * Small gaps in the Repository API, filled in one place so the stores read as if the API had them.
 */
import type { FilterBuilder, FilterNode } from '@nocobase/db';

/**
 * `field` equals one of `values`: an `or` of equalities.
 *
 * Thin stand-in: the Repository filter has no `in` operator. Callers keep lists small (one page of ids); a large
 * membership test belongs in a relation filter.
 */
export function oneOf(
  filter: FilterBuilder,
  field: string,
  values: readonly string[],
): FilterNode {
  if (values.length === 0) return filter.string(field).eq('\u0000none');
  return filter.or(values.map((value) => filter.string(field).eq(value)));
}

/**
 * A unique constraint refused the write.
 *
 * Thin stand-in: the Repository passes the driver's error through, so the dialects' codes and messages are matched
 * here. Remove once it reports a conflict of its own.
 */
export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  if (code === '23505') return true;
  if (typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT'))
    return /UNIQUE|PRIMARYKEY/u.test(code);
  return /unique constraint|UNIQUE constraint failed|Duplicate entry/iu.test(
    error.message,
  );
}

/** Removes duplicates and empty values, keeping the first occurrence's order. */
export function unique(values: Iterable<string | null | undefined>): string[] {
  const seen = new Set<string>();
  for (const value of values) if (value) seen.add(value);
  return [...seen];
}
