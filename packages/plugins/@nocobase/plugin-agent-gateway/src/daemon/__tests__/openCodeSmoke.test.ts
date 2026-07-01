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

import { executeCommand } from '../execDriver';
import { AgentGatewayDaemonNodeClient } from '../gateway';
import { OpenCodeSmokeGateway, runOpenCodeSmoke } from '../openCodeSmoke';
import { GatewayRequestOptions, GatewayRequester, JsonRecord, RunLease } from '../types';

class FakeSmokeGateway implements OpenCodeSmokeGateway {
  actions: string[] = [];
  completeResultSummary: JsonRecord | null = null;
  failResultSummary: JsonRecord | null = null;
  terminalLeaseVersion: number | null = null;
  failObservation = false;
  failCompleteOnce = false;
  cancelOnSyncingHeartbeatCall?: number;
  cancelOnRunningHeartbeatCall?: number;
  private leaseVersion = 1;
  private syncingHeartbeatCount = 0;
  private runningHeartbeatCount = 0;

  async heartbeatNode() {
    this.actions.push('heartbeatNode');
    return {};
  }

  async createRun() {
    this.actions.push('createRun');
    return {
      runId: 'run-1',
    };
  }

  async claimRun(values: { profileKey: string; runId?: string }): Promise<RunLease> {
    this.actions.push('claimRun');
    return {
      claimed: true,
      runId: values.runId || 'run-1',
      claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
      claimAttempt: 1,
      leaseVersion: this.leaseVersion,
    };
  }

  async heartbeatRun(lease: RunLease, status: 'running' | 'syncing_skills'): Promise<RunLease> {
    this.actions.push(`heartbeatRun:${status}`);
    if (status === 'syncing_skills') {
      this.syncingHeartbeatCount += 1;
    }
    if (status === 'running') {
      this.runningHeartbeatCount += 1;
    }
    this.leaseVersion += 1;
    return {
      ...lease,
      leaseVersion: this.leaseVersion,
      cancelRequested:
        (status === 'syncing_skills' && this.cancelOnSyncingHeartbeatCall === this.syncingHeartbeatCount) ||
        (status === 'running' && this.cancelOnRunningHeartbeatCall === this.runningHeartbeatCount),
    };
  }

  async appendEvent() {
    if (this.failObservation) {
      throw new Error('append failed');
    }
    this.actions.push('appendEvent');
  }

  async registerArtifact() {
    this.actions.push('registerArtifact');
  }

  async registerSnapshot() {
    this.actions.push('registerSnapshot');
  }

  async completeRun(_lease: RunLease, resultSummary: JsonRecord) {
    this.actions.push('completeRun');
    if (this.failCompleteOnce) {
      this.failCompleteOnce = false;
      throw new Error('Run is canceling');
    }
    this.completeResultSummary = resultSummary;
    this.terminalLeaseVersion = _lease.leaseVersion;
  }

  async failRun(_lease: RunLease, _errorSummary: string, resultSummary: JsonRecord = {}) {
    this.actions.push('failRun');
    this.failResultSummary = resultSummary;
    this.terminalLeaseVersion = _lease.leaseVersion;
  }

  async timeoutRun() {
    this.actions.push('timeoutRun');
  }

  async cancelAckRun(lease: RunLease) {
    this.actions.push('cancelAckRun');
    this.terminalLeaseVersion = lease.leaseVersion;
  }

  async skipRun() {
    this.actions.push('skipRun');
  }
}

class SmokeRequester implements GatewayRequester {
  calls: GatewayRequestOptions[] = [];

  async request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T> {
    this.calls.push(options);
    if (options.path.endsWith('/smoke-runs:create')) {
      return {
        runId: 'run-1',
      } as T;
    }
    if (options.path.endsWith('/runs:claim')) {
      return {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
      } as T;
    }
    return {} as T;
  }
}

describe('agent gateway OpenCode smoke runner', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-opencode-smoke-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('returns a terminal skipped result when OpenCode is missing', async () => {
    const gateway = new FakeSmokeGateway();
    const result = await runOpenCodeSmoke({
      gateway,
      detectOptions: {
        probeCommand: async () => ({
          available: false,
          error: 'not installed',
        }),
      },
      skillVersion: {
        skillVersionId: '22222222-2222-4222-8222-222222222222',
        versionLabel: 'opencode-smoke',
        source: {
          type: 'github',
          repoUrl: 'https://github.com/nocobase/skills',
          commitSha: '0123456789abcdef0123456789abcdef01234567',
        },
      },
      syncSkillVersion: async () => {
        throw new Error('missing OpenCode should not sync skills');
      },
      executeOpenCode: async () => {
        throw new Error('missing OpenCode should not execute');
      },
    });

    expect(result).toMatchObject({
      terminalStatus: 'skipped',
      runId: 'run-1',
      reason: expect.stringContaining('missing_dependency'),
    });
    expect(gateway.actions).toEqual(['heartbeatNode', 'createRun', 'skipRun']);
  });

  it('syncs the selected Skill version, executes a safe fake OpenCode command, and completes terminally', async () => {
    const gateway = new FakeSmokeGateway();
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const result = await runOpenCodeSmoke({
      gateway,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: candidates.includes('opencode') ? 'opencode 1.0.0' : undefined,
          authStatus: 'ok',
        }),
      },
      skillVersion: {
        skillVersionId: '33333333-3333-4333-8333-333333333333',
        versionLabel: 'opencode-smoke',
        source: {
          type: 'github',
          repoUrl: 'https://github.com/nocobase/skills',
          commitSha: '0123456789abcdef0123456789abcdef01234567',
        },
      },
      syncSkillVersion: async (skillVersion) => ({
        skillVersionId: skillVersion.skillVersionId,
        installPath: path.join(tempDir, 'skills', skillVersion.skillVersionId),
        idempotent: false,
        status: 'installed',
        sourceDigest: 'github:0123456789abcdef0123456789abcdef01234567',
      }),
      executeOpenCode: async () =>
        await executeCommand({
          definition: {
            commandKey: 'opencode-smoke',
            executable: process.execPath,
            defaultTimeoutMs: 5000,
          },
          args: ['-e', 'process.stdout.write("OpenCode smoke complete");'],
          cwd: workspace,
          workspaceRoot: workspace,
        }),
    });

    expect(result).toMatchObject({
      terminalStatus: 'succeeded',
      runId: 'run-1',
    });
    expect(gateway.actions).toEqual([
      'heartbeatNode',
      'createRun',
      'claimRun',
      'heartbeatRun:syncing_skills',
      'heartbeatRun:running',
      'heartbeatRun:running',
      'appendEvent',
      'registerSnapshot',
      'completeRun',
    ]);
    expect(gateway.actions).not.toContain('heartbeatRun:running:after-terminal');
  });

  it('uses concrete daemon gateway smoke run, directed claim, and skip endpoints', async () => {
    const requester = new SmokeRequester();
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    await gateway.createRun({
      sourceType: 'opencode-smoke',
    });
    await gateway.claimRun({
      profileKey: 'opencode',
      runId: 'run-1',
    });
    await gateway.skipRun('run-1', 'missing_dependency', {
      skipped: true,
    });

    expect(requester.calls.map((call) => call.path)).toEqual([
      '/api/agent-gateway/nodes/node-1/smoke-runs:create',
      '/api/agent-gateway/nodes/node-1/runs:claim',
      '/api/agent-gateway/nodes/node-1/runs/run-1/skip',
    ]);
    expect(requester.calls[1].body).toMatchObject({
      profileKey: 'opencode',
      runId: 'run-1',
    });
  });

  it('still terminalizes the smoke run when observation reporting fails', async () => {
    const gateway = new FakeSmokeGateway();
    gateway.failObservation = true;
    const result = await runOpenCodeSmoke({
      gateway,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
          authStatus: 'ok',
        }),
      },
      skillVersion: {
        skillVersionId: '44444444-4444-4444-8444-444444444444',
        versionLabel: 'opencode-smoke',
        source: {
          type: 'github',
          repoUrl: 'https://github.com/nocobase/skills',
          commitSha: '0123456789abcdef0123456789abcdef01234567',
        },
      },
      syncSkillVersion: async (skillVersion) => ({
        skillVersionId: skillVersion.skillVersionId,
        installPath: path.join(tempDir, 'skills', skillVersion.skillVersionId),
        idempotent: true,
        status: 'installed',
        sourceDigest: 'github:0123456789abcdef0123456789abcdef01234567',
      }),
      executeOpenCode: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: 'OpenCode smoke complete',
          sizeBytes: 23,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
    });

    expect(result.terminalStatus).toBe('succeeded');
    expect(gateway.actions).toContain('completeRun');
    expect(gateway.completeResultSummary).toMatchObject({
      observationWarnings: [expect.stringContaining('append failed')],
    });
  });

  it('keeps the smoke run lease alive while OpenCode execution is still running', async () => {
    const gateway = new FakeSmokeGateway();
    const result = await runOpenCodeSmoke({
      gateway,
      runHeartbeatIntervalMs: 5,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
          authStatus: 'ok',
        }),
      },
      skillVersion: {
        skillVersionId: '77777777-7777-4777-8777-777777777777',
        versionLabel: 'opencode-smoke',
        source: {
          type: 'github',
          repoUrl: 'https://github.com/nocobase/skills',
          commitSha: '0123456789abcdef0123456789abcdef01234567',
        },
      },
      syncSkillVersion: async (skillVersion) => ({
        skillVersionId: skillVersion.skillVersionId,
        installPath: path.join(tempDir, 'skills', skillVersion.skillVersionId),
        idempotent: true,
        status: 'installed',
        sourceDigest: 'github:0123456789abcdef0123456789abcdef01234567',
      }),
      executeOpenCode: async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: 'OpenCode smoke complete',
            sizeBytes: 23,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
    });

    expect(result.terminalStatus).toBe('succeeded');
    expect(gateway.actions.filter((action) => action === 'heartbeatRun:running').length).toBeGreaterThan(1);
    expect(gateway.terminalLeaseVersion).toBeGreaterThan(3);
  });

  it('acknowledges cancellation observed after OpenCode exits before smoke completion', async () => {
    const gateway = new FakeSmokeGateway();
    gateway.cancelOnRunningHeartbeatCall = 2;
    const result = await runOpenCodeSmoke({
      gateway,
      runHeartbeatIntervalMs: 60_000,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
          authStatus: 'ok',
        }),
      },
      skillVersion: {
        skillVersionId: '88888888-8888-4888-8888-888888888888',
        versionLabel: 'opencode-smoke',
        source: {
          type: 'github',
          repoUrl: 'https://github.com/nocobase/skills',
          commitSha: '0123456789abcdef0123456789abcdef01234567',
        },
      },
      syncSkillVersion: async (skillVersion) => ({
        skillVersionId: skillVersion.skillVersionId,
        installPath: path.join(tempDir, 'skills', skillVersion.skillVersionId),
        idempotent: true,
        status: 'installed',
        sourceDigest: 'github:0123456789abcdef0123456789abcdef01234567',
      }),
      executeOpenCode: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: 'OpenCode smoke complete',
          sizeBytes: 23,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
    });

    expect(result).toMatchObject({
      terminalStatus: 'canceled',
      runId: 'run-1',
    });
    expect(gateway.actions).toContain('cancelAckRun');
    expect(gateway.actions).not.toContain('completeRun');
    expect(gateway.terminalLeaseVersion).toBeGreaterThan(3);
  });

  it('keeps the smoke run lease alive while Skill sync is still running', async () => {
    const gateway = new FakeSmokeGateway();
    const result = await runOpenCodeSmoke({
      gateway,
      runHeartbeatIntervalMs: 5,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
          authStatus: 'ok',
        }),
      },
      skillVersion: {
        skillVersionId: '99999999-9999-4999-8999-999999999991',
        versionLabel: 'opencode-smoke',
        source: {
          type: 'github',
          repoUrl: 'https://github.com/nocobase/skills',
          commitSha: '0123456789abcdef0123456789abcdef01234567',
        },
      },
      syncSkillVersion: async (skillVersion) => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          skillVersionId: skillVersion.skillVersionId,
          installPath: path.join(tempDir, 'skills', skillVersion.skillVersionId),
          idempotent: true,
          status: 'installed',
          sourceDigest: 'github:0123456789abcdef0123456789abcdef01234567',
        };
      },
      executeOpenCode: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: 'OpenCode smoke complete',
          sizeBytes: 23,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
    });

    expect(result.terminalStatus).toBe('succeeded');
    expect(gateway.actions.filter((action) => action === 'heartbeatRun:syncing_skills').length).toBeGreaterThan(1);
  });

  it('acknowledges cancellation observed while smoke Skill sync is still running', async () => {
    const gateway = new FakeSmokeGateway();
    gateway.cancelOnSyncingHeartbeatCall = 2;
    const result = await runOpenCodeSmoke({
      gateway,
      runHeartbeatIntervalMs: 5,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
          authStatus: 'ok',
        }),
      },
      skillVersion: {
        skillVersionId: '99999999-9999-4999-8999-999999999992',
        versionLabel: 'opencode-smoke',
        source: {
          type: 'github',
          repoUrl: 'https://github.com/nocobase/skills',
          commitSha: '0123456789abcdef0123456789abcdef01234567',
        },
      },
      syncSkillVersion: async (skillVersion) => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          skillVersionId: skillVersion.skillVersionId,
          installPath: path.join(tempDir, 'skills', skillVersion.skillVersionId),
          idempotent: true,
          status: 'installed',
          sourceDigest: 'github:0123456789abcdef0123456789abcdef01234567',
        };
      },
      executeOpenCode: async () => {
        throw new Error('canceled sync should not execute OpenCode');
      },
    });

    expect(result).toMatchObject({
      terminalStatus: 'canceled',
      runId: 'run-1',
      reason: 'skill_sync_canceled',
    });
    expect(gateway.actions).toContain('cancelAckRun');
    expect(gateway.actions).not.toContain('completeRun');
  });

  it('acknowledges cancellation that arrives after final refresh before smoke completion', async () => {
    const gateway = new FakeSmokeGateway();
    gateway.failCompleteOnce = true;
    gateway.cancelOnRunningHeartbeatCall = 3;
    const result = await runOpenCodeSmoke({
      gateway,
      runHeartbeatIntervalMs: 60_000,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
          authStatus: 'ok',
        }),
      },
      skillVersion: {
        skillVersionId: '99999999-9999-4999-8999-999999999993',
        versionLabel: 'opencode-smoke',
        source: {
          type: 'github',
          repoUrl: 'https://github.com/nocobase/skills',
          commitSha: '0123456789abcdef0123456789abcdef01234567',
        },
      },
      syncSkillVersion: async (skillVersion) => ({
        skillVersionId: skillVersion.skillVersionId,
        installPath: path.join(tempDir, 'skills', skillVersion.skillVersionId),
        idempotent: true,
        status: 'installed',
        sourceDigest: 'github:0123456789abcdef0123456789abcdef01234567',
      }),
      executeOpenCode: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: 'OpenCode smoke complete',
          sizeBytes: 23,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
    });

    expect(result).toMatchObject({
      terminalStatus: 'canceled',
      runId: 'run-1',
    });
    expect(gateway.actions).toContain('completeRun');
    expect(gateway.actions).toContain('cancelAckRun');
  });
});
