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

import { AgentGatewayDaemonNodeClient } from '../gateway';
import { runDaemonOnce } from '../runner';
import { terminateTmuxSession } from '../tmuxTerminal';
import { GatewayRequestOptions, GatewayRequester, JsonRecord } from '../types';

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
      failCompleteOnce?: boolean;
      failAgentSessionUpsertOnce?: boolean;
    } = {},
  ) {
    this.failCompleteOnce = Boolean(options.failCompleteOnce);
    this.failAgentSessionUpsertOnce = Boolean(options.failAgentSessionUpsertOnce);
  }

  private getDefaultClaimPayload() {
    return {
      claimed: true,
      runId: 'run-1',
      claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
      claimAttempt: 1,
      leaseVersion: 1,
      run: {
        id: 'run-1',
        executionPayloadJson: {
          commandKey: 'node',
          args: ['-e', 'process.stdout.write("runner complete token=RUNNER_TOKEN_SECRET")'],
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
    };
  }

  async request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T> {
    this.calls.push(options);
    if (options.path.endsWith('/heartbeat') && options.path.includes('/runs/')) {
      if (this.options.heartbeatDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.options.heartbeatDelayMs));
      }
      this.runHeartbeatCount += 1;
      this.leaseVersion += 1;
      return {
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: this.leaseVersion,
        cancelRequested: this.options.cancelOnRunHeartbeatCall === this.runHeartbeatCount,
      } as T;
    }
    if (options.path.endsWith('/runs:claim')) {
      return (this.options.claimPayload || this.getDefaultClaimPayload()) as T;
    }
    if (this.failCompleteOnce && options.path.endsWith('/complete')) {
      this.failCompleteOnce = false;
      throw new Error('Run is canceling');
    }
    if (this.failAgentSessionUpsertOnce && options.path.endsWith('/agent-session:upsert')) {
      this.failAgentSessionUpsertOnce = false;
      throw new Error('transient session upsert failure');
    }
    if (this.options.enforceTerminalLeaseVersion && /\/(complete|fail|timeout|cancel-ack)$/.test(options.path)) {
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

describe('agent gateway daemon runner', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-daemon-runner-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('claims, syncs the selected Skill version, executes through allowlist, and terminalizes the run', async () => {
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
        '/api/agent-gateway/nodes/node-1/heartbeat',
        '/api/agent-gateway/nodes/node-1/runs:claim',
        '/api/agent-gateway/nodes/node-1/skill-installs:upsert',
        '/api/agent-gateway/runs/run-1/events:append',
        '/api/agent-gateway/runs/run-1/snapshots:register',
        '/api/agent-gateway/nodes/node-1/runs/run-1/complete',
      ]),
    );
    expect(JSON.stringify(requester.calls)).not.toContain('RUNNER_TOKEN_SECRET');
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
    const claimCall = requester.calls.find((call) => call.path.endsWith('/runs:claim'));
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
    const upsertCall = requester.calls.find((call) => call.path.endsWith('/agent-session:upsert'));
    expect(upsertCall).toBeTruthy();
    expect(upsertCall?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
      capabilities: {
        detectSessionId: true,
        resumeWithMessage: true,
      },
    });
  });

  it('retries transient Codex provider session upsert failures before completing the run', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      failAgentSessionUpsertOnce: true,
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
    const upsertCalls = requester.calls.filter((call) => call.path.endsWith('/agent-session:upsert'));
    expect(upsertCalls).toHaveLength(2);
    expect(upsertCalls[1]?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1ea4-0ea4-7ef4-a911-f9f986f377e5',
      metadata: {
        upsertAttempt: 2,
      },
    });
    expect(requester.calls.some((call) => call.path.endsWith('/complete'))).toBe(true);
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
    const upsertCall = requester.calls.find((call) => call.path.endsWith('/agent-session:upsert'));
    expect(upsertCall?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1e94-8f39-7dc0-b035-61fb2a364d30',
    });
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
                'process.stdout.write("x".repeat(66 * 1024));',
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
      const upsertCall = requester.calls.find((call) => call.path.endsWith('/agent-session:upsert'));
      expect(upsertCall?.body).toMatchObject({
        provider: 'codex',
        providerSessionId: '019f1eb9-2c3a-7f77-9004-8c81f7abf7b1',
      });
    } finally {
      await terminateTmuxSession('ag-run-run-1').catch(() => {
        // The completed session may already have been removed.
      });
    }
  });

  it('truncates multi-megabyte log artifacts and still completes the run', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const largeLogPath = path.join(tempDir, 'large-stdout.log');
    await fs.writeFile(largeLogPath, Buffer.alloc(1100 * 1024, 65));
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
          sizeBytes: 1100 * 1024,
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
    const artifactCall = requester.calls.find((call) => call.path.endsWith('/artifacts:register'));
    expect(artifactCall).toBeTruthy();
    const artifactBody = (artifactCall?.body || {}) as JsonRecord;
    expect(String(artifactBody.contentText).length).toBeLessThan(1024 * 1024);
    expect(artifactBody.metadata).toMatchObject({
      originalSizeBytes: 1100 * 1024,
      truncated: true,
    });
    expect(requester.calls.some((call) => call.path.endsWith('/complete'))).toBe(true);
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
    const completeCall = requester.calls.find((call) => call.path.endsWith('/complete'));
    expect(completeCall).toBeTruthy();
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
    expect(requester.calls.some((call) => call.path.endsWith('/cancel-ack'))).toBe(true);
    expect(requester.calls.some((call) => call.path.endsWith('/complete'))).toBe(false);
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
    const upsertIndex = requester.calls.findIndex((call) => call.path.endsWith('/agent-session:upsert'));
    const cancelAckIndex = requester.calls.findIndex((call) => call.path.endsWith('/cancel-ack'));
    expect(upsertIndex).toBeGreaterThanOrEqual(0);
    expect(cancelAckIndex).toBeGreaterThan(upsertIndex);
    expect(requester.calls[upsertIndex]?.body).toMatchObject({
      provider: 'codex',
      providerSessionId: '019f1ed9-c5f6-7505-af97-24f968db949f',
    });
  });

  it('keeps the run lease alive while Skill sync is still running', async () => {
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
      return call.path.endsWith('/heartbeat') && body.status === 'syncing_skills';
    });
    expect(syncHeartbeats.length).toBeGreaterThan(1);
  });

  it('acknowledges cancellation observed while Skill sync is still running', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      cancelOnRunHeartbeatCall: 2,
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
    expect(requester.calls.some((call) => call.path.endsWith('/cancel-ack'))).toBe(true);
    expect(requester.calls.some((call) => call.path.endsWith('/complete'))).toBe(false);
  });

  it('acknowledges cancellation that arrives after final refresh before terminal completion', async () => {
    const workspace = path.join(tempDir, 'workspace');
    await fs.mkdir(workspace, { recursive: true });
    const requester = new RunnerRequester({
      cancelOnRunHeartbeatCall: 4,
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
    expect(requester.calls.some((call) => call.path.endsWith('/complete'))).toBe(true);
    expect(requester.calls.some((call) => call.path.endsWith('/cancel-ack'))).toBe(true);
  });
});
