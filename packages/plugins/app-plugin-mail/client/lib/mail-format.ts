/** A date and time in the reader's locale, or a dash when there is none. */
export function formatMailDateTime(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

/** The start of a time window ending now, as an RFC 3339 time, or undefined for every time. */
export function mailWindowStart(
  window: MailTimeWindow,
  now: number = Date.now(),
): string | undefined {
  const hours = { day: 24, week: 24 * 7, month: 24 * 30, all: 0 }[window];
  return hours ? new Date(now - hours * 60 * 60_000).toISOString() : undefined;
}

export type MailTimeWindow = 'day' | 'week' | 'month' | 'all';

export const MAIL_TIME_WINDOWS: readonly MailTimeWindow[] = [
  'day',
  'week',
  'month',
  'all',
];
