/** Calendar windows, not fixed 24-hour durations: DST days can be shorter or longer. */
export function validDay(value: string): boolean {
  if (!/^20\d{2}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(0);
    return value.length > 0 && value.length <= 100;
  } catch {
    return false;
  }
}

export function localDay(at: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(at);
  const part = (type: string): string => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function shiftDay(day: string, amount: number): string {
  if (!validDay(day) || !Number.isInteger(amount)) throw new Error('Invalid calendar day.');
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function startOfDay(day: string, timezone: string): Date {
  const noon = Date.parse(`${day}T12:00:00Z`);
  let low = noon - 36 * 3_600_000;
  let high = noon + 36 * 3_600_000;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (localDay(new Date(middle), timezone) < day) low = middle + 1;
    else high = middle;
  }
  const start = new Date(low);
  if (localDay(start, timezone) !== day) throw new Error('This calendar day does not exist in the timezone.');
  return start;
}

export function dayWindow(day: string, timezone: string): { start: string; end: string } {
  if (!validDay(day) || !validTimezone(timezone)) throw new Error('Invalid report date or timezone.');
  return {
    start: startOfDay(day, timezone).toISOString(),
    end: startOfDay(shiftDay(day, 1), timezone).toISOString(),
  };
}

/** The schedule is checked every ten minutes; it becomes due at the configured local hour. */
export function dueDay(at: Date, timezone: string, hour: number): string | null {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone, hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const current = Number(parts.find((part) => part.type === 'hour')?.value);
  return current >= hour ? shiftDay(localDay(at, timezone), -1) : null;
}
