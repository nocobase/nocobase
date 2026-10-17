/** Translate only structured quota evidence; never infer reset times from prose. */
import type { QuotaReport, QuotaWindow } from '@nocobase/agent-protocol';
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
const reset = (value: unknown): string | null =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value > 0 &&
  value < 8640000000000
    ? new Date(value * 1000).toISOString()
    : null;
export function claudeQuota(
  value: unknown,
  model?: string,
): QuotaReport | undefined {
  const info = object(value);
  const name = info.rateLimitType;
  if (typeof name !== 'string') return undefined;
  const family =
    name === 'seven_day_opus'
      ? 'opus'
      : name === 'seven_day_sonnet'
        ? 'sonnet'
        : undefined;
  if (family && !model?.includes(family)) return undefined;
  if (
    !family &&
    ![
      'five_hour',
      'seven_day',
      'seven_day_overage_included',
      'overage',
    ].includes(name)
  )
    return undefined;
  return {
    windows: [
      {
        window: name,
        scope: family ? 'model' : 'tool',
        target: family ? model! : '',
        resetsAt: reset(info.resetsAt),
        exhausted:
          info.status === 'rejected' &&
          info.overageStatus !== 'allowed' &&
          info.overageStatus !== 'allowed_warning',
        ...(typeof info.utilization === 'number'
          ? { usedPercent: Math.min(100, Math.max(0, info.utilization * 100)) }
          : {}),
      },
    ],
  };
}
export function codexQuota(
  value: unknown,
  exhausted = false,
): QuotaReport | undefined {
  const limits = object(value);
  const windows: QuotaWindow[] = [];
  for (const key of ['primary', 'secondary']) {
    const item = object(limits[key]);
    if (
      typeof item.usedPercent !== 'number' ||
      !Number.isFinite(item.usedPercent)
    )
      continue;
    windows.push({
      window:
        typeof item.windowDurationMins === 'number'
          ? `${item.windowDurationMins}m`
          : key,
      scope: 'tool',
      target: '',
      resetsAt: reset(item.resetsAt),
      usedPercent: Math.min(100, Math.max(0, item.usedPercent)),
      exhausted: exhausted && item.usedPercent >= 100,
    });
  }
  if (exhausted && !windows.some((window) => window.exhausted))
    windows.push({
      window: 'account',
      scope: 'tool',
      target: '',
      resetsAt: null,
      exhausted: true,
    });
  return windows.length ? { windows } : undefined;
}
