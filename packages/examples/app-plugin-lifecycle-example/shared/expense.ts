/** One line of an expense report. Amounts are cents, so totals add up exactly. */
export interface ExpenseItem {
  readonly date: string;
  readonly category: string;
  readonly description: string;
  readonly amountCents: number;
}

/** Category keys; the pages translate them. */
export const EXPENSE_CATEGORIES: readonly string[] = [
  'transport',
  'lodging',
  'meals',
  'office',
  'entertainment',
  'other',
];

export function totalCents(items: readonly ExpenseItem[]): number {
  return items.reduce((sum, item) => sum + item.amountCents, 0);
}

export function yuan(cents: number): string {
  return `¥${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` that names a real day: `2026-02-31` is refused, not moved to March. */
export function isCalendarDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value
  );
}

/** What is wrong with a report's items; empty when it may be submitted. */
export function itemProblems(items: readonly ExpenseItem[]): string[] {
  if (!items.length) return ['Add at least one expense line.'];
  const problems: string[] = [];
  items.forEach((item, index) => {
    const line = `Line ${index + 1}`;
    if (!isCalendarDate(item.date))
      problems.push(`${line}: the date is invalid.`);
    if (!EXPENSE_CATEGORIES.includes(item.category))
      problems.push(`${line}: choose a category.`);
    if (!item.description.trim())
      problems.push(`${line}: describe the expense.`);
    if (!Number.isSafeInteger(item.amountCents) || item.amountCents <= 0)
      problems.push(`${line}: the amount must be more than 0.`);
  });
  return problems;
}

/** A JSON text if it parses, else nothing: a malformed column or request is not a crash. */
function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

/** Items as they arrive from a form or a JSON column, with anything malformed dropped. */
export function parseItems(value: unknown): ExpenseItem[] {
  const source: unknown =
    typeof value === 'string' && value.startsWith('[')
      ? parseJson(value)
      : value;
  if (!Array.isArray(source)) return [];
  return source
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null,
    )
    .map((item) => ({
      date: typeof item.date === 'string' ? item.date : '',
      category: typeof item.category === 'string' ? item.category : '',
      description: typeof item.description === 'string' ? item.description : '',
      amountCents: Math.round(Number(item.amountCents) || 0),
    }));
}
