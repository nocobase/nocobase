/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AgentGatewayDaemonNodeClient } from '../gateway';
import type { PendingControlRequest, RunLease } from '../types';
import { interruptTmuxSession, terminateTmuxSession, TMUX_TERMINATE_CANCEL_REASON } from '../tmuxTerminal';
import { delay } from '../supervisor/shutdown';

export interface ControlRequestLoopOptions {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  sessionName: string | null;
  cancelController: AbortController;
  intervalMs: number;
}

type ControlRequestAckValues = {
  resultMessage?: string;
  metadataJson?: {
    action: PendingControlRequest['action'];
    duplicateSignalSkipped?: boolean;
  };
};

export interface ControlRequestLoopHandle {
  wake(): void;
  stop(): Promise<void>;
}

export function controlRequestWhileRunPhase(options: ControlRequestLoopOptions): ControlRequestLoopHandle {
  let inFlight: Promise<void> | null = null;
  let wakePending = false;
  let stopped = false;
  const handledRequestIds = new Set<string>();
  const deliveredRequestIds = new Set<string>();
  const finalAckByRequestId = new Map<
    string,
    {
      status: 'succeeded' | 'failed';
      values: ControlRequestAckValues;
    }
  >();

  const ackControlRequest = async (
    requestId: string,
    status: 'delivered' | 'succeeded' | 'failed',
    values: ControlRequestAckValues = {},
  ) => {
    try {
      await options.gateway.ackControlRequest(options.getLease(), requestId, status, values);
    } catch {
      await delay(Math.min(options.intervalMs, 250));
      await options.gateway.ackControlRequest(options.getLease(), requestId, status, values);
    }
  };

  const ackFinalControlRequest = async (
    requestId: string,
    finalAck: {
      status: 'succeeded' | 'failed';
      values: ControlRequestAckValues;
    },
  ) => {
    await ackControlRequest(requestId, finalAck.status, finalAck.values);
    finalAckByRequestId.delete(requestId);
    handledRequestIds.add(requestId);
  };

  const drainFinalAcks = async () => {
    for (let attempt = 0; attempt < 3 && finalAckByRequestId.size > 0; attempt += 1) {
      for (const [requestId, finalAck] of Array.from(finalAckByRequestId.entries())) {
        try {
          await ackFinalControlRequest(requestId, finalAck);
        } catch {
          // The run is exiting; keep drain bounded and let the server-side
          // delivered state show that the control reached the daemon.
        }
      }
      if (finalAckByRequestId.size > 0) {
        await delay(Math.min(options.intervalMs, 250));
      }
    }
  };

  const handleRequest = async (request: PendingControlRequest) => {
    if (handledRequestIds.has(request.id)) {
      return;
    }
    const cachedFinalAck = finalAckByRequestId.get(request.id);
    if (cachedFinalAck) {
      await ackFinalControlRequest(request.id, cachedFinalAck);
      return;
    }
    if (request.status === 'delivered' && !deliveredRequestIds.has(request.id)) {
      const finalAck = {
        status: 'failed' as const,
        values: {
          resultMessage: 'Control request was already delivered before this daemon instance; duplicate signal skipped',
          metadataJson: {
            action: request.action,
            duplicateSignalSkipped: true,
          },
        },
      };
      finalAckByRequestId.set(request.id, finalAck);
      await ackFinalControlRequest(request.id, finalAck);
      return;
    }
    if (request.status !== 'delivered' && !deliveredRequestIds.has(request.id)) {
      await ackControlRequest(request.id, 'delivered', {
        metadataJson: {
          action: request.action,
        },
      });
      deliveredRequestIds.add(request.id);
    }

    let finalAck: {
      status: 'succeeded' | 'failed';
      values: ControlRequestAckValues;
    };
    try {
      if (request.action === 'interrupt') {
        if (!options.sessionName) {
          throw new Error('No managed tmux session is available for interrupt');
        }
        await interruptTmuxSession(options.sessionName);
      } else if (request.action === 'terminate') {
        if (!options.sessionName) {
          throw new Error('No managed tmux session is available for terminate');
        }
        options.cancelController.abort(TMUX_TERMINATE_CANCEL_REASON);
        await terminateTmuxSession(options.sessionName);
      } else {
        throw new Error(`Unsupported control request action: ${String(request.action)}`);
      }
      finalAck = {
        status: 'succeeded',
        values: {
          metadataJson: {
            action: request.action,
          },
        },
      };
    } catch (error) {
      finalAck = {
        status: 'failed',
        values: {
          resultMessage: error instanceof Error ? error.message : String(error),
          metadataJson: {
            action: request.action,
          },
        },
      };
    }
    finalAckByRequestId.set(request.id, finalAck);
    await ackFinalControlRequest(request.id, finalAck);
  };

  const poll = () => {
    if (stopped) {
      return;
    }
    if (inFlight) {
      wakePending = true;
      return;
    }
    inFlight = options.gateway
      .listPendingControlRequests(options.getLease())
      .then(async (result) => {
        for (const request of result.requests || []) {
          await handleRequest(request);
        }
      })
      .catch(() => {
        // Control polling is best-effort. Heartbeat remains the authoritative
        // lease-lost detector for the run.
      })
      .finally(() => {
        inFlight = null;
        if (wakePending) {
          wakePending = false;
          poll();
        }
      });
  };

  poll();
  const timer = setInterval(poll, options.intervalMs);
  return {
    wake: poll,
    async stop() {
      stopped = true;
      wakePending = false;
      clearInterval(timer);
      await inFlight;
      await drainFinalAcks();
    },
  };
}
