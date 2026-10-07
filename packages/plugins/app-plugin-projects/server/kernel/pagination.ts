/**
 * Opaque page cursors. The Repository pages by the sort fields of the last row it returned (`RepositoryCursor`); the
 * API hands clients that row's sort fields as a base64url token, so clients never build or read one.
 */
import { invalid } from './errors.js';

export type CursorFields = Readonly<Record<string, string | number | null>>;

export function encodeCursor(fields: CursorFields): string {
  return Buffer.from(JSON.stringify(fields)).toString('base64url');
}

export function decodeCursor(cursor: string): CursorFields {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    );
    if (value && typeof value === 'object' && !Array.isArray(value))
      return value as CursorFields;
  } catch {
    // Falls through to the error below.
  }
  throw invalid('INVALID_PAGE_TOKEN', 'pageToken is not valid.');
}

/** A page size within [1, max]; absent → `fallback`. */
export function pageLimit(
  value: number | null | undefined,
  fallback: number,
  max: number,
): number {
  if (value === null || value === undefined) return fallback;
  if (!Number.isInteger(value))
    throw invalid('INVALID_QUERY', 'limit must be an integer.');
  return Math.min(Math.max(value, 1), max);
}

/**
 * One page from a query that was asked for `limit + 1` rows: the extra row only says there is a next page, whose
 * cursor is the last kept row's sort fields.
 */
export function pageOf<T>(
  rows: readonly T[],
  limit: number,
  cursorOf: (row: T) => CursorFields,
): { readonly rows: T[]; readonly nextCursor: string | null } {
  const kept = rows.slice(0, limit);
  const last = kept.at(-1);
  return {
    rows: kept,
    nextCursor:
      rows.length > limit && last !== undefined
        ? encodeCursor(cursorOf(last))
        : null,
  };
}
