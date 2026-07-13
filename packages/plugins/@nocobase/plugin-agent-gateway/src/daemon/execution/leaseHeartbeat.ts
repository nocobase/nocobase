/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isAgentGatewayLeaseLostError, isAgentGatewayRetryableError } from '../apiClient';
import type { AgentGatewayDaemonNodeClient } from '../gateway';
import { getLocalRunLeaseDeadlineMonotonicMs, getMonotonicTimeMs } from '../leaseDeadline';
import type { RunLease } from '../types';
import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../../shared/runControl';
import { TMUX_TERMINATE_CANCEL_REASON } from '../tmuxTerminal';
import { delay } from '../supervisor/shutdown';

const DEFAULT_RUN_HEARTBEAT_RETRY_DELAY_MS = 250;

export type RunHeartbeatStatus = 'syncing_skills' | 'running' | 'finalizing';

export function abortForRunCancel(cancelController: AbortController, lease: RunLease) {
  cancelController.abort(
    lease.cancelReason === AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON ? TMUX_TERMINATE_CANCEL_REASON : undefined,
  );
}

export function forwardAbortSignal(signal: AbortSignal | undefined, controller: AbortController) {
  if (!signal) {
    return () => {};
  }
  const abort = () => {
    controller.abort(signal.reason);
  };
  if (signal.aborted) {
    abort();
    return () => {};
  }
  signal.addEventListener('abort', abort, { once: true });
  return () => {
    signal.removeEventListener('abort', abort);
  };
}

export function throwIfSignalAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }
  if (signal.reason instanceof Error) {
    throw signal.reason;
  }
  const error = new Error('Run phase aborted');
  error.name = 'AbortError';
  throw error;
}

export async function heartbeatRunWithRetry(
  gateway: AgentGatewayDaemonNodeClient,
  lease: RunLease,
  status: RunHeartbeatStatus,
  signal?: AbortSignal,
) {
  const leaseDeadlineMs = getLocalRunLeaseDeadlineMonotonicMs(lease);
  for (;;) {
    throwIfSignalAborted(signal);
    try {
      return await gateway.heartbeatRun(lease, status);
    } catch (error) {
      const remainingMs = leaseDeadlineMs - getMonotonicTimeMs();
      if (isAgentGatewayLeaseLostError(error) || !isAgentGatewayRetryableError(error) || remainingMs <= 0) {
        throw error;
      }
      await delay(Math.min(DEFAULT_RUN_HEARTBEAT_RETRY_DELAY_MS, remainingMs), signal);
    }
  }
}

export function heartbeatWhileRunPhase(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  status: RunHeartbeatStatus | (() => RunHeartbeatStatus);
  cancelController: AbortController;
  leaseLostController: AbortController;
  intervalMs: number;
}) {
  let inFlight: Promise<void> | null = null;
  let stopped = false;
  let leaseDeadlineMs = getLocalRunLeaseDeadlineMonotonicMs(options.getLease());
  let leaseDeadlineTimer: ReturnType<typeof setTimeout> | null = null;
  const abortForLeaseLoss = () => {
    if (!options.leaseLostController.signal.aborted) {
      options.leaseLostController.abort();
    }
  };
  const scheduleLeaseDeadline = (lease: RunLease) => {
    leaseDeadlineMs = getLocalRunLeaseDeadlineMonotonicMs(lease);
    if (leaseDeadlineTimer) {
      clearTimeout(leaseDeadlineTimer);
    }
    const remainingMs = leaseDeadlineMs - getMonotonicTimeMs();
    if (remainingMs <= 0) {
      abortForLeaseLoss();
      return;
    }
    leaseDeadlineTimer = setTimeout(abortForLeaseLoss, remainingMs);
  };
  scheduleLeaseDeadline(options.getLease());
  const sendHeartbeat = () => {
    if (stopped || inFlight || options.leaseLostController.signal.aborted) {
      return;
    }
    inFlight = options.gateway
      .heartbeatRun(options.getLease(), typeof options.status === 'function' ? options.status() : options.status)
      .then((lease) => {
        const nextLease = {
          ...options.getLease(),
          ...lease,
        };
        options.setLease(nextLease);
        if (!stopped) {
          scheduleLeaseDeadline(nextLease);
        }
        if (lease.cancelRequested) {
          abortForRunCancel(options.cancelController, lease);
        }
      })
      .catch((error) => {
        if (
          isAgentGatewayLeaseLostError(error) ||
          !isAgentGatewayRetryableError(error) ||
          getMonotonicTimeMs() >= leaseDeadlineMs
        ) {
          abortForLeaseLoss();
        }
      })
      .finally(() => {
        inFlight = null;
      });
  };
  const timer = setInterval(sendHeartbeat, options.intervalMs);
  return async () => {
    stopped = true;
    clearInterval(timer);
    await inFlight;
    if (leaseDeadlineTimer) {
      clearTimeout(leaseDeadlineTimer);
    }
  };
}

export async function refreshRunLeaseBeforeTerminal(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
}) {
  const leaseDeadlineMs = getLocalRunLeaseDeadlineMonotonicMs(options.getLease());
  for (;;) {
    try {
      const refreshedLease = await options.gateway.heartbeatRun(options.getLease(), 'running');
      options.setLease({
        ...options.getLease(),
        ...refreshedLease,
      });
      if (refreshedLease.cancelRequested) {
        abortForRunCancel(options.cancelController, refreshedLease);
        return 'cancel_requested' as const;
      }
      return 'active' as const;
    } catch (error) {
      const remainingMs = leaseDeadlineMs - getMonotonicTimeMs();
      if (isAgentGatewayLeaseLostError(error) || !isAgentGatewayRetryableError(error) || remainingMs <= 0) {
        options.leaseLostController.abort();
        return 'lease_lost' as const;
      }
      await delay(Math.min(DEFAULT_RUN_HEARTBEAT_RETRY_DELAY_MS, remainingMs));
    }
  }
}

export async function recoverTerminalConflict(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
}) {
  const refreshedLeaseStatus = await refreshRunLeaseBeforeTerminal(options);
  if (refreshedLeaseStatus === 'cancel_requested') {
    await options.gateway.cancelAckRun(options.getLease());
    return 'canceled' as const;
  }
  if (refreshedLeaseStatus === 'lease_lost') {
    return 'lease_lost' as const;
  }
  return null;
}
