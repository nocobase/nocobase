export interface DailyMetrics {
  date: string;
  count: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spendCents: number;
  revenueCents: number;
}
export interface DailyReport {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spendCents: number;
  revenueCents: number;
  profitCents: number;
}
export function resolveReportDate(
  value: unknown,
  now: Date = new Date(),
): string {
  if (value !== 'previous-day') return requireDate(value);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const previous = new Date(`${today}T00:00:00.000Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().slice(0, 10);
}

export function requireDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error('Report date must use YYYY-MM-DD.');
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    throw new Error('Report date is not a calendar date.');
  return value;
}
export function requireCount(value: unknown): number {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0)
    throw new Error('Metrics must be non-negative safe integers.');
  return number;
}
