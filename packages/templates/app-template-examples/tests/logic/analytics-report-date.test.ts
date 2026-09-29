import { expect, it } from 'vitest';
import { resolveReportDate } from '../../workflows/example-analytics-report/server/metrics.js';

it.each([
  ['2026-09-16T15:59:59Z', '2026-09-15'],
  ['2026-09-16T16:00:00Z', '2026-09-16'],
  ['2026-01-01T00:00:00Z', '2025-12-31'],
  ['2024-03-01T00:00:00Z', '2024-02-29'],
])('resolves the previous Singapore date at %s', (now, expected) => {
  expect(resolveReportDate('previous-day', new Date(now))).toBe(expected);
});

it('preserves explicit dates and rejects invalid dates', () => {
  expect(resolveReportDate('2026-09-08')).toBe('2026-09-08');
  expect(() => resolveReportDate('2026-02-30')).toThrow();
});
