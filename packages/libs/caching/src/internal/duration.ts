import type { CacheTtlConfig } from '../types.js';

const units: Readonly<Record<string, number>> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Resolve a positive duration to safe integer milliseconds, rounding up. */
export function resolveTtlConfig(
  value: CacheTtlConfig | undefined,
  name: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    assertResolvedTtl(value, name);
    return Math.ceil(value);
  }

  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)$/i);
  if (!match) {
    throw new Error(
      `${name} must be a positive duration such as "500ms", "30s", "5m", "1h", or "1d".`,
    );
  }
  const amount = Number(match[1]);
  const multiplier = units[match[2].toLowerCase()];
  const ttl = amount * multiplier;
  assertResolvedTtl(ttl, name);
  return Math.ceil(ttl);
}

function assertResolvedTtl(value: number, name: string): void {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    !Number.isSafeInteger(Math.ceil(value))
  ) {
    throw new Error(
      `${name} must resolve to a positive number of milliseconds.`,
    );
  }
}
