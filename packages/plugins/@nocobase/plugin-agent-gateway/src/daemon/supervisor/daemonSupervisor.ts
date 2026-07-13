/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createCachedProfileDetector, detectAgentProfiles, getDetectedProfilesHash } from '../profileDetection';
import { claimAndExecuteOnce, type DaemonRunOnceResult, type RunDaemonOnceOptions } from '../execution/executeClaim';
import { runClaimLoop } from './claimLoop';
import { createNodeHeartbeatLoop } from './nodeHeartbeatLoop';
import type { DaemonRunLoopOptions } from './types';

const DEFAULT_LOOP_RETRY_INITIAL_DELAY_MS = 1000;
const DEFAULT_LOOP_RETRY_MAX_DELAY_MS = 30_000;

export async function runDaemonOnce(options: RunDaemonOnceOptions): Promise<DaemonRunOnceResult> {
  const profiles = options.detectProfiles
    ? await options.detectProfiles(options.stopSignal)
    : await detectAgentProfiles({ ...options.detectOptions, signal: options.stopSignal });
  await options.gateway.heartbeatNode({
    profiles,
    profilesHash: getDetectedProfilesHash(profiles),
    includeNodeSnapshot: true,
  });
  return await claimAndExecuteOnce(options);
}

export async function runDaemonLoop(options: DaemonRunLoopOptions) {
  const pollIntervalMs = options.pollIntervalMs || 10_000;
  const nodeHeartbeatIntervalMs = options.nodeHeartbeatIntervalMs || 30_000;
  const retryInitialDelayMs = options.retryInitialDelayMs || DEFAULT_LOOP_RETRY_INITIAL_DELAY_MS;
  const retryMaxDelayMs = options.retryMaxDelayMs || DEFAULT_LOOP_RETRY_MAX_DELAY_MS;
  const detectProfiles =
    options.detectProfiles ||
    createCachedProfileDetector({
      ...options.detectOptions,
      refreshIntervalMs: options.profileRefreshIntervalMs,
    });
  let currentConcurrency = 0;
  const heartbeatLoop = createNodeHeartbeatLoop({
    gateway: options.gateway,
    detectProfiles,
    getCurrentConcurrency: () => currentConcurrency,
    intervalMs: nodeHeartbeatIntervalMs,
    retryInitialDelayMs,
    retryMaxDelayMs,
    stopSignal: options.stopSignal,
    onLoopError: options.onLoopError,
  });

  await heartbeatLoop.sendInitial();
  const heartbeatPromise = heartbeatLoop.run();
  try {
    await runClaimLoop({
      claimAndExecute: async () => {
        return await claimAndExecuteOnce(
          {
            ...options,
            detectProfiles,
          },
          (active) => {
            currentConcurrency = active ? 1 : 0;
          },
        );
      },
      pollIntervalMs,
      retryInitialDelayMs,
      retryMaxDelayMs,
      stopSignal: options.stopSignal,
      onLoopError: options.onLoopError,
    });
  } finally {
    await heartbeatPromise;
  }
}
