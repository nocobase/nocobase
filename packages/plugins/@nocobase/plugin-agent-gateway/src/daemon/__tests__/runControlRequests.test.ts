/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { vi } from 'vitest';

import { AgentGatewayDaemonNodeClient } from '../gateway';
import { runDaemonOnce } from '../runner';
import { ExecDriverResult } from '../execDriver';
import { GatewayRequestOptions, GatewayRequester, JsonRecord } from '../types';
import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../../shared/runControl';
import type { TmuxCommandOptions } from '../tmuxTerminal';

function createSucceededResult(): ExecDriverResult {
  return {
    status: 'succeeded',
    exitCode: 0,
    signal: null,
    stdout: {
      text: 'done',
      sizeBytes: 4,
    },
    stderr: {
      text: '',
      sizeBytes: 0,
    },
  };
}

function createCanceledResult(): ExecDriverResult {
  return {
    status: 'canceled',
    exitCode: null,
    signal: 'SIGTERM',
    stdout: {
      text: '',
      sizeBytes: 0,
    },
    stderr: {
      text: '',
      sizeBytes: 0,
    },
  };
}

const tmuxMocks = vi.hoisted(() => {
  const createResult = (): ExecDriverResult => ({
    status: 'succeeded',
    exitCode: 0,
    signal: null,
    stdout: {
      text: 'done',
      sizeBytes: 4,
    },
    stderr: {
      text: '',
      sizeBytes: 0,
    },
  });

  return {
    interruptTmuxSession: vi.fn(async () => undefined),
    terminateTmuxSession: vi.fn(async () => undefined),
    executeTmuxCommand: vi.fn(async (options: TmuxCommandOptions): Promise<ExecDriverResult> => {
      await options.onSessionStarted?.({
        backend: 'tmux',
        sessionName: 'ag-run-run-control-1',
        startedAt: new Date().toISOString(),
      });
      await new Promise((resolve) => setTimeout(resolve, 80));
      return createResult();
    }),
  };
});

vi.mock('../tmuxTerminal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../tmuxTerminal')>();
  return {
    ...actual,
    executeTmuxCommand: tmuxMocks.executeTmuxCommand,
    interruptTmuxSession: tmuxMocks.interruptTmuxSession,
    terminateTmuxSession: tmuxMocks.terminateTmuxSession,
  };
});

class ControlRequester implements GatewayRequester {
  calls: GatewayRequestOptions[] = [];
  private deliveredAckSucceeded = false;
  private finalAckSucceeded = false;
  private deliveredAckAttempts = 0;
  private finalAckAttempts = 0;
  private heartbeatAttempts = 0;

  constructor(
    private readonly controlAction: 'interrupt' | 'terminate',
    private readonly options: {
      failFirstDeliveredAck?: boolean;
      failFirstFinalAck?: boolean;
      failFinalAckTimes?: number;
      initialStatus?: 'accepted' | 'delivered';
      disablePendingRequests?: boolean;
      heartbeatCancelRequested?: boolean;
      heartbeatCancelReason?: string;
      heartbeatCancelAfterAttempt?: number;
    } = {},
  ) {}

  async request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T> {
    this.calls.push(options);
    if (options.path.endsWith('/runs:claim')) {
      return {
        claimed: true,
        runId: 'run-control-1',
        runCode: 'run-control-1',
        claimToken: 'ag_claim_CONTROL',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-control-1',
          executionPayloadJson: {
            commandKey: 'node',
            args: ['-e', 'console.log("done")'],
            cwd: '.',
          },
        },
      } as T;
    }
    if (options.path.includes('/control-requests:pending')) {
      expect(options.path).not.toContain('claimToken=');
      if (this.finalAckSucceeded || this.options.disablePendingRequests) {
        return {
          requests: [],
        } as T;
      }
      return {
        requests: [
          {
            id: `control-${this.controlAction}-1`,
            runId: 'run-control-1',
            action: this.controlAction,
            status: this.options.initialStatus || (this.deliveredAckSucceeded ? 'delivered' : 'accepted'),
            createdAt: new Date().toISOString(),
          },
        ],
      } as T;
    }
    if (options.path.includes('/control-requests/') && options.path.endsWith(':ack')) {
      const body = options.body as JsonRecord;
      if (body.status === 'delivered') {
        this.deliveredAckAttempts += 1;
        if (this.options.failFirstDeliveredAck && this.deliveredAckAttempts === 1) {
          throw new Error('temporary delivered ack failure');
        }
        this.deliveredAckSucceeded = true;
      }
      if (body.status === 'succeeded' || body.status === 'failed') {
        this.finalAckAttempts += 1;
        const failFinalAckTimes = this.options.failFinalAckTimes ?? (this.options.failFirstFinalAck ? 1 : 0);
        if (this.finalAckAttempts <= failFinalAckTimes) {
          throw new Error('temporary final ack failure');
        }
        this.finalAckSucceeded = true;
      }
    }
    if (options.path.includes('/heartbeat') && options.path.includes('/runs/')) {
      this.heartbeatAttempts += 1;
      const cancelAfterAttempt = this.options.heartbeatCancelAfterAttempt || 1;
      const cancelRequested =
        Boolean(this.options.heartbeatCancelRequested) && this.heartbeatAttempts >= cancelAfterAttempt;
      return {
        runId: 'run-control-1',
        claimToken: 'ag_claim_CONTROL',
        claimAttempt: 1,
        leaseVersion: 1,
        cancelRequested,
        ...(cancelRequested && this.options.heartbeatCancelReason
          ? { cancelReason: this.options.heartbeatCancelReason }
          : {}),
      } as T;
    }
    return {
      ok: true,
    } as T;
  }
}

describe('agent gateway daemon control requests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-daemon-control-'));
    tmuxMocks.interruptTmuxSession.mockClear();
    tmuxMocks.terminateTmuxSession.mockClear();
    tmuxMocks.executeTmuxCommand.mockClear();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function runWithControl(
    controlAction: 'interrupt' | 'terminate',
    requesterOptions: {
      failFirstDeliveredAck?: boolean;
      failFirstFinalAck?: boolean;
      failFinalAckTimes?: number;
      initialStatus?: 'accepted' | 'delivered';
      disablePendingRequests?: boolean;
      heartbeatCancelRequested?: boolean;
      heartbeatCancelReason?: string;
      heartbeatCancelAfterAttempt?: number;
    } = {},
  ) {
    const requester = new ControlRequester(controlAction, requesterOptions);
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-control-1',
      nodeKey: 'node-control-1',
      nodeToken: 'ag_node_CONTROL',
      savedAt: new Date().toISOString(),
    });
    await fs.mkdir(path.join(tempDir, 'workspace'), { recursive: true });
    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: path.join(tempDir, 'workspace'),
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      claimProfileKey: 'codex',
      runHeartbeatIntervalMs: 20,
      terminalBackend: 'tmux',
      detectOptions: {
        probeCommand: async () => ({
          available: true,
          command: 'codex',
          version: 'codex 1.0.0',
        }),
      },
    });
    return {
      result,
      requester,
    };
  }

  it('uses terminal-friendly adapter commands for managed tmux runs', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const calls: GatewayRequestOptions[] = [];
    const requester: GatewayRequester & { calls: GatewayRequestOptions[] } = {
      calls,
      async request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T> {
        calls.push(options);
        if (options.path.endsWith('/runs:claim')) {
          return {
            claimed: true,
            runId: 'run-terminal-codex-1',
            runCode: 'run-terminal-codex-1',
            claimToken: 'ag_claim_TERMINAL',
            claimAttempt: 1,
            leaseVersion: 1,
            profileProvider: 'codex',
            run: {
              id: 'run-terminal-codex-1',
              promptSnapshot: {
                text: 'Build a terminal-readable page',
              },
              executionPayloadJson: {
                commandKey: 'codex',
                cwd: '.',
              },
            },
          } as T;
        }
        if (options.path.includes('/heartbeat') && options.path.includes('/runs/')) {
          return {
            runId: 'run-terminal-codex-1',
            claimToken: 'ag_claim_TERMINAL',
            claimAttempt: 1,
            leaseVersion: 1,
            cancelRequested: false,
          } as T;
        }
        return {
          ok: true,
        } as T;
      },
    };
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-control-1',
      nodeKey: 'node-control-1',
      nodeToken: 'ag_node_CONTROL',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: 'codex',
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 20,
      terminalBackend: 'tmux',
      terminalStreamClientFactory: () => ({
        start: async () => undefined,
        appendText: async () => undefined,
        end: async () => undefined,
        close: () => undefined,
      }),
      detectOptions: {
        probeCommand: async () => ({
          available: true,
          command: 'codex',
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    expect(tmuxMocks.executeTmuxCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ['exec', 'Build a terminal-readable page'],
      }),
    );
  });

  it('acks delivered and succeeded after executing an interrupt request', async () => {
    const { result, requester } = await runWithControl('interrupt');
    expect(result.status).toBe('succeeded');
    expect(tmuxMocks.interruptTmuxSession).toHaveBeenCalledWith('ag-run-run-control-1');
    const ackBodies = requester.calls
      .filter((call) => call.path.includes('/control-requests/control-interrupt-1:ack'))
      .map((call) => call.body as JsonRecord);
    expect(ackBodies.map((body) => body.status)).toEqual(['delivered', 'succeeded']);
  });

  it('acks delivered and succeeded after executing a terminate request', async () => {
    const { requester } = await runWithControl('terminate');
    expect(tmuxMocks.interruptTmuxSession).not.toHaveBeenCalled();
    expect(tmuxMocks.terminateTmuxSession).toHaveBeenCalledWith('ag-run-run-control-1');
    const ackBodies = requester.calls
      .filter((call) => call.path.includes('/control-requests/control-terminate-1:ack'))
      .map((call) => call.body as JsonRecord);
    expect(ackBodies.map((body) => body.status)).toEqual(['delivered', 'succeeded']);
  });

  it('does not poll control requests before the managed tmux session starts', async () => {
    tmuxMocks.executeTmuxCommand.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
      return createSucceededResult();
    });
    const { requester } = await runWithControl('interrupt');
    expect(tmuxMocks.interruptTmuxSession).not.toHaveBeenCalled();
    expect(requester.calls.some((call) => call.path.includes('/control-requests:pending'))).toBe(false);
  });

  it('retries a delivered ack failure before marking the request handled', async () => {
    const { requester } = await runWithControl('interrupt', { failFirstDeliveredAck: true });
    expect(tmuxMocks.interruptTmuxSession).toHaveBeenCalledTimes(1);
    const ackBodies = requester.calls
      .filter((call) => call.path.includes('/control-requests/control-interrupt-1:ack'))
      .map((call) => call.body as JsonRecord);
    expect(ackBodies.map((body) => body.status)).toEqual(['delivered', 'delivered', 'succeeded']);
  });

  it('retries a final ack failure without executing the control twice', async () => {
    const { requester } = await runWithControl('interrupt', { failFirstFinalAck: true });
    expect(tmuxMocks.interruptTmuxSession).toHaveBeenCalledTimes(1);
    const ackBodies = requester.calls
      .filter((call) => call.path.includes('/control-requests/control-interrupt-1:ack'))
      .map((call) => call.body as JsonRecord);
    expect(ackBodies.map((body) => body.status)).toEqual(['delivered', 'succeeded', 'succeeded']);
  });

  it('drains a cached final ack during shutdown without executing the control twice', async () => {
    tmuxMocks.executeTmuxCommand.mockImplementationOnce(async (options: TmuxCommandOptions) => {
      await options.onSessionStarted?.({
        backend: 'tmux',
        sessionName: 'ag-run-run-control-1',
        startedAt: new Date().toISOString(),
      });
      return createSucceededResult();
    });
    const { requester } = await runWithControl('interrupt', { failFinalAckTimes: 2 });
    expect(tmuxMocks.interruptTmuxSession).toHaveBeenCalledTimes(1);
    const ackBodies = requester.calls
      .filter((call) => call.path.includes('/control-requests/control-interrupt-1:ack'))
      .map((call) => call.body as JsonRecord);
    expect(ackBodies.map((body) => body.status)).toEqual(['delivered', 'succeeded', 'succeeded', 'succeeded']);
  });

  it('does not re-execute a request that was already delivered before daemon restart', async () => {
    const { requester } = await runWithControl('interrupt', { initialStatus: 'delivered' });
    expect(tmuxMocks.interruptTmuxSession).not.toHaveBeenCalled();
    const ackBodies = requester.calls
      .filter((call) => call.path.includes('/control-requests/control-interrupt-1:ack'))
      .map((call) => call.body as JsonRecord);
    expect(ackBodies).toHaveLength(1);
    expect(ackBodies[0]).toMatchObject({
      status: 'failed',
      metadataJson: {
        action: 'interrupt',
        duplicateSignalSkipped: true,
      },
    });
  });

  it('uses the terminate-control cancel reason from heartbeat without ordinary interrupt cancellation', async () => {
    let observedCancelReason: unknown;
    tmuxMocks.executeTmuxCommand.mockImplementationOnce(async (options: TmuxCommandOptions) => {
      await options.onSessionStarted?.({
        backend: 'tmux',
        sessionName: 'ag-run-run-control-1',
        startedAt: new Date().toISOString(),
      });
      for (let attempt = 0; attempt < 20 && !options.cancelSignal?.aborted; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      observedCancelReason = options.cancelSignal?.reason;
      return createCanceledResult();
    });

    const { result } = await runWithControl('terminate', {
      disablePendingRequests: true,
      heartbeatCancelRequested: true,
      heartbeatCancelReason: AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON,
      heartbeatCancelAfterAttempt: 3,
    });

    expect(result.status).toBe('canceled');
    expect(observedCancelReason).toBe(AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON);
    expect(tmuxMocks.interruptTmuxSession).not.toHaveBeenCalled();
    expect(tmuxMocks.terminateTmuxSession).not.toHaveBeenCalled();
  });
});
