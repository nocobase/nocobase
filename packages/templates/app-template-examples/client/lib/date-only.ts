import { format, isValid, parseISO } from 'date-fns';

/** Reads a calendar date sent as `'yyyy-MM-dd'` as local midnight, so no time zone moves it to another day. */
export function parseDateOnly(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

/** Writes a picked calendar date as `'yyyy-MM-dd'` in local time; `toISOString()` would shift it east of UTC. */
export function formatDateOnly(date: Date | undefined): string {
  return date ? format(date, 'yyyy-MM-dd') : '';
}
