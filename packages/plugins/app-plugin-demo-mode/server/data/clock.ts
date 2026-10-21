import { createHash } from 'node:crypto';
import type { DemoClock } from './types.js';

/** The offset of `timeZone` from UTC at `date`, in minutes, without a calendar library. */
function offsetMinutes(timeZone: string, date: Date): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  const match = /GMT([+-])(\d{2}):?(\d{2})?/u.exec(name ?? '');
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === '-' ? -minutes : minutes;
}

/** The calendar date of `date` in `timeZone`, as `YYYY-MM-DD`. */
function localDate(timeZone: string, date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Days are counted in the dataset's time zone, so "three days ago at 10:00" is a local office hour there. */
export function createDemoClock(
  now: Date,
  timeZone = 'UTC',
  salt = '',
): DemoClock {
  const dateAgo = (days: number): string => {
    const [year, month, day] = localDate(timeZone, now).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day - days))
      .toISOString()
      .slice(0, 10);
  };
  const daysAgo = (days: number, hour = 10, minute = 0): Date => {
    const [year, month, day] = dateAgo(days).split('-').map(Number);
    const wall = Date.UTC(year, month - 1, day, hour, minute);
    // The offset of the instant itself, which differs from today's across a daylight saving change.
    const guess = new Date(
      wall - offsetMinutes(timeZone, new Date(wall)) * 60_000,
    );
    const at = new Date(wall - offsetMinutes(timeZone, guess) * 60_000);
    // Nothing the demo writes lies in the future of the import unless asked for with a negative day.
    return days >= 0 && at.getTime() > now.getTime()
      ? new Date(Math.min(at.getTime(), now.getTime() - 60_000))
      : at;
  };
  const seed = `${salt}:${timeZone}:${dateAgo(0)}`;
  return {
    seed,
    sample: (key) =>
      createHash('sha256').update(`${seed}:${key}`).digest().readUInt32BE(0) /
      0x100000000,
    now,
    timeZone,
    daysAgo,
    dateAgo,
    isoAgo: (days, hour, minute) => daysAgo(days, hour, minute).toISOString(),
  };
}
