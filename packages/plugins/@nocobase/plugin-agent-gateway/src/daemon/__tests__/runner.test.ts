/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { AgentGatewayHttpError } from '../apiClient';
import { AgentGatewayDaemonNodeClient } from '../gateway';
import { runDaemonLoop, runDaemonOnce } from '../runner';
import { terminateTmuxSession } from '../tmuxTerminal';
import { GatewayRequestOptions, GatewayRequester, JsonRecord } from '../types';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../../shared/apiContract';
import { COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS } from '../../shared/conversationLimits';

function execTmux(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile('tmux', args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function hasTmux() {
  try {
    await execTmux(['-V']);
    return true;
  } catch {
    return false;
  }
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getRequestEvents(call: GatewayRequestOptions | undefined) {
  if (!isJsonRecord(call?.body)) {
    return [];
  }
  const events = call.body.events;
  return Array.isArray(events) ? events.filter(isJsonRecord) : [];
}

const RUN_ACTION_PATHS = {
  claim: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.claimRun, ''),
  heartbeat: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, ''),
  complete: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.completeRun, ''),
  fail: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.failRun, ''),
  timeout: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.timeoutRun, ''),
  cancelAck: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.ackCancelRun, ''),
} as const;

const OBSERVABILITY_ACTION_PATHS = {
  appendEvents: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendRunEvents, ''),
  registerArtifact: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.registerRunArtifact, ''),
  registerSnapshot: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot, ''),
  upsertAgentSession: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.upsertAgentSession, ''),
  appendConversationEvents: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendConversationEvents, ''),
} as const;

function isObservabilityActionCall(call: GatewayRequestOptions, action: keyof typeof OBSERVABILITY_ACTION_PATHS) {
  return call.path.includes(OBSERVABILITY_ACTION_PATHS[action]);
}

function isRunActionCall(call: GatewayRequestOptions, action: keyof typeof RUN_ACTION_PATHS) {
  return call.path.includes(RUN_ACTION_PATHS[action]);
}

function isTerminalRunActionCall(call: GatewayRequestOptions) {
  return (['complete', 'fail', 'timeout', 'cancelAck'] as const).some((action) => isRunActionCall(call, action));
}

async function writeSkillFixture(skillPath: string, skillName = 'agent-gateway-test-skill') {
  await fs.mkdir(skillPath, { recursive: true });
  await fs.writeFile(
    path.join(skillPath, 'SKILL.md'),
    ['---', `name: ${skillName}`, 'description: Agent Gateway test skill.', '---', '', '# Test Skill', ''].join('\n'),
  );
}

async function waitUntil(predicate: () => boolean, timeoutMs = 500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Timed out waiting for condition');
}

async function waitForAbort(signal: AbortSignal | undefined, timeoutMs = 1000) {
  if (signal?.aborted) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for abort signal'));
    }, timeoutMs);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

class RunnerRequester implements GatewayRequester {
  calls: GatewayRequestOptions[] = [];
  private leaseVersion = 1;
  private runHeartbeatCount = 0;
  private failCompleteOnce: boolean;
  private failAgentSessionUpsertOnce: boolean;

  constructor(
    private readonly options: {
      claimPayload?: JsonRecord;
      heartbeatDelayMs?: number;
      enforceTerminalLeaseVersion?: boolean;
      cancelOnRunHeartbeatCall?: number;
      failNodeHeartbeatOnce?: boolean;
      failCompleteOnce?: boolean;
      failAgentSessionUpsertOnce?: boolean;
      enforceAgentSessionLeaseVersion?: boolean;
      enforceArtifactLeaseVersion?: boolean;
      artifactResponseDelayMs?: number;
      failArtifactKeys?: string[];
      failConversationAppends?: boolean;
      runHeartbeatFailures?: Record<number, 'transient' | 'lease_lost' | 'permanent'>;
      transientRunHeartbeatStatusFailures?: Partial<Record<'syncing_skills' | 'running' | 'finalizing', number>>;
      failRunHeartbeatsFromCall?: number;
      leaseExpiresAt?: string;
      leaseTtlMs?: number;
      serverTime?: string;
    } = {},
  ) {
    this.failCompleteOnce = Boolean(options.failCompleteOnce);
    this.failAgentSessionUpsertOnce = Boolean(options.failAgentSessionUpsertOnce);
    this.transientRunHeartbeatStatusFailures = {
      ...options.transientRunHeartbeatStatusFailures,
    };
  }

  private readonly transientRunHeartbeatStatusFailures: Partial<
    Record<'syncing_skills' | 'running' | 'finalizing', number>
  >;

  private getDefaultClaimPayload() {
    return {
      claimed: true,
      runId: 'run-1',
      claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
      claimAttempt: 1,
      leaseVersion: 1,
      claimExpiresAt: this.options.leaseExpiresAt || new Date(Date.now() + 60_000).toISOString(),
      ...(this.options.leaseTtlMs !== undefined ? { leaseTtlMs: this.options.leaseTtlMs } : {}),
      ...(this.options.serverTime ? { serverTime: this.options.serverTime } : {}),
      run: {
        id: 'run-1',
        executionPayloadJson: {
          commandKey: 'node',
          args: ['-e', 'process.stdout.write("runner complete token=RUNNER_TOKEN_SECRET")'],
          cwd: '.',
        },
      },
    };
  }

  async request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T> {
    this.calls.push(options);
    if (this.options.failNodeHeartbeatOnce && options.path === '/api/agentGatewayApi:heartbeatNode/node-1') {
      this.options.failNodeHeartbeatOnce = false;
      throw new Error('connect ECONNREFUSED 127.0.0.1:23001');
    }
    if (isRunActionCall(options, 'heartbeat')) {
      if (this.options.heartbeatDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.options.heartbeatDelayMs));
      }
      this.runHeartbeatCount += 1;
      const requestedStatus = (options.body as JsonRecord | undefined)?.status;
      if (requestedStatus === 'syncing_skills' || requestedStatus === 'running' || requestedStatus === 'finalizing') {
        const failuresRemaining = this.transientRunHeartbeatStatusFailures[requestedStatus] || 0;
        if (failuresRemaining > 0) {
          this.transientRunHeartbeatStatusFailures[requestedStatus] = failuresRemaining - 1;
          throw new Error('connect ECONNRESET');
        }
      }
      const failure = this.options.runHeartbeatFailures?.[this.runHeartbeatCount];
      if (failure === 'lease_lost') {
        throw new AgentGatewayHttpError('Run lease has expired', 409, {
          code: 'lease_lost',
          message: 'Run lease has expired',
        });
      }
      if (failure === 'permanent') {
        throw new AgentGatewayHttpError('Invalid heartbeat payload', 400);
      }
      if (
        failure === 'transient' ||
        (this.options.failRunHeartbeatsFromCall !== undefined &&
          this.runHeartbeatCount >= this.options.failRunHeartbeatsFromCall)
      ) {
        throw new Error('connect ECONNRESET');
      }
      this.leaseVersion += 1;
      return {
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: this.leaseVersion,
        claimExpiresAt: this.options.leaseExpiresAt || new Date(Date.now() + 60_000).toISOString(),
        ...(this.options.leaseTtlMs !== undefined ? { leaseTtlMs: this.options.leaseTtlMs } : {}),
        ...(this.options.serverTime ? { serverTime: this.options.serverTime } : {}),
        cancelRequested: this.options.cancelOnRunHeartbeatCall === this.runHeartbeatCount,
      } as T;
    }
    if (isRunActionCall(options, 'claim')) {
      return (this.options.claimPayload || this.getDefaultClaimPayload()) as T;
    }
    if (this.failCompleteOnce && isRunActionCall(options, 'complete')) {
      this.failCompleteOnce = false;
      throw new Error('Run is canceling');
    }
    if (this.failAgentSessionUpsertOnce && isObservabilityActionCall(options, 'upsertAgentSession')) {
      this.failAgentSessionUpsertOnce = false;
      throw new Error('transient session upsert failure');
    }
    if (this.options.enforceAgentSessionLeaseVersion && isObservabilityActionCall(options, 'upsertAgentSession')) {
      const body = (options.body || {}) as JsonRecord;
      if (body.leaseVersion !== this.leaseVersion) {
        throw new Error(`stale agent session lease version: ${String(body.leaseVersion)} !== ${this.leaseVersion}`);
      }
    }
    if (isObservabilityActionCall(options, 'registerArtifact')) {
      const body = (options.body || {}) as JsonRecord;
      if (this.options.enforceArtifactLeaseVersion && body.leaseVersion !== this.leaseVersion) {
        throw new Error(`stale artifact lease version: ${String(body.leaseVersion)} !== ${this.leaseVersion}`);
      }
      if (this.options.artifactResponseDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.options.artifactResponseDelayMs));
      }
      if (this.options.failArtifactKeys?.includes(String(body.artifactKey || ''))) {
        throw new Error('HTTP 413');
      }
    }
    if (this.options.failConversationAppends && isObservabilityActionCall(options, 'appendConversationEvents')) {
      throw new Error('connect ECONNRESET timeline append');
    }
    if (this.options.enforceTerminalLeaseVersion && isTerminalRunActionCall(options)) {
      const body = (options.body || {}) as JsonRecord;
      if (body.leaseVersion !== this.leaseVersion) {
        throw new Error(`stale lease version: ${String(body.leaseVersion)} !== ${this.leaseVersion}`);
      }
    }
    return {
      ok: true,
    } as T;
  }
}

async function runHeartbeatScenario(
  tempDir: string,
  requesterOptions: ConstructorParameters<typeof RunnerRequester>[0],
  executeCommand: NonNullable<Parameters<typeof runDaemonOnce>[0]['executeCommand']>,
) {
  const workspace = path.join(tempDir, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  const requester = new RunnerRequester(requesterOptions);
  const gateway = new AgentGatewayDaemonNodeClient(requester, {
    serverUrl: 'https://nocobase.example.test',
    nodeId: 'node-1',
    nodeKey: 'node-1',
    nodeToken: 'ag_node_NODE_TOKEN_SECRET',
    savedAt: new Date().toISOString(),
  });
  const result = await runDaemonOnce({
    gateway,
    allowlist: {
      node: {
        commandKey: 'node',
        executable: process.execPath,
        defaultTimeoutMs: 5000,
      },
    },
    workspaceRoot: workspace,
    skillsRoot: path.join(tempDir, 'skills'),
    artifactDir: path.join(tempDir, 'artifacts'),
    runHeartbeatIntervalMs: 5,
    executeCommand,
    detectOptions: {
      probeCommand: async () => ({
        available: false,
      }),
    },
  });
  return {
    requester,
    result,
  };
}

describe('agent gateway daemon runner', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-daemon-runner-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('keeps polling when the gateway is temporarily unavailable', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: false,
      },
      failNodeHeartbeatOnce: true,
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'http://127.0.0.1:23001',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const errors: string[] = [];
    let profileProbeCalls = 0;
    const stopController = new AbortController();
    const loop = runDaemonLoop({
      gateway,
      allowlist: {},
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      pollIntervalMs: 1,
      retryInitialDelayMs: 1,
      retryMaxDelayMs: 2,
      stopSignal: stopController.signal,
      detectOptions: {
        probeCommand: async () => {
          profileProbeCalls += 1;
          return {
            available: false,
          };
        },
      },
      onLoopError: (error) => {
        errors.push(error instanceof Error ? error.message : String(error));
      },
    });

    try {
      await waitUntil(() => requester.calls.some((call) => isRunActionCall(call, 'claim')));
    } finally {
      stopController.abort();
      await loop;
    }

    const nodeHeartbeatCalls = requester.calls.filter(
      (call) => call.path === '/api/agentGatewayApi:heartbeatNode/node-1',
    );
    expect(nodeHeartbeatCalls.length).toBeGreaterThanOrEqual(2);
    expect(profileProbeCalls).toBe(3);
    expect(errors).toEqual(['connect ECONNREFUSED 127.0.0.1:23001']);
  });

  it('claims the next run immediately after completing work', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester();
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const executionStartedAt: number[] = [];
    const stopController = new AbortController();
    const loop = runDaemonLoop({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      pollIntervalMs: 1000,
      runHeartbeatIntervalMs: 60_000,
      stopSignal: stopController.signal,
      executeCommand: async () => {
        executionStartedAt.push(Date.now());
        if (executionStartedAt.length === 2) {
          stopController.abort();
        }
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: '',
            sizeBytes: 0,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
      detectOptions: {
        probeCommand: async () => ({
          available: false,
        }),
      },
    });

    try {
      await waitUntil(() => executionStartedAt.length >= 2, 500);
    } finally {
      stopController.abort();
      await loop;
    }

    expect(executionStartedAt[1] - executionStartedAt[0]).toBeLessThan(500);
  });

  it('stops the active claimed run when the daemon loop is aborted', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester();
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const stopController = new AbortController();
    let executionStarted = false;
    let executionStopped = false;
    const loop = runDaemonLoop({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 60_000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      stopSignal: stopController.signal,
      executeCommand: async ({ leaseLostSignal }) => {
        executionStarted = true;
        await waitForAbort(leaseLostSignal);
        executionStopped = true;
        return {
          status: 'lease_lost',
          exitCode: null,
          signal: 'SIGTERM',
          stdout: {
            text: '',
            sizeBytes: 0,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
      detectOptions: {
        probeCommand: async () => ({
          available: false,
        }),
      },
    });

    await waitUntil(() => executionStarted);
    stopController.abort(new Error('daemon stopping'));
    await loop;

    expect(executionStopped).toBe(true);
    expect(requester.calls.some(isTerminalRunActionCall)).toBe(false);
  });

  it('aborts active Skill synchronization when the daemon loop is stopped', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        claimExpiresAt: new Date(Date.now() + 60_000).toISOString(),
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'node',
            args: ['-e', 'process.stdout.write("should not execute")'],
            cwd: '.',
            skillVersions: [
              {
                skillVersionId: '99999999-9999-4999-8999-999999999999',
                versionLabel: 'v1',
                source: {
                  type: 'zip',
                  archivePath: '/skills/stop-signal.zip',
                  sha256: 'solidified-sha256',
                },
              },
            ],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const stopController = new AbortController();
    let syncStarted = false;
    let syncStopped = false;
    let executionStarted = false;
    const loop = runDaemonLoop({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 60_000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      stopSignal: stopController.signal,
      syncSkillVersion: async (options) => {
        syncStarted = true;
        await waitForAbort(options.signal);
        syncStopped = true;
        throw options.signal?.reason instanceof Error ? options.signal.reason : new Error('Skill sync aborted');
      },
      executeCommand: async () => {
        executionStarted = true;
        throw new Error('stopped Skill synchronization should not execute a command');
      },
      detectOptions: {
        probeCommand: async () => ({
          available: false,
        }),
      },
    });

    await waitUntil(() => syncStarted);
    stopController.abort(new Error('daemon stopping'));
    await loop;

    expect(syncStopped).toBe(true);
    expect(executionStarted).toBe(false);
    expect(requester.calls.some(isTerminalRunActionCall)).toBe(false);
  });

  it('claims, executes through allowlist, and terminalizes the run', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester();
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      claimProfileKey: 'opencode',
      runHeartbeatIntervalMs: 60_000,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
        }),
      },
      syncSkillVersion: async (options) => {
        await options.writeInstallStatus?.({
          nodeId: options.nodeId,
          skillVersionId: options.skillVersion.skillVersionId,
          status: 'installed',
          installedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          capabilitiesSnapshotJson: {
            skillRootPath: path.join(tempDir, 'skills', options.skillVersion.skillVersionId),
          },
          settingsSnapshotJson: {
            versionLabel: options.skillVersion.versionLabel,
          },
        });
        return {
          skillVersionId: options.skillVersion.skillVersionId,
          installPath: path.join(tempDir, 'skills', options.skillVersion.skillVersionId),
          idempotent: false,
          status: 'installed',
          sourceDigest: 'solidified-sha256',
        };
      },
    });

    expect(result).toMatchObject({
      status: 'succeeded',
      runId: 'run-1',
    });
    const paths = requester.calls.map((call) => call.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/agentGatewayApi:heartbeatNode/node-1',
        '/api/agentGatewayApi:claimRun/node-1',
        '/api/agentGatewayApi:appendRunEvents/run-1',
        '/api/agentGatewayApi:registerRunSnapshot/run-1',
        '/api/agentGatewayApi:completeRun/run-1',
      ]),
    );
    const runEventBodies = requester.calls
      .filter((call) => isObservabilityActionCall(call, 'appendEvents') && isJsonRecord(call.body))
      .map((call) => call.body as JsonRecord);
    expect(runEventBodies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'agent-gateway-daemon',
          eventType: 'skill.sync.started',
        }),
        expect.objectContaining({
          source: 'agent-gateway-daemon',
          eventType: 'agent.process.succeeded',
        }),
        expect.objectContaining({
          source: 'agent-gateway-daemon',
          eventType: 'run.finalizing.succeeded',
        }),
      ]),
    );
    expect(
      runEventBodies.some(
        (body) =>
          body.source === 'stdout' && typeof body.message === 'string' && body.message.includes('RUNNER_TOKEN_SECRET'),
      ),
    ).toBe(true);
  });

  it('removes default exec spool files after upload, parsing, and terminalization', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const artifactDir = path.join(tempDir, 'artifacts');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-exec-cleanup',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-exec-cleanup',
          executionPayloadJson: {
            commandKey: 'node',
            args: ['-e', 'process.stdout.write("x".repeat(128 * 1024));'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir,
      maxOutputSpoolBytes: 80 * 1024,
      runHeartbeatIntervalMs: 60_000,
      detectOptions: {
        probeCommand: async () => ({
          available: false,
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const stdoutArtifactCall = requester.calls.find(
      (call) => isObservabilityActionCall(call, 'registerArtifact') && call.body?.artifactKey === 'stdout-main',
    );
    expect(stdoutArtifactCall?.body).toMatchObject({
      sizeBytes: 128 * 1024,
      metadata: {
        capturedBytes: 80 * 1024,
        spoolTruncated: true,
        truncated: true,
      },
    });
    const completeCall = requester.calls.find((call) => isRunActionCall(call, 'complete'));
    expect(JSON.stringify(completeCall?.body)).toContain(`stdout spool truncated after ${80 * 1024} captured bytes`);
    await expect(fs.access(path.join(artifactDir, 'node-stdout.log'))).rejects.toThrow();
  });

  it('installs project Skills without modifying the agent prompt and registers declared artifacts', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const installedSkillPath = path.join(tempDir, 'skills', '55555555-5555-4555-8555-555555555555');
    const oldRunDir = path.join(tempDir, 'runs', 'nb-opencode-ui-batch', 'old-run');
    const runDir = path.join(tempDir, 'runs', 'nb-opencode-ui-batch', 'run-1');
    await fs.mkdir(workspace, { recursive: true });
    await writeSkillFixture(installedSkillPath);
    await fs.mkdir(oldRunDir, { recursive: true });
    await fs.mkdir(runDir, { recursive: true });
    const oldReportPath = path.join(oldRunDir, 'report.html');
    const oldReportJsonPath = path.join(oldRunDir, 'report.json');
    const oldRunJsonPath = path.join(oldRunDir, 'run.json');
    const oldTasksExpandedPath = path.join(oldRunDir, 'tasks.expanded.yaml');
    await fs.writeFile(oldReportPath, '<html><body>old batch report</body></html>');
    await fs.writeFile(oldReportJsonPath, '{"durationMs":1}');
    await fs.writeFile(oldRunJsonPath, '{"run_id":"old-run"}');
    await fs.writeFile(oldTasksExpandedPath, 'id: old-run\n');
    const oldReportDate = new Date('2020-01-01T00:00:00.000Z');
    await fs.utimes(oldReportPath, oldReportDate, oldReportDate);
    await fs.utimes(oldReportJsonPath, oldReportDate, oldReportDate);
    await fs.utimes(oldRunJsonPath, oldReportDate, oldReportDate);
    await fs.utimes(oldTasksExpandedPath, oldReportDate, oldReportDate);
    await fs.mkdir(path.join(runDir, 'browser-screenshots'), { recursive: true });
    await fs.writeFile(path.join(runDir, 'run.json'), '{"run_id":"run-1","status":"passed"}');
    await fs.writeFile(path.join(runDir, 'tasks.expanded.yaml'), 'id: run-1\ntasks:\n  - id: ai-product-intel-light\n');
    await fs.writeFile(path.join(runDir, 'report.html'), '<html><body>batch report</body></html>');
    await fs.writeFile(path.join(runDir, 'report.json'), '{"durationMs":1234,"totalTokens":5678}');
    await fs.writeFile(
      path.join(runDir, 'browser-verification.json'),
      JSON.stringify({
        status: 'passed',
        tasks: [
          {
            taskId: 'ai-product-intel-light',
            screenshots: ['browser-screenshots/overview.png'],
          },
        ],
      }),
    );
    await fs.writeFile(
      path.join(runDir, 'browser-screenshots', 'overview.png'),
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
        'base64',
      ),
    );
    const requestedAt = new Date(Date.now() - 1000).toISOString();
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          requestedAt,
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Run the local batch harness',
            cwd: '.',
            artifactRoot: tempDir,
            artifacts: [
              { glob: 'runs/nb-opencode-ui-batch/*/run.json', groupLabel: 'Run metadata' },
              { glob: 'runs/nb-opencode-ui-batch/*/tasks.expanded.yaml', groupLabel: 'Run metadata' },
              { glob: 'runs/nb-opencode-ui-batch/*/report.html', groupLabel: 'Reports' },
              { glob: 'runs/nb-opencode-ui-batch/*/report.json', groupLabel: 'Reports' },
              { glob: 'runs/nb-opencode-ui-batch/*/browser-verification.json', groupLabel: 'Verification' },
              { glob: 'runs/nb-opencode-ui-batch/*/browser-screenshots/**/*', groupLabel: 'Screenshots' },
            ],
            skillVersions: [
              {
                skillVersionId: '55555555-5555-4555-8555-555555555555',
                versionLabel: 'v1',
                source: {
                  type: 'zip',
                  archivePath: '/skills/opencode.zip',
                  sha256: 'solidified-sha256',
                },
              },
            ],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const executedArgs: string[][] = [];

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      syncSkillVersion: async (options) => ({
        skillVersionId: options.skillVersion.skillVersionId,
        installPath: installedSkillPath,
        idempotent: false,
        status: 'installed',
        sourceDigest: 'solidified-sha256',
      }),
      executeCommand: async (options) => {
        executedArgs.push(options.args || []);
        await fs.access(path.join(workspace, '.agents', 'skills', 'agent-gateway-test-skill', 'SKILL.md'));
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: 'AGW_PROGRESS phase=render_run status=started message=rerendering report\n{"type":"turn.completed"}',
            sizeBytes: 94,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    expect(executedArgs[0].join('\n')).not.toContain(path.join(installedSkillPath, 'SKILL.md'));
    expect(executedArgs[0].join('\n')).not.toContain('Custom Agent Gateway skills installed for this run');
    await expect(fs.access(path.join(workspace, '.agents', 'skills', 'agent-gateway-test-skill'))).rejects.toThrow();
    const artifactCalls = requester.calls.filter((call) => isObservabilityActionCall(call, 'registerArtifact'));
    expect(artifactCalls).toHaveLength(8);
    expect(artifactCalls.map((call) => call.body?.artifactKey)).not.toEqual(
      expect.arrayContaining([
        'declared:runs/nb-opencode-ui-batch/old-run/run.json',
        'declared:runs/nb-opencode-ui-batch/old-run/tasks.expanded.yaml',
        'declared:runs/nb-opencode-ui-batch/old-run/report.html',
        'declared:runs/nb-opencode-ui-batch/old-run/report.json',
      ]),
    );
    expect(artifactCalls.map((call) => call.body)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactKey: 'stdout-main',
          artifactType: 'stdout',
          mimeType: 'text/plain',
          contentText: expect.stringContaining('AGW_PROGRESS phase=render_run status=started'),
          metadata: expect.objectContaining({
            storageMode: 'inline',
            truncated: false,
          }),
        }),
        expect.objectContaining({
          artifactKey: 'declared:artifact-manifest.json',
          artifactType: 'artifact-manifest',
          mimeType: 'application/json',
        }),
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/run.json',
          artifactType: 'json-report',
          mimeType: 'application/json',
          contentText: '{"run_id":"run-1","status":"passed"}',
        }),
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/tasks.expanded.yaml',
          artifactType: 'file',
          mimeType: 'text/plain',
          contentText: expect.stringContaining('ai-product-intel-light'),
        }),
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/report.html',
          artifactType: 'html-report',
          mimeType: 'text/html',
          contentText: expect.stringContaining('batch report'),
          metadata: expect.objectContaining({
            artifactGroupLabel: 'Reports',
          }),
        }),
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/report.json',
          artifactType: 'json-report',
          mimeType: 'application/json',
          contentText: '{"durationMs":1234,"totalTokens":5678}',
        }),
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/browser-verification.json',
          artifactType: 'json-report',
          mimeType: 'application/json',
          contentText: expect.stringContaining('"status":"passed"'),
        }),
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-1/browser-screenshots/overview.png',
          artifactType: 'image',
          mimeType: 'image/png',
          contentText: expect.stringContaining('data:image/png;base64,'),
          metadata: expect.objectContaining({
            relativePath: 'runs/nb-opencode-ui-batch/run-1/browser-screenshots/overview.png',
            inlineEncoding: 'data-url',
          }),
        }),
      ]),
    );
    const manifestCall = artifactCalls.find((call) => call.body?.artifactKey === 'declared:artifact-manifest.json');
    expect(manifestCall?.body?.contentText).toBeTruthy();
    const manifest = JSON.parse(String(manifestCall?.body?.contentText)) as JsonRecord;
    expect(manifest).toMatchObject({
      referencedScreenshots: ['runs/nb-opencode-ui-batch/run-1/browser-screenshots/overview.png'],
      missingReferencedScreenshots: [],
    });
    const harnessProgressCall = requester.calls.find(
      (call) =>
        isObservabilityActionCall(call, 'appendEvents') &&
        isJsonRecord(call.body) &&
        call.body.source === 'harness' &&
        call.body.eventType === 'render_run.started',
    );
    expect(harnessProgressCall?.body).toMatchObject({
      message: 'rerendering report',
      payloadJson: {
        progress: true,
        phase: 'render_run',
        status: 'started',
      },
    });
    const completeCall = requester.calls.find((call) => isRunActionCall(call, 'complete'));
    expect(completeCall?.body).toMatchObject({
      resultSummary: {
        declaredArtifacts: {
          declaredArtifactCount: 7,
        },
      },
    });
  });

  it('collects declared artifacts from an explicit relative artifact root', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const localSkillPath = path.join(workspace, 'myskills', 'skills', 'nb-opencode-ui-batch');
    const runDir = path.join(workspace, 'myskills', 'runs', 'nb-opencode-ui-batch', 'run-2');
    await fs.mkdir(localSkillPath, { recursive: true });
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(path.join(runDir, 'report.html'), '<html><body>cwd skill home report</body></html>');
    await fs.writeFile(path.join(runDir, 'report.json'), '{"durationMs":2345}');

    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-2',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-2',
          requestedAt: new Date(Date.now() - 1000).toISOString(),
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Run the local batch harness from cwd',
            cwd: 'myskills/skills/nb-opencode-ui-batch',
            artifactRoot: '../..',
            artifactGlobs: ['runs/nb-opencode-ui-batch/*/report.html', 'runs/nb-opencode-ui-batch/*/report.json'],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: '{"type":"turn.completed"}',
          sizeBytes: 25,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const artifactCalls = requester.calls.filter((call) => isObservabilityActionCall(call, 'registerArtifact'));
    expect(artifactCalls.map((call) => call.body)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-2/report.html',
          artifactType: 'html-report',
          contentText: expect.stringContaining('cwd skill home report'),
        }),
        expect.objectContaining({
          artifactKey: 'declared:runs/nb-opencode-ui-batch/run-2/report.json',
          artifactType: 'json-report',
          contentText: '{"durationMs":2345}',
        }),
      ]),
    );
    const completeCall = requester.calls.find((call) => isRunActionCall(call, 'complete'));
    expect(completeCall?.body).toMatchObject({
      resultSummary: {
        declaredArtifacts: {
          artifactManifest: {
            counts: {
              matched: 2,
              selected: 2,
              uploaded: 2,
            },
          },
        },
      },
    });
  });

  it('collects declared artifacts from absolute paths and globs and preserves artifact groups', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const runDir = path.join(tempDir, 'external-runs', 'run-absolute');
    const reportPath = path.join(runDir, 'report.html');
    const reportJsonPath = path.join(runDir, 'report.json');
    await fs.mkdir(workspace, { recursive: true });
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(reportPath, '<html><body>absolute path report</body></html>');
    await fs.writeFile(reportJsonPath, '{"absolute":true}');

    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-absolute',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-absolute',
          requestedAt: new Date(Date.now() - 1000).toISOString(),
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Run a task and collect an absolute report',
            cwd: '.',
            artifacts: [
              {
                path: reportPath,
                groupLabel: 'Reports',
              },
              {
                glob: path.join(runDir, '*.json'),
                groupLabel: 'JSON',
              },
            ],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: '{"type":"turn.completed"}',
          sizeBytes: 25,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const artifactCalls = requester.calls.filter((call) => isObservabilityActionCall(call, 'registerArtifact'));
    expect(artifactCalls.map((call) => call.body)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactType: 'html-report',
          contentText: expect.stringContaining('absolute path report'),
          metadata: expect.objectContaining({
            artifactGroupLabel: 'Reports',
          }),
        }),
        expect.objectContaining({
          artifactType: 'json-report',
          contentText: '{"absolute":true}',
          metadata: expect.objectContaining({
            artifactGroupLabel: 'JSON',
          }),
        }),
      ]),
    );
    const manifestCall = artifactCalls.find((call) => call.body?.artifactKey === 'declared:artifact-manifest.json');
    const manifest = JSON.parse(String(manifestCall?.body?.contentText)) as JsonRecord;
    expect(manifest).toMatchObject({
      artifacts: expect.arrayContaining([
        expect.objectContaining({
          artifactGroupLabel: 'Reports',
        }),
      ]),
    });
  });

  it('continues declared artifact collection when one artifact upload fails', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const localSkillPath = path.join(workspace, 'myskills', 'skills', 'nb-opencode-ui-batch');
    const runDir = path.join(workspace, 'myskills', 'runs', 'nb-opencode-ui-batch', 'run-2');
    await fs.mkdir(localSkillPath, { recursive: true });
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(path.join(runDir, 'report.html'), '<html><body>partial report</body></html>');
    await fs.writeFile(path.join(runDir, 'report.json'), '{"large":true}');

    const failedArtifactKey = 'declared:runs/nb-opencode-ui-batch/run-2/report.json';
    const requester = new RunnerRequester({
      failArtifactKeys: [failedArtifactKey],
      claimPayload: {
        claimed: true,
        runId: 'run-2',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-2',
          requestedAt: new Date(Date.now() - 1000).toISOString(),
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Run the local batch harness from cwd',
            cwd: 'myskills/skills/nb-opencode-ui-batch',
            artifactRoot: '../..',
            artifactGlobs: ['runs/nb-opencode-ui-batch/*/report.html', 'runs/nb-opencode-ui-batch/*/report.json'],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: '{"type":"turn.completed"}',
          sizeBytes: 25,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const artifactCalls = requester.calls.filter((call) => isObservabilityActionCall(call, 'registerArtifact'));
    expect(artifactCalls.map((call) => call.body?.artifactKey)).toEqual(
      expect.arrayContaining([
        'declared:runs/nb-opencode-ui-batch/run-2/report.html',
        'declared:artifact-manifest.json',
      ]),
    );
    const completeCall = requester.calls.find((call) => isRunActionCall(call, 'complete'));
    expect(completeCall?.body).toMatchObject({
      resultSummary: {
        declaredArtifacts: {
          declaredArtifactFailedCount: 1,
          declaredArtifactFailures: [
            {
              artifactKey: failedArtifactKey,
              message: 'HTTP 413',
            },
          ],
          artifactManifest: {
            counts: {
              uploaded: 1,
              failed: 1,
            },
          },
        },
      },
    });
  });

  it('uses the latest lease while sequential declared artifact uploads are in progress', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    await fs.writeFile(path.join(workspace, 'first.txt'), 'first');
    await fs.writeFile(path.join(workspace, 'second.txt'), 'second');
    const requester = new RunnerRequester({
      enforceArtifactLeaseVersion: true,
      artifactResponseDelayMs: 20,
      claimPayload: {
        claimed: true,
        runId: 'run-artifacts',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-artifacts',
          executionPayloadJson: {
            commandKey: 'node',
            cwd: '.',
            artifactPaths: ['first.txt', 'second.txt'],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 5,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: '',
          sizeBytes: 0,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async () => ({
          available: false,
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const artifactCalls = requester.calls.filter((call) => isObservabilityActionCall(call, 'registerArtifact'));
    expect(new Set(artifactCalls.map((call) => (call.body as JsonRecord).leaseVersion)).size).toBeGreaterThan(1);
    const completeCall = requester.calls.find((call) => isRunActionCall(call, 'complete'));
    expect(completeCall?.body).toMatchObject({
      resultSummary: {
        declaredArtifacts: {
          declaredArtifactFailedCount: 0,
        },
      },
    });
  });

  it('does not scan installed Skill sibling run directories for generic task artifacts', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const installedSkillPath = path.join(tempDir, 'skills', '55555555-5555-4555-8555-555555555555');
    const runDir = path.join(tempDir, 'runs', 'nb-opencode-ui-batch', 'run-1');
    await fs.mkdir(workspace, { recursive: true });
    await writeSkillFixture(installedSkillPath);
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(
      path.join(runDir, 'report.html'),
      '<html><body>generic task must not collect this</body></html>',
    );
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          requestedAt: new Date(Date.now() - 1000).toISOString(),
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Run a generic task with a skill',
            cwd: '.',
            artifactGlobs: ['runs/nb-opencode-ui-batch/*/report.html'],
            skillVersions: [
              {
                skillVersionId: '55555555-5555-4555-8555-555555555555',
                versionLabel: 'v1',
                source: {
                  type: 'zip',
                  archivePath: '/skills/opencode.zip',
                  sha256: 'solidified-sha256',
                },
              },
            ],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      syncSkillVersion: async (options) => ({
        skillVersionId: options.skillVersion.skillVersionId,
        installPath: installedSkillPath,
        idempotent: false,
        status: 'installed',
        sourceDigest: 'solidified-sha256',
      }),
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: '{"type":"turn.completed"}',
          sizeBytes: 25,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const artifactCalls = requester.calls.filter((call) => isObservabilityActionCall(call, 'registerArtifact'));
    expect(artifactCalls.map((call) => String(call.body?.artifactKey))).not.toEqual(
      expect.arrayContaining(['declared:runs/nb-opencode-ui-batch/run-1/report.html']),
    );
  });

  it('leaves an existing project Skill with the same name in place', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const installedSkillPath = path.join(tempDir, 'skills', '55555555-5555-4555-8555-555555555555');
    const existingSkillPath = path.join(workspace, '.agents', 'skills', 'agent-gateway-test-skill');
    await fs.mkdir(workspace, { recursive: true });
    await writeSkillFixture(installedSkillPath);
    await fs.mkdir(existingSkillPath, { recursive: true });
    await fs.writeFile(
      path.join(existingSkillPath, 'SKILL.md'),
      ['---', 'name: agent-gateway-test-skill', 'description: User project skill.', '---', '', '# User Skill', ''].join(
        '\n',
      ),
    );
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Use existing project skill',
            cwd: '.',
            skillVersions: [
              {
                skillVersionId: '55555555-5555-4555-8555-555555555555',
                versionLabel: 'v1',
                source: {
                  type: 'zip',
                  archivePath: '/skills/opencode.zip',
                  sha256: 'solidified-sha256',
                },
              },
            ],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      syncSkillVersion: async (options) => ({
        skillVersionId: options.skillVersion.skillVersionId,
        installPath: installedSkillPath,
        idempotent: false,
        status: 'installed',
        sourceDigest: 'solidified-sha256',
      }),
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: '{"type":"turn.completed"}',
          sizeBytes: 25,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    await expect(fs.readFile(path.join(existingSkillPath, 'SKILL.md'), 'utf8')).resolves.toContain('# User Skill');
  });

  it('passes directed claim filters to the gateway', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: false,
        reason: 'no_claimable_run',
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {},
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      claimProfileKey: 'codex',
      claimRunId: 'target-run',
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result).toMatchObject({
      status: 'idle',
      reason: 'no_claimable_run',
    });
    const claimCall = requester.calls.find((call) => isRunActionCall(call, 'claim'));
    expect(claimCall?.body).toMatchObject({
      profileKey: 'codex',
      runId: 'target-run',
    });
  });

  it('reports detected Codex provider session ids back to NocoBase', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            args: ['exec', '--json', 'echo session'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: [
            '{"type":"thread.started","thread_id":"019f1e72-d75c-7c61-a9ba-cc99c653e0a2"}',
            '{"type":"turn.completed"}',
          ].join('\n'),
          sizeBytes: 120,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const upsertCall = requester.calls.find((call) => isObservabilityActionCall(call, 'upsertAgentSession'));
    expect(upsertCall).toBeTruthy();
    expect(upsertCall?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
      capabilities: {
        detectSessionId: true,
        resumeWithMessage: true,
      },
    });
    const conversationCall = requester.calls.find((call) =>
      isObservabilityActionCall(call, 'appendConversationEvents'),
    );
    expect(conversationCall?.body).toMatchObject({
      events: expect.arrayContaining([
        expect.objectContaining({
          source: 'codex',
          sequence: 1,
          eventType: 'agent.session.started',
          providerEventId: 'thread.started:019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
        }),
        expect.objectContaining({
          source: 'codex',
          sequence: 2,
          eventType: 'agent.turn.completed',
        }),
      ]),
    });
  });

  it('uses the claimed canonical provider for adapter commands when profile keys are custom', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        runCode: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        profileKey: 'custom-codex',
        profileProvider: 'codex',
        profileCapabilities: {
          artifacts: false,
        },
        run: {
          id: 'run-1',
          promptSnapshot: {
            renderedPrompt: 'Build with custom profile',
          },
          executionPayloadJson: {
            profileKey: 'custom-codex',
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const executedCommands: JsonRecord[] = [];

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async (options) => {
        executedCommands.push({
          commandKey: options.commandKey,
          args: options.args,
          cwd: options.cwd,
        });
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: '{"type":"thread.started","thread_id":"019f1e72-d75c-7c61-a9ba-cc99c653e0a2"}',
            sizeBytes: 76,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    expect(executedCommands[0]).toMatchObject({
      commandKey: 'codex',
      args: ['exec', '--skip-git-repo-check', '--json', 'Build with custom profile'],
    });
    const upsertCall = requester.calls.find((call) => isObservabilityActionCall(call, 'upsertAgentSession'));
    expect(upsertCall?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
      capabilities: {
        artifacts: false,
      },
    });
  });

  it('keeps explicit allowlisted commands when a claimed profile also reports a canonical provider', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        runCode: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        profileKey: 'custom-codex',
        profileProvider: 'codex',
        run: {
          id: 'run-1',
          promptSnapshot: {
            text: 'Prompt should not replace the explicit node command',
          },
          executionPayloadJson: {
            commandKey: 'node',
            profileKey: 'custom-codex',
            args: ['-e', 'process.stdout.write("legacy command complete")'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const executedCommands: JsonRecord[] = [];

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async (options) => {
        executedCommands.push({
          commandKey: options.commandKey,
          args: options.args,
          cwd: options.cwd,
        });
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: '{"type":"thread.started","thread_id":"019f1e72-d75c-7c61-a9ba-cc99c653e0a2"}',
            sizeBytes: 76,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
    });

    expect(result.status).toBe('succeeded');
    expect(executedCommands[0]).toMatchObject({
      commandKey: 'node',
      args: ['-e', 'process.stdout.write("legacy command complete")'],
    });
    expect(requester.calls.some((call) => isObservabilityActionCall(call, 'upsertAgentSession'))).toBe(false);
    expect(requester.calls.some((call) => isObservabilityActionCall(call, 'appendConversationEvents'))).toBe(false);
  });

  it('does not treat a canonical-looking profile key as the provider for explicit commands', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        runCode: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          promptSnapshot: {
            text: 'Prompt should not replace explicit node command',
          },
          executionPayloadJson: {
            commandKey: 'node',
            profileKey: 'codex',
            args: ['-e', 'process.stdout.write("legacy command complete")'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const executedCommands: JsonRecord[] = [];

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async (options) => {
        executedCommands.push({
          commandKey: options.commandKey,
          args: options.args,
          cwd: options.cwd,
        });
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: '{"type":"thread.started","thread_id":"019f1e72-d75c-7c61-a9ba-cc99c653e0a2"}',
            sizeBytes: 76,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
    });

    expect(result.status).toBe('succeeded');
    expect(executedCommands[0]).toMatchObject({
      commandKey: 'node',
      args: ['-e', 'process.stdout.write("legacy command complete")'],
    });
    expect(requester.calls.some((call) => isObservabilityActionCall(call, 'upsertAgentSession'))).toBe(false);
    expect(requester.calls.some((call) => isObservabilityActionCall(call, 'appendConversationEvents'))).toBe(false);
  });

  it('builds continuation runs through the Codex resume command builder', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const resumeMessage = 'Continue with spaces, "quotes", and newline\nthen finish';
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            mode: 'agent-session-resume',
            commandKey: 'codex',
            providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
            message: resumeMessage,
            args: ['exec', '--json', 'stale start args must not be used'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    const executedArgs: string[][] = [];

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async (options) => {
        executedArgs.push(options.args || []);
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: '{"type":"turn.completed"}',
            sizeBytes: 25,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    expect(executedArgs).toEqual([
      ['exec', 'resume', '--skip-git-repo-check', '--json', '019f1e72-d75c-7c61-a9ba-cc99c653e0a2', resumeMessage],
    ]);
  });

  it('fails malformed resume runs instead of leaving them active', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            mode: 'agent-session-resume',
            commandKey: 'codex',
            message: 'continue without a provider session id',
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });
    let commandExecuted = false;

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => {
        commandExecuted = true;
        throw new Error('malformed resume payload should fail before execution');
      },
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result).toMatchObject({
      status: 'failed',
      runId: 'run-1',
    });
    expect(commandExecuted).toBe(false);
    const failCall = requester.calls.find((call) => isRunActionCall(call, 'fail'));
    expect(failCall?.body).toMatchObject({
      errorSummary: 'providerSessionId is required for resume runs',
    });
  });

  it('retries transient Codex provider session upsert failures before completing the run', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      failAgentSessionUpsertOnce: true,
      enforceAgentSessionLeaseVersion: true,
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            args: ['exec', '--json', 'echo session'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 5,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: '{"type":"thread.started","thread_id":"019f1ea4-0ea4-7ef4-a911-f9f986f377e5"}',
          sizeBytes: 84,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const upsertCalls = requester.calls.filter((call) => isObservabilityActionCall(call, 'upsertAgentSession'));
    expect(upsertCalls).toHaveLength(2);
    expect(Number((upsertCalls[1]?.body as JsonRecord).leaseVersion)).toBeGreaterThan(
      Number((upsertCalls[0]?.body as JsonRecord).leaseVersion),
    );
    expect(upsertCalls[1]?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1ea4-0ea4-7ef4-a911-f9f986f377e5',
      metadata: {
        upsertAttempt: 2,
      },
    });
    expect(requester.calls.some((call) => isRunActionCall(call, 'complete'))).toBe(true);
  });

  it('reports detected Codex provider session ids from artifact-only output', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const stdoutArtifactPath = path.join(tempDir, 'codex-stdout.log');
    await fs.writeFile(
      stdoutArtifactPath,
      [
        '{"type":"thread.started","thread_id":"019f1e94-8f39-7dc0-b035-61fb2a364d30"}',
        '{"type":"turn.completed"}',
      ].join('\n'),
    );
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            args: ['exec', '--json', 'echo session'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: null,
          sizeBytes: 120,
          artifactPath: stdoutArtifactPath,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const upsertCall = requester.calls.find((call) => isObservabilityActionCall(call, 'upsertAgentSession'));
    expect(upsertCall?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1e94-8f39-7dc0-b035-61fb2a364d30',
    });
    await expect(fs.access(stdoutArtifactPath)).resolves.toBeUndefined();
  });

  it('normalizes Codex timeline events from the full artifact output', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const stdoutArtifactPath = path.join(tempDir, 'codex-stdout-large.log');
    const artifactText = [
      '{"type":"thread.started","thread_id":"019f1f37-25a1-71d0-9cd2-e0b37a2374fb"}',
      'x'.repeat(300 * 1024),
      '{"type":"item.completed","item":{"id":"item-tail","type":"agent_message","text":"tail timeline message"}}',
      '{"type":"item.completed","item":{"id":"item-command","type":"command_execution","command":"echo command raw","aggregated_output":"command output\\n","exit_code":0,"status":"completed"}}',
    ].join('\n');
    await fs.writeFile(stdoutArtifactPath, artifactText);
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            args: ['exec', '--json', 'echo session'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: null,
          sizeBytes: Buffer.byteLength(artifactText),
          artifactPath: stdoutArtifactPath,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const conversationCall = requester.calls.find((call) =>
      isObservabilityActionCall(call, 'appendConversationEvents'),
    );
    expect(conversationCall?.body).toMatchObject({
      events: expect.arrayContaining([
        expect.objectContaining({
          eventType: 'agent.message',
          contentText: 'tail timeline message',
          providerEventId: 'item.completed:item-tail',
          contentJson: expect.objectContaining({
            rawLine:
              '{"type":"item.completed","item":{"id":"item-tail","type":"agent_message","text":"tail timeline message"}}',
            rawProviderEvent: {
              type: 'item.completed',
              item: {
                id: 'item-tail',
                type: 'agent_message',
                text: 'tail timeline message',
              },
            },
          }),
        }),
        expect.objectContaining({
          eventType: 'agent.command.completed',
          contentText: 'Command completed',
          providerEventId: 'item.completed:item-command',
          contentJson: expect.objectContaining({
            command: 'echo command raw',
            output: 'command output\n',
            rawLine:
              '{"type":"item.completed","item":{"id":"item-command","type":"command_execution","command":"echo command raw","aggregated_output":"command output\\n","exit_code":0,"status":"completed"}}',
            rawProviderEvent: {
              type: 'item.completed',
              item: {
                id: 'item-command',
                type: 'command_execution',
                command: 'echo command raw',
                aggregated_output: 'command output\n',
                exit_code: 0,
                status: 'completed',
              },
            },
          }),
        }),
      ]),
    });
  });

  it('preserves large command output without duplicating oversized raw provider payloads', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const largeOutput = 'A'.repeat(COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS);
    const rawLine = JSON.stringify({
      type: 'item.completed',
      item: {
        id: 'item-large-command',
        type: 'command_execution',
        command: 'node scripts/noisy-command.mjs',
        aggregated_output: largeOutput,
        exit_code: 0,
        status: 'completed',
      },
    });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            args: ['exec', '--json', 'echo session'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: rawLine,
          sizeBytes: Buffer.byteLength(rawLine),
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const conversationCall = requester.calls.find((call) =>
      isObservabilityActionCall(call, 'appendConversationEvents'),
    );
    const commandEvent = getRequestEvents(conversationCall).find(
      (event) => event.providerEventId === 'item.completed:item-large-command',
    );
    const contentJson = commandEvent?.contentJson as JsonRecord | undefined;
    expect(contentJson?.command).toBe('node scripts/noisy-command.mjs');
    expect(String(contentJson?.output || '')).toHaveLength(COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS);
    expect(contentJson?.rawLineTruncated).toBe(true);
    expect(contentJson?.rawLineOriginalLength).toBe(rawLine.length);
    expect(contentJson?.rawProviderEventOmitted).toBe(true);
    expect(JSON.stringify(contentJson)).not.toContain('rawProviderEvent":{"type"');
    expect(JSON.stringify(contentJson)).not.toContain(`rawLine":"${rawLine.slice(0, 120)}`);
  });

  it('bounds oversized provider lines and records normalization truncation', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const oversizedOutputPath = path.join(tempDir, 'oversized-provider-line.log');
    await fs.mkdir(workspace, { recursive: true });
    await fs.writeFile(oversizedOutputPath, Buffer.alloc(11 * 1024 * 1024, 'x'));
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-oversized-provider-line',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-oversized-provider-line',
          executionPayloadJson: {
            commandKey: 'codex',
            args: ['exec', '--json', 'oversized line'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: null,
          sizeBytes: 11 * 1024 * 1024,
          artifactPath: oversizedOutputPath,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const completeCall = requester.calls.find((call) => isRunActionCall(call, 'complete'));
    expect(JSON.stringify(completeCall?.body)).toMatch(
      /Agent timeline normalization truncated: truncatedLines=1, droppedBytes=[1-9][0-9]*/,
    );
    await expect(fs.access(oversizedOutputPath)).resolves.toBeUndefined();
  });

  it('chunks Codex timeline appends to stay within the server batch limit', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const timelineLines = [
      '{"type":"thread.started","thread_id":"019f1f37-25a1-71d0-9cd2-e0b37a2374fb"}',
      ...Array.from(
        { length: 105 },
        (_value, index) =>
          `{"type":"item.completed","item":{"id":"item-${index}","type":"agent_message","text":"message ${index}"}}`,
      ),
    ];
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            args: ['exec', '--json', 'echo session'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: timelineLines.join('\n'),
          sizeBytes: Buffer.byteLength(timelineLines.join('\n')),
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const conversationCalls = requester.calls.filter((call) =>
      isObservabilityActionCall(call, 'appendConversationEvents'),
    );
    expect(conversationCalls).toHaveLength(2);
    expect((conversationCalls[0].body?.events as unknown[] | undefined)?.length).toBe(100);
    expect((conversationCalls[1].body?.events as unknown[] | undefined)?.length).toBe(6);
  });

  it('reports detected Codex provider session ids from full tmux output before the pane tail', async () => {
    if (!(await hasTmux())) {
      return;
    }

    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            args: [
              '-e',
              [
                'process.stdout.write(\'{"type":"thread.started","thread_id":"019f1eb9-2c3a-7f77-9004-8c81f7abf7b1"}\\n\');',
                'process.stdout.write("x".repeat(66 * 1024) + "\\n");',
                'process.stdout.write(\'{"type":"item.completed","item":{"id":"item-tail-tmux","type":"agent_message","text":"tail after pane capture"}}\\n\');',
              ].join(''),
            ],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    try {
      const result = await runDaemonOnce({
        gateway,
        allowlist: {
          codex: {
            commandKey: 'codex',
            executable: process.execPath,
            defaultTimeoutMs: 5000,
          },
        },
        workspaceRoot: workspace,
        skillsRoot: path.join(tempDir, 'skills'),
        artifactDir: path.join(tempDir, 'artifacts'),
        terminalBackend: 'tmux',
        runHeartbeatIntervalMs: 60_000,
        detectOptions: {
          probeCommand: async (candidates) => ({
            available: candidates.includes('codex'),
            command: candidates[0],
            version: 'codex 1.0.0',
          }),
        },
      });

      expect(result.status).toBe('succeeded');
      await expect(fs.access(path.join(tempDir, 'artifacts', 'ag-run-run-1-terminal.log'))).rejects.toThrow();
      const upsertCall = requester.calls.find((call) => isObservabilityActionCall(call, 'upsertAgentSession'));
      expect(upsertCall?.body).toMatchObject({
        provider: 'codex',
        providerSessionId: '019f1eb9-2c3a-7f77-9004-8c81f7abf7b1',
      });
      const liveConversationCallIndex = requester.calls.findIndex((call) =>
        getRequestEvents(call).some((event) => event.source === 'terminal-live' && event.eventType === 'agent.message'),
      );
      const completeCallIndex = requester.calls.findIndex((call) => isRunActionCall(call, 'complete'));
      expect(liveConversationCallIndex).toBeGreaterThanOrEqual(0);
      expect(completeCallIndex).toBeGreaterThan(liveConversationCallIndex);
      const codexConversationCall = requester.calls.find((call) =>
        getRequestEvents(call).some((event) => event.providerEventId === 'item.completed:item-tail-tmux'),
      );
      expect(codexConversationCall?.body).toMatchObject({
        events: expect.arrayContaining([
          expect.objectContaining({
            source: 'codex',
            eventType: 'agent.message',
            contentText: 'tail after pane capture',
            providerEventId: 'item.completed:item-tail-tmux',
          }),
        ]),
      });
    } finally {
      await terminateTmuxSession('ag-run-run-1').catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('bounds failed live timeline retries and records dropped fallback bytes', async () => {
    if (!(await hasTmux())) {
      return;
    }

    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      failConversationAppends: true,
      claimPayload: {
        claimed: true,
        runId: 'run-live-buffer',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-live-buffer',
          executionPayloadJson: {
            commandKey: 'codex',
            args: [
              '-e',
              [
                'for (let index = 0; index < 500; index += 1) {',
                '  process.stdout.write(JSON.stringify({ type: "item.completed", item: { id: `item-${index}`, type: "agent_message", text: `message ${index}` } }) + "\\n");',
                '}',
                'process.stdout.write("x".repeat(512 * 1024) + "\\n");',
              ].join(''),
            ],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    try {
      const result = await runDaemonOnce({
        gateway,
        allowlist: {
          codex: {
            commandKey: 'codex',
            executable: process.execPath,
            defaultTimeoutMs: 5000,
          },
        },
        workspaceRoot: workspace,
        skillsRoot: path.join(tempDir, 'skills'),
        artifactDir: path.join(tempDir, 'artifacts'),
        terminalBackend: 'tmux',
        runHeartbeatIntervalMs: 60_000,
        detectOptions: {
          probeCommand: async (candidates) => ({
            available: candidates.includes('codex'),
            command: candidates[0],
            version: 'codex 1.0.0',
          }),
        },
      });

      expect(result.status).toBe('succeeded');
      const completeCall = requester.calls.find((call) => isRunActionCall(call, 'complete'));
      expect(JSON.stringify(completeCall?.body)).toMatch(
        /Live timeline truncated: droppedStructuredEvents=[1-9][0-9]*, .*droppedFallbackBytes=[1-9][0-9]*/,
      );
    } finally {
      await terminateTmuxSession('ag-run-run-live-buffer').catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('keeps final provider sequences authoritative after an oversized live line', async () => {
    if (!(await hasTmux())) {
      return;
    }

    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-live-sequence',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-live-sequence',
          executionPayloadJson: {
            commandKey: 'codex',
            args: [
              '-e',
              [
                'process.stdout.write(JSON.stringify({ type: "thread.started", thread_id: "019f4eab-1cf4-75d2-b8b6-5b9af93477af" }) + "\\n");',
                'const oversized = { type: "item.completed", item: { id: "item-oversized", type: "agent_message", text: "x".repeat(300 * 1024) } };',
                'const following = { type: "item.completed", item: { id: "item-following", type: "agent_message", text: "after oversized" } };',
                'process.stdout.write(`${JSON.stringify(oversized)}\\n${JSON.stringify(following)}\\n`);',
              ].join(''),
            ],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    try {
      const result = await runDaemonOnce({
        gateway,
        allowlist: {
          codex: {
            commandKey: 'codex',
            executable: process.execPath,
            defaultTimeoutMs: 5000,
          },
        },
        workspaceRoot: workspace,
        skillsRoot: path.join(tempDir, 'skills'),
        artifactDir: path.join(tempDir, 'artifacts'),
        terminalBackend: 'tmux',
        runHeartbeatIntervalMs: 60_000,
        detectOptions: {
          probeCommand: async (candidates) => ({
            available: candidates.includes('codex'),
            command: candidates[0],
            version: 'codex 1.0.0',
          }),
        },
      });

      expect(result.status).toBe('succeeded');
      const sessionUpsertCallIndex = requester.calls.findIndex((call) =>
        isObservabilityActionCall(call, 'upsertAgentSession'),
      );
      expect(sessionUpsertCallIndex).toBeGreaterThanOrEqual(0);
      expect(
        requester.calls
          .slice(0, sessionUpsertCallIndex)
          .some((call) =>
            getRequestEvents(call).some(
              (event) => event.source === 'codex' && event.providerEventId === 'item.completed:item-following',
            ),
          ),
      ).toBe(false);
      const finalProviderEvents = requester.calls
        .slice(sessionUpsertCallIndex + 1)
        .flatMap((call) => getRequestEvents(call))
        .filter((event) => event.source === 'codex');
      expect(finalProviderEvents.some((event) => event.providerEventId === 'item.completed:item-oversized')).toBe(true);
      expect(finalProviderEvents.some((event) => event.providerEventId === 'item.completed:item-following')).toBe(true);
    } finally {
      await terminateTmuxSession('ag-run-run-live-sequence').catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('runs structured Codex tmux commands with non-TTY stdout and parses child-agent events', async () => {
    if (!(await hasTmux())) {
      return;
    }

    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const fakeCodexPath = path.join(tempDir, 'fake-codex.js');
    await fs.writeFile(
      fakeCodexPath,
      [
        'if (process.stdout.isTTY) {',
        '  process.stdout.write("session id: terminal-mode\\ncollab: SpawnAgent\\nAquinas replied Hi\\n");',
        '  process.exit(0);',
        '}',
        'const events = [',
        '  { type: "thread.started", thread_id: "019f1eb9-2c3a-7f77-9004-8c81f7abf7b1" },',
        '  { type: "item.completed", item: { id: "spawn-aquinas", type: "collab_tool_call", tool: "spawn_agent", sender_thread_id: "root-thread", receiver_thread_ids: ["thread-aquinas"], prompt: "You are a sub-agent named Aquinas. Reply exactly: Hi", agents_states: { "thread-aquinas": { status: "pending_init", message: null } }, status: "completed" } },',
        '  { type: "item.completed", item: { id: "wait-aquinas", type: "collab_tool_call", tool: "wait", sender_thread_id: "root-thread", receiver_thread_ids: ["thread-aquinas"], prompt: null, agents_states: { "thread-aquinas": { status: "completed", message: "Hi" } }, status: "completed" } },',
        '  { type: "item.completed", item: { id: "cmd-progress", type: "command_execution", command: "node scripts/run-suite.mjs", aggregated_output: "AGW_PROGRESS phase=batch status=started message=hello\\n", exit_code: 0, status: "completed" } },',
        '  { type: "item.completed", item: { id: "final-message", type: "agent_message", text: "Aquinas replied Hi." } }',
        '];',
        'for (const event of events) process.stdout.write(`${JSON.stringify(event)}\\n`);',
      ].join('\n'),
    );

    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Start one sub-agent named Aquinas and ask it to say Hi.',
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    try {
      const result = await runDaemonOnce({
        gateway,
        allowlist: {
          codex: {
            commandKey: 'codex',
            executable: process.execPath,
            baseArgs: [fakeCodexPath],
            defaultTimeoutMs: 5000,
          },
        },
        workspaceRoot: workspace,
        skillsRoot: path.join(tempDir, 'skills'),
        artifactDir: path.join(tempDir, 'artifacts'),
        terminalBackend: 'tmux',
        runHeartbeatIntervalMs: 60_000,
        detectOptions: {
          probeCommand: async (candidates) => ({
            available: candidates.includes('codex'),
            command: candidates[0],
            version: 'codex 1.0.0',
          }),
        },
      });

      expect(result.status).toBe('succeeded');
      expect(
        requester.calls.some((call) => call.body?.message === 'hello' && call.body?.eventType === 'batch.started'),
      ).toBe(true);
      const conversationEvents = requester.calls.flatMap((call) => getRequestEvents(call));
      expect(conversationEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'codex',
            eventType: 'agent.tool.completed',
            providerEventId: 'item.completed:wait-aquinas',
            contentJson: expect.objectContaining({
              collab: expect.objectContaining({
                tool: 'wait',
              }),
            }),
          }),
          expect.objectContaining({
            source: 'codex',
            eventType: 'agent.command.completed',
            providerEventId: 'item.completed:cmd-progress',
            contentJson: expect.objectContaining({
              output: expect.stringContaining('AGW_PROGRESS phase=batch status=started message=hello'),
            }),
          }),
        ]),
      );
    } finally {
      await terminateTmuxSession('ag-run-run-1').catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('truncates log artifacts only after the large command output limit and still completes the run', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const largeLogPath = path.join(tempDir, 'large-stdout.log');
    const largeLogSize = COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS + 1024;
    await fs.writeFile(largeLogPath, Buffer.alloc(largeLogSize, 65));
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'node',
            args: ['-e', 'process.stdout.write("unused")'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 15000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: null,
          sizeBytes: largeLogSize,
          artifactPath: largeLogPath,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const artifactCall = requester.calls.find(
      (call) => isObservabilityActionCall(call, 'registerArtifact') && call.body?.artifactKey === 'stdout-main',
    );
    expect(artifactCall).toBeTruthy();
    const artifactBody = (artifactCall?.body || {}) as JsonRecord;
    expect(String(artifactBody.contentText).length).toBeLessThan(COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS);
    expect(String(artifactBody.contentText).length).toBeGreaterThan(9 * 1024 * 1024);
    expect(artifactBody.metadata).toMatchObject({
      originalSizeBytes: largeLogSize,
      truncated: true,
    });
    expect(artifactBody.metadata?.uploadedBytes).toBe(Buffer.byteLength(String(artifactBody.contentText)));
    expect(requester.calls.some((call) => isRunActionCall(call, 'complete'))).toBe(true);
  });

  it('drains in-flight run heartbeats before terminalizing with the latest lease version', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      heartbeatDelayMs: 20,
      enforceTerminalLeaseVersion: true,
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'node',
            args: ['-e', 'setTimeout(() => process.stdout.write("done"), 50)'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 1,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const completeCall = requester.calls.find((call) => isRunActionCall(call, 'complete'));
    expect(completeCall).toBeTruthy();
  });

  it('keeps a run active after a transient periodic heartbeat failure before the lease deadline', async () => {
    const { requester, result } = await runHeartbeatScenario(
      tempDir,
      {
        runHeartbeatFailures: {
          3: 'transient',
        },
      },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: 'done',
            sizeBytes: 4,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
    );

    expect(result.status).toBe('succeeded');
    expect(requester.calls.filter((call) => isRunActionCall(call, 'heartbeat')).length).toBeGreaterThan(3);
  });

  it('retries transient syncing and running phase heartbeats before the lease deadline', async () => {
    const { requester, result } = await runHeartbeatScenario(
      tempDir,
      {
        transientRunHeartbeatStatusFailures: {
          syncing_skills: 1,
          running: 1,
        },
      },
      async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: 'done',
          sizeBytes: 4,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
    );

    expect(result.status).toBe('succeeded');
    const heartbeatStatuses = requester.calls
      .filter((call) => isRunActionCall(call, 'heartbeat'))
      .map((call) => (call.body as JsonRecord | undefined)?.status);
    expect(heartbeatStatuses.filter((status) => status === 'syncing_skills')).toHaveLength(2);
    expect(heartbeatStatuses.filter((status) => status === 'running').length).toBeGreaterThanOrEqual(2);
  });

  it('does not retry a permanent heartbeat response until the lease expires', async () => {
    const { requester, result } = await runHeartbeatScenario(
      tempDir,
      {
        runHeartbeatFailures: {
          1: 'permanent',
        },
      },
      async () => {
        throw new Error('command should not execute');
      },
    );

    expect(result).toMatchObject({
      status: 'lease_lost',
      reason: 'skill_sync_heartbeat_failed',
    });
    expect(requester.calls.filter((call) => isRunActionCall(call, 'heartbeat'))).toHaveLength(1);
  });

  it('aborts a run immediately after an authoritative lease-lost heartbeat response', async () => {
    const { result } = await runHeartbeatScenario(
      tempDir,
      {
        runHeartbeatFailures: {
          3: 'lease_lost',
        },
      },
      async (options) => {
        await waitForAbort(options.leaseLostSignal);
        return {
          status: 'lease_lost',
          exitCode: null,
          signal: null,
          stdout: {
            text: null,
            sizeBytes: 0,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
    );

    expect(result).toMatchObject({
      status: 'lease_lost',
      runId: 'run-1',
    });
  });

  it('uses the server lease TTL instead of aborting early when the daemon clock is ahead', async () => {
    const { result } = await runHeartbeatScenario(
      tempDir,
      {
        serverTime: '2000-01-01T00:00:00.000Z',
        leaseExpiresAt: '2000-01-01T00:00:00.500Z',
        leaseTtlMs: 500,
      },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          status: 'succeeded',
          exitCode: 0,
          signal: null,
          stdout: {
            text: 'done',
            sizeBytes: 4,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
    );

    expect(result.status).toBe('succeeded');
  });

  it('aborts after transient heartbeat failures exhaust the server-relative lease TTL', async () => {
    const { result } = await runHeartbeatScenario(
      tempDir,
      {
        serverTime: '2100-01-01T00:00:00.000Z',
        leaseExpiresAt: '2100-01-01T00:00:00.100Z',
        leaseTtlMs: 100,
        failRunHeartbeatsFromCall: 3,
      },
      async (options) => {
        await waitForAbort(options.leaseLostSignal);
        return {
          status: 'lease_lost',
          exitCode: null,
          signal: null,
          stdout: {
            text: null,
            sizeBytes: 0,
          },
          stderr: {
            text: null,
            sizeBytes: 0,
          },
        };
      },
    );

    expect(result).toMatchObject({
      status: 'lease_lost',
      runId: 'run-1',
    });
  });

  it('acknowledges cancellation observed after command exit before terminal completion', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      cancelOnRunHeartbeatCall: 3,
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'node',
            args: ['-e', 'process.stdout.write("done")'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
        }),
      },
    });

    expect(result).toMatchObject({
      status: 'canceled',
      runId: 'run-1',
    });
    expect(requester.calls.some((call) => isRunActionCall(call, 'cancelAck'))).toBe(true);
    expect(requester.calls.some((call) => isRunActionCall(call, 'complete'))).toBe(false);
  });

  it('reports detected Codex provider session ids before acknowledging cancellation after command exit', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      cancelOnRunHeartbeatCall: 3,
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            args: ['exec', '--json', 'echo session'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: '{"type":"thread.started","thread_id":"019f1ed9-c5f6-7505-af97-24f968db949f"}',
          sizeBytes: 84,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('codex'),
          command: candidates[0],
          version: 'codex 1.0.0',
        }),
      },
    });

    expect(result).toMatchObject({
      status: 'canceled',
      runId: 'run-1',
    });
    const upsertIndex = requester.calls.findIndex((call) => isObservabilityActionCall(call, 'upsertAgentSession'));
    const cancelAckIndex = requester.calls.findIndex((call) => isRunActionCall(call, 'cancelAck'));
    expect(upsertIndex).toBeGreaterThanOrEqual(0);
    expect(cancelAckIndex).toBeGreaterThan(upsertIndex);
    expect(requester.calls[upsertIndex]?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1ed9-c5f6-7505-af97-24f968db949f',
    });
  });

  it('keeps the run lease alive while Skill sync is still running', async () => {
    const workspace = path.join(tempDir, 'workspace');
    const installedSkillPath = path.join(tempDir, 'skills', '55555555-5555-4555-8555-555555555555');
    await fs.mkdir(workspace, { recursive: true });
    await writeSkillFixture(installedSkillPath);
    const requester = new RunnerRequester({
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Run with a synced project skill',
            cwd: '.',
            skillVersions: [
              {
                skillVersionId: '55555555-5555-4555-8555-555555555555',
                versionLabel: 'v1',
                source: {
                  type: 'zip',
                  archivePath: '/skills/opencode.zip',
                  sha256: 'solidified-sha256',
                },
              },
            ],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 5,
      syncSkillVersion: async (options) => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          skillVersionId: options.skillVersion.skillVersionId,
          installPath: installedSkillPath,
          idempotent: false,
          status: 'installed',
          sourceDigest: 'solidified-sha256',
        };
      },
      executeCommand: async () => ({
        status: 'succeeded',
        exitCode: 0,
        signal: null,
        stdout: {
          text: 'done',
          sizeBytes: 4,
        },
        stderr: {
          text: null,
          sizeBytes: 0,
        },
      }),
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
        }),
      },
    });

    expect(result.status).toBe('succeeded');
    const syncHeartbeats = requester.calls.filter((call) => {
      const body = (call.body || {}) as JsonRecord;
      return isRunActionCall(call, 'heartbeat') && body.status === 'syncing_skills';
    });
    expect(syncHeartbeats.length).toBeGreaterThan(1);
  });

  it('acknowledges cancellation observed while Skill sync is still running', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      cancelOnRunHeartbeatCall: 2,
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'codex',
            prompt: 'Cancel while syncing a project skill',
            cwd: '.',
            skillVersions: [
              {
                skillVersionId: '55555555-5555-4555-8555-555555555555',
                versionLabel: 'v1',
                source: {
                  type: 'zip',
                  archivePath: '/skills/opencode.zip',
                  sha256: 'solidified-sha256',
                },
              },
            ],
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        codex: {
          commandKey: 'codex',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 5,
      syncSkillVersion: async (options) => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          skillVersionId: options.skillVersion.skillVersionId,
          installPath: path.join(tempDir, 'skills', options.skillVersion.skillVersionId),
          idempotent: false,
          status: 'installed',
          sourceDigest: 'solidified-sha256',
        };
      },
      executeCommand: async () => {
        throw new Error('canceled sync should not execute command');
      },
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
        }),
      },
    });

    expect(result).toMatchObject({
      status: 'canceled',
      runId: 'run-1',
      reason: 'skill_sync_canceled',
    });
    expect(requester.calls.some((call) => isRunActionCall(call, 'cancelAck'))).toBe(true);
    expect(requester.calls.some((call) => isRunActionCall(call, 'complete'))).toBe(false);
  });

  it('acknowledges cancellation that arrives after final refresh before terminal completion', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      cancelOnRunHeartbeatCall: 5,
      failCompleteOnce: true,
      claimPayload: {
        claimed: true,
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: 1,
        run: {
          id: 'run-1',
          executionPayloadJson: {
            commandKey: 'node',
            args: ['-e', 'process.stdout.write("done")'],
            cwd: '.',
          },
        },
      },
    });
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      savedAt: new Date().toISOString(),
    });

    const result = await runDaemonOnce({
      gateway,
      allowlist: {
        node: {
          commandKey: 'node',
          executable: process.execPath,
          defaultTimeoutMs: 5000,
        },
      },
      workspaceRoot: workspace,
      skillsRoot: path.join(tempDir, 'skills'),
      artifactDir: path.join(tempDir, 'artifacts'),
      runHeartbeatIntervalMs: 60_000,
      detectOptions: {
        probeCommand: async (candidates) => ({
          available: candidates.includes('opencode'),
          command: candidates[0],
          version: 'opencode 1.0.0',
        }),
      },
    });

    expect(result).toMatchObject({
      status: 'canceled',
      runId: 'run-1',
    });
    expect(requester.calls.some((call) => isRunActionCall(call, 'complete'))).toBe(true);
    expect(requester.calls.some((call) => isRunActionCall(call, 'cancelAck'))).toBe(true);
  });
});
