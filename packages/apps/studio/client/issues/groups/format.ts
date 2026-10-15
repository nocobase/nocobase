/** When a task last changed: the time today, else the date. */
export function shortTime(
  at: string,
  locale: string,
  now = Date.now(),
): string {
  const date = new Date(at);
  const today = new Date(now);
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date)
    : new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
      }).format(date);
}
