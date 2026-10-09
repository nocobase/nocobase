import { describe, expect, it } from 'vitest';

import {
  createWorkCalendar,
  extractionDates,
  nextWorkday,
  type ExtractionSchedule,
} from '../server/calendar.js';

// The 2026 arrangement the seed installs, as far as these cases need it.
const calendar = createWorkCalendar([
  { date: '2026-01-01', kind: 'holiday' },
  { date: '2026-01-02', kind: 'holiday' },
  { date: '2026-01-03', kind: 'holiday' },
  { date: '2026-01-04', kind: 'workday' },
  ...['01', '02', '03', '04', '05', '06', '07'].map((day) => ({
    date: `2026-10-${day}`,
    kind: 'holiday' as const,
  })),
  { date: '2026-10-10', kind: 'workday' },
]);

function schedule(values: Partial<ExtractionSchedule>): ExtractionSchedule {
  return {
    frequency: 'monthly',
    firstUseDate: '2026-01-01',
    lastDeliveryDate: '2026-12-31',
    quarterDay: null,
    monthDay: null,
    weekDay: null,
    ...values,
  };
}

describe('work calendar', () => {
  it('skips weekends and holidays but keeps a weekend worked in exchange', () => {
    expect(nextWorkday('2026-01-01', calendar)).toBe('2026-01-04');
    expect(nextWorkday('2026-10-03', calendar)).toBe('2026-10-08');
    expect(nextWorkday('2026-10-10', calendar)).toBe('2026-10-10');
    expect(nextWorkday('2026-10-11', calendar)).toBe('2026-10-12');
  });
});

describe('extraction dates', () => {
  it('moves a monthly date off the National Day holiday', () => {
    const dates = extractionDates(schedule({ monthDay: 1 }), calendar);
    expect(dates).toContain('2026-01-04');
    expect(dates).toContain('2026-10-08');
    expect(dates).toHaveLength(12);
  });

  it('uses the last day of a month shorter than the chosen day', () => {
    const dates = extractionDates(
      schedule({
        monthDay: 31,
        firstUseDate: '2026-02-01',
        lastDeliveryDate: '2026-04-30',
      }),
      calendar,
    );
    // 2026-02-28 is a Saturday, 2026-04-30 a Thursday; March 31 is a Tuesday.
    expect(dates).toEqual(['2026-03-02', '2026-03-31', '2026-04-30']);
  });

  it('counts the quarter day from the first day of the quarter', () => {
    const dates = extractionDates(
      schedule({ frequency: 'quarterly', quarterDay: 1 }),
      calendar,
    );
    expect(dates).toEqual([
      '2026-01-04',
      '2026-04-01',
      '2026-07-01',
      '2026-10-08',
    ]);
  });

  it('runs weekly on the chosen weekday', () => {
    const dates = extractionDates(
      schedule({
        frequency: 'weekly',
        weekDay: 3,
        firstUseDate: '2026-09-28',
        lastDeliveryDate: '2026-10-21',
      }),
      calendar,
    );
    // Wednesday 2026-09-30, then 10-07 moves to 10-08, then 10-14 and 10-21.
    expect(dates).toEqual([
      '2026-09-30',
      '2026-10-08',
      '2026-10-14',
      '2026-10-21',
    ]);
  });

  it('gives a daily schedule one task per workday', () => {
    const dates = extractionDates(
      schedule({
        frequency: 'daily',
        firstUseDate: '2026-10-01',
        lastDeliveryDate: '2026-10-12',
      }),
      calendar,
    );
    expect(dates).toEqual([
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-12',
    ]);
  });

  it('pulls the last period back rather than past the last delivery date', () => {
    const dates = extractionDates(
      schedule({
        monthDay: 3,
        firstUseDate: '2026-09-01',
        lastDeliveryDate: '2026-10-05',
      }),
      calendar,
    );
    // 2026-10-03 is a holiday and the next workday is after the last date.
    expect(dates).toEqual(['2026-09-03', '2026-09-30']);
  });

  it('has no periods for a one-time or other frequency', () => {
    expect(extractionDates(schedule({ frequency: 'once' }), calendar)).toEqual(
      [],
    );
    expect(extractionDates(schedule({ frequency: 'other' }), calendar)).toEqual(
      [],
    );
  });
});
