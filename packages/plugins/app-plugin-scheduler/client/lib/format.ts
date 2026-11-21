/** Wording of rules, times and durations, in the reader's language and time zone. */
type Translate = (key: string, options?: Record<string, unknown>) => string;

const NUMBER = /^\d{1,2}$/u;

function clock(hour: string, minute: string): string {
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function weekdayName(day: number, locale: string): string {
  // 2023-01-01 was a Sunday, so day `n` of that week is weekday `n` in cron (0 and 7 both Sunday).
  return new Intl.DateTimeFormat(locale || 'en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2023, 0, 1 + (day % 7))));
}

/**
 * A short sentence for a cron rule, such as “Every 5 minutes”, for the common shapes: every minute, every n minutes,
 * hourly, every n hours, daily, on weekdays, weekly and monthly. Any other rule is shown as it is; the page shows the
 * expression beside the sentence anyway.
 */
export function describeCron(
  cron: string,
  t: Translate,
  locale: string,
): string {
  const fields = cron.trim().split(/\s+/u);
  if (fields.length === 5) {
    const [minute = '', hour = '', day = '', month = '', weekday = ''] = fields;
    const everyDay = day === '*' && month === '*';
    if (everyDay && weekday === '*') {
      if (hour === '*') {
        if (minute === '*') return t('cron.everyMinute');
        const step = /^\*\/(\d+)$/u.exec(minute)?.[1];
        if (step) return t('cron.everyMinutes', { count: Number(step) });
        if (NUMBER.test(minute))
          return t('cron.everyHour', { minute: minute.padStart(2, '0') });
      }
      const hours = /^\*\/(\d+)$/u.exec(hour)?.[1];
      if (hours && minute === '0')
        return t('cron.everyHours', { count: Number(hours) });
      if (NUMBER.test(hour) && NUMBER.test(minute))
        return t('cron.daily', { time: clock(hour, minute) });
    }
    if (NUMBER.test(hour) && NUMBER.test(minute)) {
      const time = clock(hour, minute);
      if (everyDay && weekday === '1-5') return t('cron.weekdays', { time });
      if (everyDay && /^[0-7]$/u.test(weekday))
        return t('cron.weekly', {
          day: weekdayName(Number(weekday), locale),
          time,
        });
      if (NUMBER.test(day) && month === '*' && weekday === '*')
        return t('cron.monthly', { day: Number(day), time });
    }
  }
  return cron;
}

function sameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

/**
 * A moment in the reader's time zone, as short as it can be: the time alone today, the date and time this year, the
 * full date otherwise. `seconds` adds seconds, for run times.
 */
export function formatTime(
  iso: string | undefined,
  locale: string,
  now: Date = new Date(),
  seconds = false,
): string | undefined {
  if (!iso) return undefined;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return undefined;
  const time: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(seconds ? { second: '2-digit' } : {}),
  };
  const options: Intl.DateTimeFormatOptions = sameDay(value, now)
    ? time
    : value.getFullYear() === now.getFullYear()
      ? { month: 'short', day: 'numeric', ...time }
      : { year: 'numeric', month: 'short', day: 'numeric', ...time };
  return new Intl.DateTimeFormat(locale || 'en-US', options).format(value);
}

/** The full date and time, for a tooltip or a detail. */
export function formatFullTime(
  iso: string | undefined,
  locale: string,
): string | undefined {
  if (!iso) return undefined;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return undefined;
  return new Intl.DateTimeFormat(locale || 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(value);
}

/** A duration in its largest whole unit, such as “12 ms”, “4.2 sec” or “3 hr”. */
export function formatDuration(
  milliseconds: number,
  locale: string,
): string | undefined {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return undefined;
  const units = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
    ['second', 1000],
  ] as const;
  for (const [unit, size] of units) {
    if (milliseconds >= size)
      return new Intl.NumberFormat(locale || 'en-US', {
        style: 'unit',
        unit,
        unitDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(milliseconds / size);
  }
  return new Intl.NumberFormat(locale || 'en-US', {
    style: 'unit',
    unit: 'millisecond',
    unitDisplay: 'short',
  }).format(milliseconds);
}

/** The UTC offset of a time zone at `at`, such as `UTC+8`; nothing when the zone is unknown. */
export function utcOffset(timeZone: string, at: Date = new Date()): string {
  try {
    const name = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value;
    return name ? name.replace(/^GMT/u, 'UTC').replace(/^UTC$/u, 'UTC±0') : '';
  } catch {
    return '';
  }
}
