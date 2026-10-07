/**
 * Validation of request fields. Each helper throws a 400 naming the field; `undefined` means "not provided" and is left
 * to the caller.
 */
import { invalid } from './errors.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

/** `YYYY-MM-DD` of a real calendar date; null or `''` clears it. */
export function validDate(value: unknown, field: string): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !DATE_PATTERN.test(value))
    throw invalid('INVALID_DATE', `${field} must be YYYY-MM-DD.`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw invalid('INVALID_DATE', `${field} is not a valid date.`);
  return value;
}

/** A trimmed, non-empty string of at most `maxLength` characters. */
export function requiredText(
  value: unknown,
  field: string,
  maxLength: number,
  code = 'INVALID_FIELD',
): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maxLength)
    throw invalid(
      code,
      `${field} is required (at most ${maxLength} characters).`,
    );
  return text;
}

/** A string of at most `maxLength` characters, or null. */
export function optionalText(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string')
    throw invalid('INVALID_FIELD', `${field} must be a string.`);
  if (value.length > maxLength)
    throw invalid('INVALID_FIELD', `${field} is too long.`);
  return value;
}

export function validBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean')
    throw invalid('INVALID_FIELD', `${field} must be a boolean.`);
  return value;
}

/** One of `values`. */
export function validChoice<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
  code = 'INVALID_FIELD',
): T {
  if (
    typeof value !== 'string' ||
    !(values as readonly string[]).includes(value)
  )
    throw invalid(code, `${field} must be one of ${values.join(', ')}.`);
  return value as T;
}

/** An array of non-empty strings, trimmed and deduplicated in order. */
export function stringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value))
    throw invalid('INVALID_FIELD', `${field} must be an array of strings.`);
  const result: string[] = [];
  for (const item of value as unknown[]) {
    if (typeof item !== 'string' || item.trim() === '')
      throw invalid('INVALID_FIELD', `${field} must be an array of strings.`);
    if (!result.includes(item.trim())) result.push(item.trim());
  }
  return result;
}

/** An id-like string, or null. */
export function optionalId(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value === '')
    throw invalid('INVALID_FIELD', `${field} must be a string or null.`);
  return value;
}
