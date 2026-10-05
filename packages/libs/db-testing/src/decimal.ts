/**
 * A decimal as a value, without the trailing zeros a server pads it to its
 * column's or its aggregate's scale: PostgreSQL reads `avg(1, 1, 1)` as
 * `1.00000000000000000000` and MySQL as `1.0000`, where SQLite reads `1`.
 * The Repository keeps each database's own text, so a portable assertion
 * compares the value. Applied to an array or a plain object, it returns a
 * copy with every nested decimal string reduced the same way; anything that
 * is not a decimal string passes through as it is.
 */
export function withoutDecimalPadding<T>(value: T): T {
  if (typeof value === 'string' && /^-?\d+\.\d+$/u.test(value)) {
    return value.replace(/\.?0+$/u, '') as T;
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) => withoutDecimalPadding(item)) as T;
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        withoutDecimalPadding(item),
      ]),
    ) as T;
  }
  return value;
}
