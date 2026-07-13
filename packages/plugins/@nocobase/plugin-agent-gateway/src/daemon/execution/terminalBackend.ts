/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { TerminalEnd } from '../../shared/terminalStreamProtocol';
import type { ExecTerminalStatus } from '../execDriver';
import type { AgentGatewayDaemonNodeClient } from '../gateway';
import type { RunLease } from '../types';
import { TerminalRingBuffer } from '../terminalRingBuffer';
import { DaemonTerminalStreamClient, type DaemonTerminalStreamClientOptions } from '../terminalStreamClient';
import { getManagedTmuxSessionName } from '../tmuxTerminal';

export interface TerminalStreamHandle {
  start(): Promise<void>;
  appendText(text: string): Promise<void>;
  end(reason: TerminalEnd['reason']): Promise<boolean>;
  close(): void;
}

interface TerminalRunOptions {
  gateway: AgentGatewayDaemonNodeClient;
  terminalRingBufferMaxBytes?: number;
  terminalStreamClientFactory?: (options: DaemonTerminalStreamClientOptions) => TerminalStreamHandle;
}

export async function closeTmuxTerminalQuietly(
  options: { gateway: AgentGatewayDaemonNodeClient },
  lease: RunLease,
  runId: string,
  exitCode: number | null,
) {
  try {
    await options.gateway.updateRunTerminal(lease, {
      terminalBackend: 'tmux',
      terminalSessionName: getManagedTmuxSessionName(runId),
      terminalStatus: 'closed',
      terminalEndedAt: new Date().toISOString(),
      terminalExitCode: exitCode,
    });
  } catch {
    // Terminal metadata is observational; run terminalization remains authoritative.
  }
}

function createTerminalStreamHandle(options: DaemonTerminalStreamClientOptions): TerminalStreamHandle {
  const client = new DaemonTerminalStreamClient(options);
  return {
    start: async () => {
      await client.start();
    },
    appendText: async (text) => {
      await client.appendText(text);
    },
    end: async (reason) => {
      return await client.end(reason);
    },
    close: () => {
      client.close();
    },
  };
}

export function createRunTerminalStream(options: {
  runOptions: TerminalRunOptions;
  runId: string;
  sessionName: string;
  getLease(): RunLease;
}) {
  const ringBuffer = new TerminalRingBuffer({
    runId: options.runId,
    sessionName: options.sessionName,
    maxBytes: options.runOptions.terminalRingBufferMaxBytes,
  });
  const factory = options.runOptions.terminalStreamClientFactory || createTerminalStreamHandle;
  return factory({
    serverUrl: options.runOptions.gateway.serverUrl,
    nodeId: options.runOptions.gateway.nodeId,
    nodeToken: options.runOptions.gateway.nodeToken,
    runId: options.runId,
    sessionName: options.sessionName,
    ringBuffer,
    getLease: options.getLease,
  });
}

export function toTerminalEndReason(status: ExecTerminalStatus): TerminalEnd['reason'] {
  if (status === 'succeeded') {
    return 'completed';
  }
  if (status === 'lease_lost') {
    return 'disconnected';
  }
  return status;
}
