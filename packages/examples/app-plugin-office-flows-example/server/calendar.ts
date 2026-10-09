import type { Frequency } from '../shared/data-request.js';

/** A holiday, or a weekend day worked in exchange for one (调休上班). */
export interface CalendarEntry {
  readonly date: string;
  readonly kind: 'holiday' | 'workday';
}

export interface WorkCalendar {
  isWorkday(date: string): boolean;
}

export function createWorkCalendar(
  entries: readonly CalendarEntry[],
): WorkCalendar {
  const kinds = new Map(entries.map((entry) => [entry.date, entry.kind]));
  return {
    isWorkday(date: string): boolean {
      const kind = kinds.get(date);
      if (kind) return kind === 'workday';
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      return weekday !== 0 && weekday !== 6;
    },
  };
}

function shift(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000;
  return new Date(time).toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** The date itself when it is a workday, else the next workday. */
export function nextWorkday(date: string, calendar: WorkCalendar): string {
  let current = date;
  for (let step = 0; step < 366 && !calendar.isWorkday(current); step += 1)
    current = shift(current, 1);
  return current;
}

function previousWorkday(date: string, calendar: WorkCalendar): string {
  let current = date;
  for (let step = 0; step < 366 && !calendar.isWorkday(current); step += 1)
    current = shift(current, -1);
  return current;
}

export interface ExtractionSchedule {
  readonly frequency: Frequency | '';
  readonly firstUseDate: string;
  readonly lastDeliveryDate: string;
  readonly quarterDay: number | null;
  readonly monthDay: number | null;
  readonly weekDay: number | null;
}

/**
 * One date per period between the first use and the last delivery, before
 * holidays are taken into account. "Once" and "other" have no periods: a
 * one-time request is delivered on its own date, and another frequency is
 * scheduled by hand.
 */
export function nominalDates(schedule: ExtractionSchedule): string[] {
  const { firstUseDate: first, lastDeliveryDate: last } = schedule;
  if (!first || !last || last < first) return [];
  const dates: string[] = [];
  const startYear = Number(first.slice(0, 4));
  const endYear = Number(last.slice(0, 4));
  const inRange = (date: string): void => {
    if (date >= first && date <= last) dates.push(date);
  };
  switch (schedule.frequency) {
    case 'daily':
      for (let date = first; date <= last; date = shift(date, 1))
        dates.push(date);
      break;
    case 'weekly': {
      const target = schedule.weekDay ?? 1;
      // getUTCDay: 0 is Sunday; the form counts Monday as 1 and Sunday as 7.
      const offset = (target % 7) - new Date(`${first}T00:00:00Z`).getUTCDay();
      for (
        let date = shift(first, (offset + 7) % 7);
        date <= last;
        date = shift(date, 7)
      )
        dates.push(date);
      break;
    }
    case 'monthly':
      for (let year = startYear; year <= endYear; year += 1)
        for (let month = 1; month <= 12; month += 1) {
          const day = Math.min(
            schedule.monthDay ?? 1,
            daysInMonth(year, month),
          );
          inRange(`${year}-${pad(month)}-${pad(day)}`);
        }
      break;
    case 'quarterly':
      for (let year = startYear; year <= endYear; year += 1)
        for (const month of [1, 4, 7, 10]) {
          const start = `${year}-${pad(month)}-01`;
          const end = `${year}-${pad(month + 2)}-${pad(daysInMonth(year, month + 2))}`;
          const date = shift(start, (schedule.quarterDay ?? 1) - 1);
          inRange(date > end ? end : date);
        }
      break;
    default:
      break;
  }
  return dates;
}

/**
 * The days an extraction task is due. A date on a weekend or a public
 * holiday moves to the next workday, or to the workday before when that
 * would pass the last delivery date; periods that land on the same workday
 * share one task.
 */
export function extractionDates(
  schedule: ExtractionSchedule,
  calendar: WorkCalendar,
): string[] {
  const due = new Set<string>();
  for (const date of nominalDates(schedule)) {
    const forward = nextWorkday(date, calendar);
    due.add(
      forward <= schedule.lastDeliveryDate
        ? forward
        : previousWorkday(date, calendar),
    );
  }
  return [...due].filter((date) => date >= schedule.firstUseDate).sort();
}
