import { useLocale } from '@nocobase/i18n/client';
import { useMemo } from 'react';

export interface Formatters {
  /** Date and time in the current language, or "—" for an empty value. */
  readonly dateTime: (iso: string | null | undefined) => string;
  /** Time of day only, for transcript rows. */
  readonly time: (iso: string | null | undefined) => string;
  /** "3 minutes ago" in the current language, or "—". */
  readonly relative: (iso: string | null | undefined) => string;
}

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formatters that follow the interface language. */
export function useFormatters(): Formatters {
  const { locale } = useLocale();
  return useMemo(() => {
    const dateTime = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const time = new Intl.DateTimeFormat(locale, { timeStyle: 'medium' });
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return {
      dateTime: (iso) => {
        const date = parse(iso);
        return date ? dateTime.format(date) : '—';
      },
      time: (iso) => {
        const date = parse(iso);
        return date ? time.format(date) : '—';
      },
      relative: (iso) => {
        const date = parse(iso);
        if (!date) return '—';
        const seconds = Math.round((date.getTime() - Date.now()) / 1000);
        for (const [unit, size] of UNITS)
          if (Math.abs(seconds) >= size || unit === 'second')
            return relative.format(Math.round(seconds / size), unit);
        return '—';
      },
    };
  }, [locale]);
}

/** "1m 05s" between two instants, or null when either is missing. */
export function durationText(
  from: string | null | undefined,
  to: string | null | undefined,
): string | null {
  const start = parse(from);
  const end = parse(to);
  if (!start || !end) return null;
  const total = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 1000),
  );
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

/** Splits "a, b  c" into distinct trimmed labels, in order. */
export function parseList(text: string): string[] {
  const seen = new Set<string>();
  for (const part of text.split(/[\s,]+/u)) {
    const value = part.trim();
    if (value) seen.add(value);
  }
  return [...seen];
}
