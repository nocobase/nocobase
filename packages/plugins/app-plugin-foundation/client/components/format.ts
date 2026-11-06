import type {
  FoundationFactParam,
  FoundationMetric,
  FoundationText,
} from '../../shared/foundation.js';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatMetricValue(
  metric: FoundationMetric,
  locale: string,
): string | undefined {
  if (metric.value === null) return undefined;
  if (metric.unit !== 'bytes') return formatNumber(metric.value, locale);
  let value = metric.value;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${BYTE_UNITS[unit] ?? 'B'}`;
}

export function formatTime(iso: string, locale: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(time);
}

/** The values a fact's wording quotes, formatted for the reader: numbers grouped, lists joined, times localized. */
export function formatFactParams(
  params: Readonly<Record<string, FoundationFactParam>> | undefined,
  locale: string,
  translate: (text: FoundationText) => string,
): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === 'number') formatted[key] = formatNumber(value, locale);
    else if (typeof value === 'string')
      formatted[key] = key === 'at' ? formatTime(value, locale) : value;
    else
      formatted[key] = new Intl.ListFormat(locale, {
        type: 'conjunction',
      }).format(value.map(translate));
  }
  return formatted;
}
