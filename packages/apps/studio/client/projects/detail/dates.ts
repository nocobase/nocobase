/** A calendar date (`YYYY-MM-DD`) in the interface language, or "—". */
export function formatDateOnly(value: string | null, locale: string): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(year, month - 1, day),
  );
}
