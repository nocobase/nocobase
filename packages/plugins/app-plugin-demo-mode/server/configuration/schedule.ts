import type { DemoDailySchedule } from './types.js';

const formatters = new Map<string, Intl.DateTimeFormat>();

export function localMinute(
  now: Date,
  timezone: string,
): { day: string; hour: number; minute: number } {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timezone, formatter);
  }
  const parts = formatter.formatToParts(now);
  const get = (key: string) => parts.find((part) => part.type === key)!.value;
  return {
    day: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}
/** Reject the second occurrence of a repeated wall minute, even after downtime during the first. */
export function firstWallMinute(now: Date, timezone: string): boolean {
  const current = localMinute(now, timezone);
  for (let ago = 1; ago <= 180; ago++) {
    const previous = localMinute(
      new Date(now.getTime() - ago * 60_000),
      timezone,
    );
    if (
      previous.day === current.day &&
      previous.hour === current.hour &&
      previous.minute === current.minute
    )
      return false;
  }
  return true;
}

/** Scan UTC minutes so DST gaps are skipped and folds choose the first occurrence. */
export function nextDailyRun(
  schedule: DemoDailySchedule | null,
  now: Date = new Date(),
  lastDay?: string | null,
): string | null {
  if (!schedule?.enabled) return null;
  const start = Math.floor(now.getTime() / 60_000) * 60_000 + 60_000;
  for (let offset = 0; offset < 3 * 24 * 60; offset++) {
    const date = new Date(start + offset * 60_000);
    const local = localMinute(date, schedule.timezone);
    if (
      local.day !== lastDay &&
      local.hour === schedule.hour &&
      local.minute === schedule.minute &&
      firstWallMinute(date, schedule.timezone)
    )
      return date.toISOString();
  }
  return null;
}
