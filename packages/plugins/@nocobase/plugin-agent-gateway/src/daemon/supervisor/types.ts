/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunDaemonOnceOptions } from '../execution/executeClaim';

export type DaemonLoopErrorSource = 'claim' | 'node-heartbeat';

export interface DaemonLoopErrorState {
  source: DaemonLoopErrorSource;
  failureCount: number;
  retryDelayMs: number;
}

export interface DaemonRunLoopOptions extends RunDaemonOnceOptions {
  pollIntervalMs?: number;
  nodeHeartbeatIntervalMs?: number;
  profileRefreshIntervalMs?: number;
  retryInitialDelayMs?: number;
  retryMaxDelayMs?: number;
  onLoopError?: (error: unknown, state: DaemonLoopErrorState) => void;
}
