/** How a run's reason and result summary read on the page. */
type Translate = (key: string, options?: Record<string, unknown>) => string;

/** The reason in the reader's language with its code after it, or the code alone when the page does not know it. */
export function reasonText(
  t: Translate,
  reason: string | undefined,
): string | undefined {
  if (!reason) return undefined;
  const text = t(`reason.${reason}`, { defaultValue: '' });
  return text ? `${text} (${reason})` : reason;
}

/** A result summary as one line: `key: value` pairs, nested values as JSON. */
export function summaryText(
  summary: Readonly<Record<string, unknown>> | undefined,
): string | undefined {
  if (!summary) return undefined;
  const entries = Object.entries(summary);
  if (entries.length === 0) return undefined;
  return entries
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`,
    )
    .join(' · ');
}
