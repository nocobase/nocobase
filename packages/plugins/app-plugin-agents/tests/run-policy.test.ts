import { describe, expect, it } from 'vitest';
import { retryBaseDelayMs, retryDelayMs } from '../server/core/runs/policy.js';
import {
  SWEEP_INTERVAL_MS,
  sweepIntervalMs,
} from '../server/providers/runners.js';

describe('configurable run timings', () => {
  it('backs off from the configured base, doubling up to ten minutes', () => {
    expect(retryBaseDelayMs(undefined)).toBe(30_000);
    expect(retryBaseDelayMs(0)).toBe(0);
    expect(retryDelayMs('toolNetwork', 1)).toBe(30_000);
    expect(retryDelayMs('toolNetwork', 3, 500)).toBe(2_000);
    expect(retryDelayMs('toolNetwork', 30, 500)).toBe(600_000);
    expect(retryDelayMs('runnerOffline', 3, 500)).toBe(0);
    for (const value of [-1, 1.5, '1000', null])
      expect(() => retryBaseDelayMs(value)).toThrow('retryBaseDelayMs');
  });

  it('sweeps every 30 seconds unless configured', () => {
    expect(sweepIntervalMs(undefined)).toBe(SWEEP_INTERVAL_MS);
    expect(sweepIntervalMs(1_000)).toBe(1_000);
    for (const value of [0, -1, 1.5, '1000', null])
      expect(() => sweepIntervalMs(value)).toThrow('sweepIntervalMs');
  });
});
