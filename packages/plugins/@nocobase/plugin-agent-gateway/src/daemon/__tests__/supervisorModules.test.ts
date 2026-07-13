/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { runClaimLoop } from '../supervisor/claimLoop';
import { getExponentialBackoffDelay } from '../supervisor/shutdown';

describe('daemon supervisor modules', () => {
  it('caps exponential retry backoff', () => {
    expect([1, 2, 3, 4, 5].map((failureCount) => getExponentialBackoffDelay(failureCount, 10, 40))).toEqual([
      10, 20, 40, 40, 40,
    ]);
  });

  it('reports claim backoff and exits promptly on shutdown', async () => {
    const controller = new AbortController();
    const failures: Array<{ failureCount: number; retryDelayMs: number }> = [];
    let attempts = 0;

    await runClaimLoop({
      claimAndExecute: async () => {
        attempts += 1;
        if (attempts <= 2) {
          throw new Error(`temporary-${attempts}`);
        }
        controller.abort();
        return {
          status: 'idle',
        };
      },
      pollIntervalMs: 1000,
      retryInitialDelayMs: 1,
      retryMaxDelayMs: 2,
      stopSignal: controller.signal,
      onLoopError: (_error, state) => {
        failures.push({
          failureCount: state.failureCount,
          retryDelayMs: state.retryDelayMs,
        });
      },
    });

    expect(attempts).toBe(3);
    expect(failures).toEqual([
      { failureCount: 1, retryDelayMs: 1 },
      { failureCount: 2, retryDelayMs: 2 },
    ]);
  });
});
