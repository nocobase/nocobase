/** Times and counts in the viewer's language. */
export type DayGroup = 'today' | 'yesterday' | 'week' | 'earlier';

/** Which group of the list a moment falls in, by the viewer's calendar days. */
export function dayGroup(at: string, now: Date = new Date()): DayGroup {
  const day = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((day(now) - day(new Date(at))) / 86_400_000);
  return days <= 0
    ? 'today'
    : days === 1
      ? 'yesterday'
      : days < 7
        ? 'week'
        : 'earlier';
}

/** A time of day today, a weekday this week, a date before. */
export function shortTime(
  at: string,
  locale: string,
  now: Date = new Date(),
): string {
  const date = new Date(at);
  const group = dayGroup(at, now);
  const options: Intl.DateTimeFormatOptions =
    group === 'today' || group === 'yesterday'
      ? { hour: '2-digit', minute: '2-digit' }
      : group === 'week'
        ? { weekday: 'short', hour: '2-digit', minute: '2-digit' }
        : { month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/** `12,480`, or `475k` and `1.2M` where the exact number does not matter. */
export function tokens(count: number, locale: string, compact = false): string {
  return new Intl.NumberFormat(
    locale,
    compact ? { notation: 'compact', maximumFractionDigits: 1 } : {},
  ).format(count);
}

/** A computer's system as people know it, with its processor: `macOS · arm64`. */
export function systemName(computer: {
  readonly platform: string;
  readonly arch: string;
}): string {
  const names: Readonly<Record<string, string>> = {
    darwin: 'macOS',
    linux: 'Linux',
    win32: 'Windows',
  };
  return `${names[computer.platform] ?? computer.platform} · ${computer.arch}`;
}

/** A moment with its date and time of day: `Oct 12, 22:45`. */
export function dateTime(at: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(at));
}

/** A time of day: `22:45`. */
export function clockTime(at: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(at));
}
