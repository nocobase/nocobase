import { describe, expect, it } from 'vitest';

import {
  HOUR_IN_MS,
  MAX_BUCKETS,
  bucketStartHour,
  enumerateBucketStarts,
  hourIndexToEpochMs,
  nextBucketStartHour,
  resolveGranularity,
  resolveOffsetHours,
  toHourIndex,
} from '../server/service/usage-buckets.js';

const hourOf = (iso: string): number => toHourIndex(Date.parse(iso));

describe('resolveOffsetHours', () => {
  it('rounds a minute offset to whole hours and clamps to real zones', () => {
    expect(resolveOffsetHours(480)).toBe(8);
    expect(resolveOffsetHours(-300)).toBe(-5);
    expect(resolveOffsetHours(330)).toBe(6);
    expect(resolveOffsetHours(5000)).toBe(14);
    expect(resolveOffsetHours(-5000)).toBe(-14);
    expect(resolveOffsetHours(Number.NaN)).toBe(0);
  });
});

describe('resolveGranularity', () => {
  it('picks a granularity from the range when none is requested', () => {
    const start = hourOf('2026-09-01T00:00:00Z');
    expect(resolveGranularity(start, start + 23)).toBe('hour');
    expect(resolveGranularity(start, start + 30 * 24)).toBe('day');
    expect(resolveGranularity(start, start + 200 * 24)).toBe('month');
  });

  it('honours a requested granularity that fits', () => {
    const start = hourOf('2026-09-01T00:00:00Z');
    expect(resolveGranularity(start, start + 30 * 24, 'week')).toBe('week');
  });

  it('coarsens a requested granularity that would exceed the bucket cap', () => {
    const start = hourOf('2026-01-01T00:00:00Z');
    expect(resolveGranularity(start, start + 365 * 24, 'hour')).toBe('day');
  });
});

describe('bucketStartHour', () => {
  it('keeps hour buckets untouched', () => {
    const hour = hourOf('2026-09-20T13:00:00Z');
    expect(bucketStartHour(hour, 'hour', 8)).toBe(hour);
  });

  it('starts a day bucket at local midnight', () => {
    // 2026-09-20T23:30Z is already 2026-09-21 in UTC+8.
    const start = bucketStartHour(hourOf('2026-09-20T23:00:00Z'), 'day', 8);
    expect(hourIndexToEpochMs(start)).toBe(Date.parse('2026-09-20T16:00:00Z'));
  });

  it('starts a UTC day bucket at UTC midnight', () => {
    const start = bucketStartHour(hourOf('2026-09-20T23:00:00Z'), 'day', 0);
    expect(hourIndexToEpochMs(start)).toBe(Date.parse('2026-09-20T00:00:00Z'));
  });

  it('starts a week bucket on Monday', () => {
    // 2026-09-20 is a Sunday, so its week began on Monday 2026-09-14.
    const start = bucketStartHour(hourOf('2026-09-20T10:00:00Z'), 'week', 0);
    expect(hourIndexToEpochMs(start)).toBe(Date.parse('2026-09-14T00:00:00Z'));
  });

  it('starts a month bucket on the first local day of the month', () => {
    const start = bucketStartHour(hourOf('2026-09-20T10:00:00Z'), 'month', 0);
    expect(hourIndexToEpochMs(start)).toBe(Date.parse('2026-09-01T00:00:00Z'));
    const shifted = bucketStartHour(hourOf('2026-09-01T02:00:00Z'), 'month', 8);
    expect(hourIndexToEpochMs(shifted)).toBe(
      Date.parse('2026-08-31T16:00:00Z'),
    );
  });

  it('handles instants before the epoch', () => {
    const start = bucketStartHour(hourOf('1969-12-31T23:00:00Z'), 'day', 0);
    expect(hourIndexToEpochMs(start)).toBe(Date.parse('1969-12-31T00:00:00Z'));
  });
});

describe('nextBucketStartHour', () => {
  it('advances by calendar month, not by a fixed length', () => {
    const january = bucketStartHour(hourOf('2026-01-15T00:00:00Z'), 'month', 0);
    const february = nextBucketStartHour(january, 'month', 0);
    expect(hourIndexToEpochMs(february)).toBe(
      Date.parse('2026-02-01T00:00:00Z'),
    );
    expect(hourIndexToEpochMs(nextBucketStartHour(february, 'month', 0))).toBe(
      Date.parse('2026-03-01T00:00:00Z'),
    );
  });

  it('advances fixed-length buckets by their length', () => {
    const hour = hourOf('2026-09-20T00:00:00Z');
    expect(nextBucketStartHour(hour, 'hour', 0)).toBe(hour + 1);
    expect(nextBucketStartHour(hour, 'day', 0)).toBe(hour + 24);
    expect(nextBucketStartHour(hour, 'week', 0)).toBe(hour + 168);
  });
});

describe('enumerateBucketStarts', () => {
  it('covers the range including the bucket the start falls inside', () => {
    const start = hourOf('2026-09-20T13:00:00Z');
    const end = hourOf('2026-09-22T05:00:00Z');
    const starts = enumerateBucketStarts(start, end, 'day', 0);
    expect(starts.map(hourIndexToEpochMs)).toEqual([
      Date.parse('2026-09-20T00:00:00Z'),
      Date.parse('2026-09-21T00:00:00Z'),
      Date.parse('2026-09-22T00:00:00Z'),
    ]);
  });

  it('never returns more points than the cap', () => {
    const start = hourOf('2020-01-01T00:00:00Z');
    const end = start + 5000;
    expect(
      enumerateBucketStarts(start, end, 'hour', 0).length,
    ).toBeLessThanOrEqual(MAX_BUCKETS);
  });
});

describe('toHourIndex', () => {
  it('floors to the containing UTC hour', () => {
    expect(toHourIndex(HOUR_IN_MS * 3 + 59)).toBe(3);
    expect(toHourIndex(-1)).toBe(-1);
  });
});
