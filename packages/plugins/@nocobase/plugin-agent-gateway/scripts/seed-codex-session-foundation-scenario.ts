/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { codexAdapter } from '../src/daemon/adapters/codex';
import { writeDaemonConfig } from '../src/daemon/config';
import { createNodeToken, toStoredTokenFields } from '../src/server/security/tokens';

interface SeedArgs {
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
  prompt: string;
  profileKey: string;
  workspaceRoot: string;
  printNodeToken: boolean;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function parseArgs(argv: string[]): Promise<SeedArgs> {
  const flags: Record<string, string> = {};
  const booleanFlags = new Set<string>();
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--')) {
      continue;
    }
    if (!value || value.startsWith('--')) {
      booleanFlags.add(key.slice(2));
      continue;
    }
    flags[key.slice(2)] = value;
    index += 1;
  }

  const promptFile = getString(flags['prompt-file']);
  const prompt = promptFile ? await fs.readFile(promptFile, 'utf8') : getString(flags.prompt);
  const baseUrl = getString(flags['base-url']).replace(/\/$/, '');
  const adminEmail = getString(flags['admin-email']);
  const adminPassword = getString(flags['admin-password']);
  const profileKey = getString(flags['profile-key']) || 'codex';
  const workspaceRoot = path.resolve(getString(flags['workspace-root']) || process.cwd());

  if (!baseUrl || !adminEmail || !adminPassword || !prompt) {
    throw new Error('--base-url, --admin-email, --admin-password, and --prompt or --prompt-file are required');
  }
  if (profileKey !== 'codex') {
    throw new Error('Task 01 browser validation supports --profile-key codex');
  }

  return {
    baseUrl,
    adminEmail,
    adminPassword,
    prompt,
    profileKey,
    workspaceRoot,
    printNodeToken: booleanFlags.has('print-node-token'),
  };
}

function unwrapResponse(json: unknown): unknown {
  const record = isRecord(json) ? json : {};
  const data = record.data;
  if (isRecord(data) && Object.prototype.hasOwnProperty.call(data, 'data')) {
    return data.data;
  }
  return data === undefined ? record : data;
}

async function requestJson<T>(
  args: SeedArgs,
  requestPath: string,
  options: { method?: 'GET' | 'POST'; token?: string; body?: JsonRecord } = {},
) {
  const response = await fetch(new URL(requestPath, args.baseUrl), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'X-Authenticator': 'basic',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as unknown) : {};
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${requestPath}: ${text}`);
  }
  return unwrapResponse(json) as T;
}

async function signIn(args: SeedArgs) {
  const data = await requestJson<JsonRecord>(args, '/api/auth:signIn', {
    method: 'POST',
    body: {
      account: args.adminEmail,
      password: args.adminPassword,
    },
  });
  const token = getString(data.token);
  if (!token) {
    throw new Error('Sign-in response did not include a token');
  }
  return token;
}

function getListItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }
  if (isRecord(value) && Array.isArray(value.data)) {
    return value.data.filter(isRecord);
  }
  return [];
}

async function findOneByFilter(args: SeedArgs, token: string, collection: string, filter: JsonRecord) {
  const search = new URLSearchParams();
  search.set('filter', JSON.stringify(filter));
  const data = await requestJson<unknown>(args, `/api/${collection}:list?${search.toString()}`, {
    token,
  });
  return getListItems(data)[0] || null;
}

async function upsertNode(args: SeedArgs, token: string) {
  const nodeKey = 'local-codex-agent-gateway';
  const nodeToken = createNodeToken();
  const tokenFields = toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4');
  const now = new Date().toISOString();
  const values = {
    nodeKey,
    displayName: 'Local Codex Agent',
    status: 'active',
    authMode: 'node-token',
    ...tokenFields,
    capabilitiesJson: {
      maxConcurrency: 1,
      supportsExecDriver: true,
      supportsArtifacts: true,
      supportsSnapshots: true,
      terminal: {
        backend: 'tmux',
        attach: true,
      },
    },
    metadataJson: {
      seededBy: 'seed-codex-session-foundation-scenario',
      seededAt: now,
    },
    registeredAt: now,
    lastHeartbeatAt: now,
  };
  const existing = await findOneByFilter(args, token, 'agNodes', { nodeKey });
  if (existing) {
    await requestJson<JsonRecord>(args, `/api/agNodes:update/${encodeURIComponent(getString(existing.id))}`, {
      method: 'POST',
      token,
      body: values,
    });
  } else {
    await requestJson<JsonRecord>(args, '/api/agNodes:create', {
      method: 'POST',
      token,
      body: values,
    });
  }
  const node = await findOneByFilter(args, token, 'agNodes', { nodeKey });
  if (!node) {
    throw new Error('Seeded node could not be read back');
  }

  return {
    node,
    nodeKey,
    nodeToken: nodeToken.token,
  };
}

async function upsertProfile(args: SeedArgs, token: string, nodeId: string, profileKey: string) {
  const values = {
    nodeId,
    profileKey,
    displayName: 'Codex',
    agentType: 'code',
    driver: 'exec',
    status: 'active',
    capabilitiesJson: codexAdapter.capabilities,
    runtimeSnapshotJson: {
      seededAt: new Date().toISOString(),
    },
    metadataJson: {
      provider: profileKey,
    },
  };
  const existing = await findOneByFilter(args, token, 'agAgentProfiles', { nodeId, profileKey });
  if (existing) {
    await requestJson<JsonRecord>(args, `/api/agAgentProfiles:update/${encodeURIComponent(getString(existing.id))}`, {
      method: 'POST',
      token,
      body: values,
    });
  } else {
    await requestJson<JsonRecord>(args, '/api/agAgentProfiles:create', {
      method: 'POST',
      token,
      body: values,
    });
  }
  const profile = await findOneByFilter(args, token, 'agAgentProfiles', { nodeId, profileKey });
  if (!profile) {
    throw new Error('Seeded profile could not be read back');
  }
  return profile;
}

async function createRun(args: SeedArgs, token: string, nodeId: string, profileId: string) {
  const runCode = `agw_session_foundation_codex_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const command = codexAdapter.buildStartCommand({
    prompt: args.prompt,
    cwd: '.',
  });
  return await requestJson<JsonRecord>(args, '/api/agent-gateway/runs:create', {
    method: 'POST',
    token,
    body: {
      runCode,
      sourceType: 'browser-validation',
      promptSnapshot: {
        text: args.prompt,
      },
      executionPayload: {
        commandKey: command.commandKey,
        profileKey: args.profileKey,
        args: command.args,
        cwd: command.cwd || '.',
      },
      nodeId,
      agentProfileId: profileId,
    },
  });
}

async function main() {
  const args = await parseArgs(process.argv);
  const token = await signIn(args);
  const { node, nodeKey, nodeToken } = await upsertNode(args, token);
  const nodeId = getString(node.id);
  const profile = await upsertProfile(args, token, nodeId, args.profileKey);
  const profileId = getString(profile.id);
  const run = await createRun(args, token, nodeId, profileId);
  const runId = getString(run.id);
  const configPath = path.join(os.tmpdir(), `agent-gateway-codex-session-foundation-${runId}.json`);
  await writeDaemonConfig(
    {
      serverUrl: args.baseUrl,
      nodeId,
      nodeKey,
      nodeToken,
      tokenLast4: nodeToken.slice(-4),
      heartbeatIntervalSeconds: 30,
      claimIntervalSeconds: 10,
      savedAt: new Date().toISOString(),
    },
    configPath,
  );

  const output = {
    runId,
    runCode: getString(run.runCode),
    nodeId,
    nodeKey,
    tokenLast4: nodeToken.slice(-4),
    profileKey: args.profileKey,
    configPath,
    promptHash: createHash('sha256').update(args.prompt).digest('hex'),
    nodeTokenOutput: args.printNodeToken ? 'included' : 'omitted; read from configPath',
    ...(args.printNodeToken ? { nodeToken } : {}),
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
