/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AgentProfileDetector } from '../profileDetection';
import type { AgentGatewayDaemonNodeClient } from '../gateway';
import type { DaemonLoopErrorState } from './types';
import { delay, getExponentialBackoffDelay } from './shutdown';
import { getDetectedProfilesHash } from '../profileDetection';

export interface NodeHeartbeatLoopOptions {
  gateway: AgentGatewayDaemonNodeClient;
  detectProfiles: AgentProfileDetector;
  getCurrentConcurrency(): number;
  intervalMs: number;
  retryInitialDelayMs: number;
  retryMaxDelayMs: number;
  stopSignal?: AbortSignal;
  onLoopError?: (error: unknown, state: DaemonLoopErrorState) => void;
}

export function createNodeHeartbeatLoop(options: NodeHeartbeatLoopOptions) {
  let lastProfilesHash = '';
  let nodeSnapshotSent = false;
  let failureCount = 0;

  const send = async () => {
    const profiles = await options.detectProfiles(options.stopSignal);
    const profilesHash = getDetectedProfilesHash(profiles);
    const profilesChanged = profilesHash !== lastProfilesHash;
    await options.gateway.heartbeatNode({
      currentConcurrency: options.getCurrentConcurrency(),
      includeNodeSnapshot: !nodeSnapshotSent,
      ...(profilesChanged ? { profiles, profilesHash } : {}),
    });
    lastProfilesHash = profilesHash;
    nodeSnapshotSent = true;
    failureCount = 0;
  };

  const sendInitial = async () => {
    try {
      await send();
    } catch (error) {
      failureCount = 1;
      options.onLoopError?.(error, {
        source: 'node-heartbeat',
        failureCount,
        retryDelayMs: options.retryInitialDelayMs,
      });
    }
  };

  const run = async () => {
    while (!options.stopSignal?.aborted) {
      await delay(options.intervalMs, options.stopSignal);
      if (options.stopSignal?.aborted) {
        break;
      }
      try {
        await send();
      } catch (error) {
        failureCount += 1;
        const retryDelayMs = getExponentialBackoffDelay(
          failureCount,
          options.retryInitialDelayMs,
          options.retryMaxDelayMs,
        );
        options.onLoopError?.(error, {
          source: 'node-heartbeat',
          failureCount,
          retryDelayMs,
        });
        await delay(Math.min(options.intervalMs, retryDelayMs), options.stopSignal);
      }
    }
  };

  return {
    sendInitial,
    run,
  };
}
