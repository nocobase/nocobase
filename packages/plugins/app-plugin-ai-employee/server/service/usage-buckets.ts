/**
 * Time-bucket arithmetic for AI usage statistics.
 *
 * Usage events store `occurredHour`, a UTC hour index (`floor(epochMs / 3.6e6)`).
 * Every coarser bucket is derived from that index here rather than in SQL, so
 * the aggregation stays one portable `GROUP BY occurredHour` and the day
 * boundary can follow the viewer's timezone instead of being fixed to UTC.
 *
 * Offsets are rounded to whole hours, which is exact for every offset except
 * the half- and quarter-hour zones (for example +05:30), where a bucket edge
 * lands up to 30 minutes away from local midnight.
 */

export const USAGE_GRANULARITIES = ['hour', 'day', 'week', 'month'] as const;
export type UsageGranularity = (typeof USAGE_GRANULARITIES)[number];

export const HOUR_IN_MS = 3_600_000;
export const HOURS_PER_DAY = 24;
export const MS_PER_DAY = HOUR_IN_MS * HOURS_PER_DAY;
/** Longest range a single request may cover. */
export const MAX_RANGE_HOURS = 366 * HOURS_PER_DAY;
/** Upper bound on points returned for one series. */
export const MAX_BUCKETS = 800;
/** Largest offset any real zone uses, in whole hours. */
const MAX_OFFSET_HOURS = 14;
/** 1970-01-01 was a Thursday; +3 days shifts week starts onto Monday. */
const EPOCH_DAY_TO_MONDAY_OFFSET = 3;

export function floorDiv(value: number, divisor: number): number {
  return Math.floor(value / divisor);
}

export function toHourIndex(epochMs: number): number {
  return floorDiv(epochMs, HOUR_IN_MS);
}

export function hourIndexToEpochMs(hourIndex: number): number {
  return hourIndex * HOUR_IN_MS;
}

/** Rounds a `getTimezoneOffset`-style east-positive minute offset to hours. */
export function resolveOffsetHours(timezoneOffsetMinutes: number): number {
  if (!Number.isFinite(timezoneOffsetMinutes)) return 0;
  const hours = Math.round(timezoneOffsetMinutes / 60);
  return Math.min(MAX_OFFSET_HOURS, Math.max(-MAX_OFFSET_HOURS, hours));
}

/**
 * Picks the granularity for a range, coarsening a requested one until the
 * series fits {@link MAX_BUCKETS}.
 */
export function resolveGranularity(
  startHour: number,
  endHour: number,
  requested?: UsageGranularity,
): UsageGranularity {
  const hours = endHour - startHour + 1;
  const preferred =
    requested ??
    (hours <= 2 * HOURS_PER_DAY
      ? 'hour'
      : hours <= 92 * HOURS_PER_DAY
        ? 'day'
        : 'month');
  const order = USAGE_GRANULARITIES.indexOf(preferred);
  for (let index = order; index < USAGE_GRANULARITIES.length; index += 1) {
    const candidate = USAGE_GRANULARITIES[index] as UsageGranularity;
    if (estimateBucketCount(hours, candidate) <= MAX_BUCKETS) return candidate;
  }
  return 'month';
}

function estimateBucketCount(
  hours: number,
  granularity: UsageGranularity,
): number {
  switch (granularity) {
    case 'hour':
      return hours;
    case 'day':
      return Math.ceil(hours / HOURS_PER_DAY) + 1;
    case 'week':
      return Math.ceil(hours / (7 * HOURS_PER_DAY)) + 1;
    case 'month':
      return Math.ceil(hours / (28 * HOURS_PER_DAY)) + 1;
  }
}

/** UTC hour index at which the bucket containing `utcHour` starts. */
export function bucketStartHour(
  utcHour: number,
  granularity: UsageGranularity,
  offsetHours: number,
): number {
  if (granularity === 'hour') return utcHour;
  const localHour = utcHour + offsetHours;
  const localDay = floorDiv(localHour, HOURS_PER_DAY);
  if (granularity === 'day') return localDay * HOURS_PER_DAY - offsetHours;
  if (granularity === 'week') {
    const week = floorDiv(localDay + EPOCH_DAY_TO_MONDAY_OFFSET, 7);
    const startDay = week * 7 - EPOCH_DAY_TO_MONDAY_OFFSET;
    return startDay * HOURS_PER_DAY - offsetHours;
  }
  const date = new Date(localDay * MS_PER_DAY);
  const startDay =
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / MS_PER_DAY;
  return startDay * HOURS_PER_DAY - offsetHours;
}

/** UTC hour index at which the bucket after the one starting here begins. */
export function nextBucketStartHour(
  startHourOfBucket: number,
  granularity: UsageGranularity,
  offsetHours: number,
): number {
  switch (granularity) {
    case 'hour':
      return startHourOfBucket + 1;
    case 'day':
      return startHourOfBucket + HOURS_PER_DAY;
    case 'week':
      return startHourOfBucket + 7 * HOURS_PER_DAY;
    case 'month': {
      const localDay = floorDiv(startHourOfBucket + offsetHours, HOURS_PER_DAY);
      const date = new Date(localDay * MS_PER_DAY);
      const startDay =
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) / MS_PER_DAY;
      return startDay * HOURS_PER_DAY - offsetHours;
    }
  }
}

/**
 * Every bucket start covering the range, so a series can report empty buckets
 * as zero instead of leaving gaps in the chart.
 */
export function enumerateBucketStarts(
  startHour: number,
  endHour: number,
  granularity: UsageGranularity,
  offsetHours: number,
): number[] {
  const starts: number[] = [];
  let current = bucketStartHour(startHour, granularity, offsetHours);
  while (current <= endHour && starts.length < MAX_BUCKETS) {
    starts.push(current);
    const next = nextBucketStartHour(current, granularity, offsetHours);
    if (next <= current) break;
    current = next;
  }
  return starts;
}
