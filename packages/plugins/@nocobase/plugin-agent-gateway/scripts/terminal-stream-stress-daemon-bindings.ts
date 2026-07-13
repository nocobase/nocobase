/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import WebSocket from 'ws';

import { TERMINAL_PROTOCOL, TERMINAL_STREAM_WS_PATH, TerminalFrame } from '../src/shared/terminalStreamProtocol';
import { createNodeToken, toStoredTokenFields } from '../src/server/security/tokens';
import {
  JsonRecord,
  findOneByFilter,
  getString,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

interface DaemonBindingStressArgs {
  serverUrl: string;
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
  scenarioKey: string;
  profileKey: string;
  workspaceRoot: string;
  bindings: number;
  expectError: string;
}

interface ClaimedRun {
  runId: string;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
}

function parseInteger(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv: string[]): DaemonBindingStressArgs {
  const { flags } = parseAdminFlags(argv);
  const serverUrl = getString(flags['server-url']).replace(/\/$/, '');
  const baseUrl = getString(flags['base-url'] || flags['server-url']).replace(/\/$/, '');
  const adminEmail = getString(flags['admin-email']);
  const adminPassword = getString(flags['admin-password']);
  const expectError = getString(flags['expect-error']);
  if (!serverUrl || !baseUrl || !adminEmail || !adminPassword || !expectError) {
    throw new Error('--server-url, --base-url, --admin-email, --admin-password, and --expect-error are required');
  }
  return {
    serverUrl,
    baseUrl,
    adminEmail,
    adminPassword,
    scenarioKey: getString(flags['scenario-key']) || 'daemon-binding-limit',
    profileKey: getString(flags['profile-key']) || 'codex',
    workspaceRoot: getString(flags['workspace-root']) || process.cwd(),
    bindings: parseInteger(getString(flags.bindings), 65),
    expectError,
  };
}

function buildWsUrl(serverUrl: string) {
  const url = new URL(TERMINAL_STREAM_WS_PATH, serverUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

function waitForOpen(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out opening daemon WebSocket')), 5000);
    ws.once('open', () => {
      clearTimeout(timer);
      resolve();
    });
    ws.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function waitForRequestFrame(ws: WebSocket, requestId: string) {
  return new Promise<TerminalFrame>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${requestId}`)), 8000);
    const onMessage = (data: WebSocket.RawData) => {
      const frame = JSON.parse(data.toString()) as TerminalFrame;
      if (!('requestId' in frame) || frame.requestId !== requestId) {
        return;
      }
      clearTimeout(timer);
      ws.off('message', onMessage);
      resolve(frame);
    };
    ws.on('message', onMessage);
  });
}

async function sendFrame(ws: WebSocket, frame: TerminalFrame | JsonRecord) {
  await new Promise<void>((resolve, reject) => {
    ws.send(JSON.stringify(frame), (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function upsertNode(args: DaemonBindingStressArgs, token: string) {
  const nodeKey = `terminal-stream-bindings-${args.scenarioKey}`;
  const nodeToken = createNodeToken();
  const now = new Date().toISOString();
  const values = {
    nodeKey,
    displayName: `Terminal Stream Bindings (${args.scenarioKey})`,
    status: 'active',
    authMode: 'node-token',
    ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
    capabilitiesJson: {
      maxConcurrency: args.bindings,
      terminalStream: true,
    },
    metadataJson: {
      seededBy: 'terminal-stream-stress-daemon-bindings',
      scenarioKey: args.scenarioKey,
      workspaceRoot: args.workspaceRoot,
      seededAt: now,
    },
    registeredAt: now,
    lastHeartbeatAt: now,
  };
  const existing = await findOneByFilter(args.baseUrl, token, 'agNodes', { nodeKey });
  if (existing) {
    await requestJson<JsonRecord>(args.baseUrl, `/api/agNodes:update/${encodeURIComponent(getString(existing.id))}`, {
      method: 'POST',
      token,
      body: values,
    });
  } else {
    await requestJson<JsonRecord>(args.baseUrl, '/api/agNodes:create', {
      method: 'POST',
      token,
      body: values,
    });
  }
  const node = await findOneByFilter(args.baseUrl, token, 'agNodes', { nodeKey });
  const nodeId = getString(node?.id);
  if (!nodeId) {
    throw new Error('Stress daemon node could not be read back');
  }
  return {
    nodeId,
    nodeToken: nodeToken.token,
  };
}

async function upsertProfile(args: DaemonBindingStressArgs, token: string, nodeId: string) {
  const values = {
    nodeId,
    profileKey: args.profileKey,
    displayName: `Terminal Stream Binding Stress ${args.profileKey}`,
    agentType: 'code',
    driver: 'fake',
    status: 'active',
    capabilitiesJson: {
      maxConcurrency: args.bindings,
      terminalStream: true,
    },
  };
  const existing = await findOneByFilter(args.baseUrl, token, 'agAgentProfiles', {
    nodeId,
    profileKey: args.profileKey,
  });
  if (existing) {
    await requestJson<JsonRecord>(
      args.baseUrl,
      `/api/agAgentProfiles:update/${encodeURIComponent(getString(existing.id))}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
  } else {
    await requestJson<JsonRecord>(args.baseUrl, '/api/agAgentProfiles:create', {
      method: 'POST',
      token,
      body: values,
    });
  }
  const profile = await findOneByFilter(args.baseUrl, token, 'agAgentProfiles', {
    nodeId,
    profileKey: args.profileKey,
  });
  if (!profile) {
    throw new Error('Stress daemon profile could not be read back');
  }
  return profile;
}

async function createAndClaimRun(
  args: DaemonBindingStressArgs,
  adminToken: string,
  nodeId: string,
  nodeToken: string,
  profileId: string,
  index: number,
) {
  const runCode = `agw_terminal_binding_${args.scenarioKey}_${index}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const created = await requestJson<JsonRecord>(args.baseUrl, '/api/agentGatewayApi:createRun', {
    method: 'POST',
    token: adminToken,
    body: {
      runCode,
      sourceType: 'acceptance-smoke',
      nodeId,
      agentProfileId: profileId,
      promptSnapshot: {
        text: `Terminal daemon binding stress ${index}`,
      },
      executionPayload: {
        mode: 'terminal-daemon-binding-stress',
        scenarioKey: args.scenarioKey,
        index,
        profileKey: args.profileKey,
      },
    },
  });
  const runId = getString(created.id);
  const claimed = await requestJson<JsonRecord>(
    args.baseUrl,
    `/api/agentGatewayApi:claimRun/${encodeURIComponent(nodeId)}`,
    {
      method: 'POST',
      nodeToken,
      body: {
        runId,
        profileKey: args.profileKey,
      },
    },
  );
  return {
    runId,
    claimToken: getString(claimed.claimToken),
    claimAttempt: Number(claimed.claimAttempt),
    leaseVersion: Number(claimed.leaseVersion),
  } satisfies ClaimedRun;
}

async function main() {
  const args = parseArgs(process.argv);
  const adminToken = await signIn({
    baseUrl: args.baseUrl,
    adminEmail: args.adminEmail,
    adminPassword: args.adminPassword,
  });
  const { nodeId, nodeToken } = await upsertNode(args, adminToken);
  const profile = await upsertProfile(args, adminToken, nodeId);
  const profileId = getString(profile.id);
  const runs: ClaimedRun[] = [];
  for (let index = 0; index < args.bindings; index += 1) {
    runs.push(await createAndClaimRun(args, adminToken, nodeId, nodeToken, profileId, index + 1));
  }

  const ws = new WebSocket(buildWsUrl(args.serverUrl), {
    headers: {
      Authorization: `Bearer ${nodeToken}`,
    },
  });
  const observedErrors: string[] = [];
  let successfulBindings = 0;

  try {
    await waitForOpen(ws);
    const registerRequestId = `binding-stress-register-${Date.now()}`;
    await sendFrame(ws, {
      type: 'daemon.register',
      protocol: TERMINAL_PROTOCOL,
      requestId: registerRequestId,
      nodeId,
      capabilities: {
        terminalStream: true,
      },
    });
    const registerFrame = await waitForRequestFrame(ws, registerRequestId);
    if (registerFrame.type !== 'ack') {
      throw new Error(`Daemon register failed: ${JSON.stringify(registerFrame)}`);
    }

    for (const [index, run] of runs.entries()) {
      const bindRequestId = `binding-stress-bind-${Date.now()}-${index}`;
      await sendFrame(ws, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: bindRequestId,
        runId: run.runId,
        sessionName: `agw_terminal_binding_stress_${index}`,
        startOffset: 0,
        claimToken: run.claimToken,
        claimAttempt: run.claimAttempt,
        leaseVersion: run.leaseVersion,
      });
      const frame = await waitForRequestFrame(ws, bindRequestId);
      if (frame.type === 'ack') {
        successfulBindings += 1;
        continue;
      }
      if (frame.type === 'error') {
        observedErrors.push(frame.code);
        break;
      }
    }

    const output = {
      nodeId,
      requestedBindings: args.bindings,
      successfulBindings,
      observedErrors,
      expectError: args.expectError,
      passed: observedErrors.includes(args.expectError),
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    if (!output.passed) {
      throw new Error(`Expected ${args.expectError}, observed ${observedErrors.join(', ') || 'no errors'}`);
    }
  } finally {
    ws.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
