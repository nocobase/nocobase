import { createHash } from 'node:crypto';
import type { JsonValue } from '../../shared/indexing.js';

const MAX_REVISION = 9223372036854775807n;

/** Reject precision already lost at a database boundary rather than silently fence with the wrong revision. */
export function revisionOf(value: unknown): string {
  if (typeof value === 'number' && !Number.isSafeInteger(value))
    throw new Error('Invalid indexing revision.');
  if (
    typeof value !== 'bigint' &&
    typeof value !== 'number' &&
    typeof value !== 'string'
  )
    throw new Error('Invalid indexing revision.');
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text) || BigInt(text) > MAX_REVISION)
    throw new Error('Invalid indexing revision.');
  return text;
}

export function nextRevision(value: unknown): string {
  return revisionOf(BigInt(revisionOf(value)) + 1n);
}

function isJsonArray(value: JsonValue): value is readonly JsonValue[] {
  return Array.isArray(value);
}
export function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value))
      throw new Error('Invalid JSON number.');
    return JSON.stringify(value);
  }
  if (isJsonArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return (
    '{' +
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entry]) => JSON.stringify(key) + ':' + canonicalJson(entry))
      .join(',') +
    '}'
  );
}

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function validateVectors(
  vectors: readonly (readonly number[])[],
  count: number,
  dimension: number | null,
): number {
  const size = dimension ?? vectors[0]?.length;
  if (
    !size ||
    !Number.isInteger(size) ||
    size > 8192 ||
    vectors.length !== count
  )
    throw new Error('Invalid embedding output.');
  for (const vector of vectors) {
    if (
      vector.length !== size ||
      vector.some((v) => !Number.isFinite(v)) ||
      !vector.some((v) => v !== 0)
    )
      throw new Error('Invalid embedding output.');
  }
  return size;
}
