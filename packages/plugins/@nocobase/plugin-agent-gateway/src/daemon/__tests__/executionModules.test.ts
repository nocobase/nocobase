/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AgentGatewayHttpError } from '../apiClient';
import type { ExecDriverResult } from '../execDriver';
import type { AgentGatewayDaemonNodeClient } from '../gateway';
import { resolveExecutionServices } from '../execution/services';
import { terminalizeRun } from '../observations/completion';
import type { RunLease } from '../types';

const lease: RunLease = {
  claimed: true,
  runId: 'run-1',
  claimToken: 'claim-token',
  claimAttempt: 1,
  leaseVersion: 1,
  localLeaseDeadlineMonotonicMs: Number.MAX_SAFE_INTEGER,
};

const succeededResult: ExecDriverResult = {
  status: 'succeeded',
  exitCode: 0,
  signal: null,
  stdout: {
    text: '',
    sizeBytes: 0,
  },
  stderr: {
    text: '',
    sizeBytes: 0,
  },
};

describe('daemon execution modules', () => {
  it('accepts narrow terminal backend overrides', async () => {
    const terminalFailure = new Error('terminal backend unavailable');
    const services = resolveExecutionServices({
      terminal: {
        executeTmux: async () => {
          throw terminalFailure;
        },
      },
    });

    await expect(
      services.terminal.executeTmux({
        runId: 'run-1',
        policy: {
          executionPolicyKey: 'test',
          provider: 'generic-cli',
          executable: process.execPath,
          workspaceRoot: process.cwd(),
          maxTimeoutMs: 1000,
        },
        args: [],
        cwd: process.cwd(),
        timeoutMs: 1000,
        cancelSignal: new AbortController().signal,
        leaseLostSignal: new AbortController().signal,
        artifactDir: process.cwd(),
      }),
    ).rejects.toBe(terminalFailure);
    expect(services.observations.complete).toBe(terminalizeRun);
  });

  it('treats duplicate completion after lease loss as lease_lost without retrying completion', async () => {
    let completeCalls = 0;
    let heartbeatCalls = 0;
    const gateway = {
      appendEvent: async () => {},
      registerArtifact: async () => {},
      registerSnapshot: async () => {},
      completeRun: async () => {
        completeCalls += 1;
        throw new AgentGatewayHttpError('Run is already terminal', 409, { code: 'lease_lost' });
      },
      heartbeatRun: async () => {
        heartbeatCalls += 1;
        throw new AgentGatewayHttpError('Run is already terminal', 409, { code: 'lease_lost' });
      },
    } as unknown as AgentGatewayDaemonNodeClient;

    await expect(
      terminalizeRun({
        gateway,
        getLease: () => lease,
        setLease: () => {},
        cancelController: new AbortController(),
        leaseLostController: new AbortController(),
        result: succeededResult,
      }),
    ).resolves.toBe('lease_lost');
    expect(completeCalls).toBe(1);
    expect(heartbeatCalls).toBe(1);
  });
});
