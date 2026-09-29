import type { ScheduleRule } from './validation.js';

/**
 * Serializes JSON-compatible data with object keys sorted, so two values that
 * differ only in key order compare equal. It follows `JSON.stringify` for
 * everything else: `toJSON` is honoured, `undefined` and functions are dropped
 * from objects and become `null` in arrays.
 */
export function stableStringify(value: unknown): string | undefined {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  const json =
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { toJSON?: unknown }).toJSON === 'function'
      ? (value as { toJSON(): unknown }).toJSON()
      : value;
  if (Array.isArray(json)) return json.map((item) => sortKeys(item));
  if (json === null || typeof json !== 'object') return json;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(json).sort()) {
    sorted[key] = sortKeys((json as Record<string, unknown>)[key]);
  }
  return sorted;
}

/** Compares two rules field by field; dates compare by millisecond. */
export function sameRule(left: ScheduleRule, right: ScheduleRule): boolean {
  return (
    left.cron === right.cron &&
    left.every === right.every &&
    left.limit === right.limit &&
    effectiveTimeZone(left) === effectiveTimeZone(right) &&
    left.startDate?.getTime() === right.startDate?.getTime() &&
    left.endDate?.getTime() === right.endDate?.getTime()
  );
}

/**
 * A cron rule without a time zone runs in UTC, which is how both adapters
 * write it; an interval rule has no use for one.
 */
export function effectiveTimeZone(rule: ScheduleRule): string | undefined {
  return rule.cron !== undefined ? (rule.tz ?? 'UTC') : rule.tz;
}
