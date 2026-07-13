/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DaemonRunOnceResult } from '../execution/executeClaim';
import type { DaemonLoopErrorState } from './types';
import { delay, getExponentialBackoffDelay } from './shutdown';

export interface ClaimLoopOptions {
  claimAndExecute(): Promise<DaemonRunOnceResult>;
  pollIntervalMs: number;
  retryInitialDelayMs: number;
  retryMaxDelayMs: number;
  stopSignal?: AbortSignal;
  onLoopError?: (error: unknown, state: DaemonLoopErrorState) => void;
}

export async function runClaimLoop(options: ClaimLoopOptions) {
  let failureCount = 0;
  while (!options.stopSignal?.aborted) {
    try {
      const result = await options.claimAndExecute();
      failureCount = 0;
      if (result.status === 'idle') {
        await delay(options.pollIntervalMs, options.stopSignal);
      }
    } catch (error) {
      failureCount += 1;
      const retryDelayMs = getExponentialBackoffDelay(
        failureCount,
        options.retryInitialDelayMs,
        options.retryMaxDelayMs,
      );
      options.onLoopError?.(error, {
        source: 'claim',
        failureCount,
        retryDelayMs,
      });
      await delay(retryDelayMs, options.stopSignal);
    }
  }
}
