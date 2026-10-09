export const NAMESPACE = '@nocobase/app-plugin-lifecycle-example';

export function dateTime(value: unknown, language: string): string {
  const date = new Date(typeof value === 'string' ? value : '');
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

/** "3 分钟前" style, for list rows. */
export function ago(
  value: unknown,
  language: string,
  now: number = Date.now(),
): string {
  const time = Date.parse(typeof value === 'string' ? value : '');
  if (Number.isNaN(time)) return '';
  const seconds = Math.round((time - now) / 1000);
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return format.format(seconds, 'second');
  if (Math.abs(seconds) < 3600)
    return format.format(Math.round(seconds / 60), 'minute');
  if (Math.abs(seconds) < 86_400)
    return format.format(Math.round(seconds / 3600), 'hour');
  return format.format(Math.round(seconds / 86_400), 'day');
}

/** mm:ss until `deadline`, or null once it has passed. */
export function countdown(deadline: number, now: number): string | null {
  const left = Math.ceil((deadline - now) / 1000);
  if (left <= 0) return null;
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}
