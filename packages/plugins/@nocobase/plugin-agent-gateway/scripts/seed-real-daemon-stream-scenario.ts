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

import { createNodeToken, toStoredTokenFields } from '../src/server/security/tokens';
import {
  AdminScriptArgs,
  JsonRecord,
  findOneByFilter,
  getString,
  parseAdminArgs,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

interface SeedRealDaemonArgs extends AdminScriptArgs {
  profileKey: string;
  workspaceRoot: string;
  prompt: string;
  scenarioKey: string;
}

function normalizeScenarioKey(value: string) {
  const normalized = value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
  return normalized || 'real-daemon-stream';
}

async function parseArgs(argv: string[]): Promise<SeedRealDaemonArgs> {
  const adminArgs = parseAdminArgs(argv);
  const { flags } = parseAdminFlags(argv);
  const promptFile = getString(flags['prompt-file']);
  const prompt = getString(flags.prompt) || (promptFile ? (await fs.readFile(promptFile, 'utf8')).trim() : '');
  const workspaceRoot = getString(flags['workspace-root']);
  if (!prompt) {
    throw new Error('--prompt or --prompt-file is required');
  }
  if (!workspaceRoot) {
    throw new Error('--workspace-root is required');
  }
  return {
    ...adminArgs,
    profileKey: getString(flags['profile-key']) || 'codex',
    workspaceRoot,
    prompt,
    scenarioKey: normalizeScenarioKey(getString(flags['scenario-key']) || 'real-daemon-stream'),
  };
}

async function upsertNode(args: SeedRealDaemonArgs, token: string) {
  const nodeKey = `real-daemon-stream-${args.scenarioKey}`;
  const nodeToken = createNodeToken();
  const now = new Date().toISOString();
  const values = {
    nodeKey,
    displayName: `Real Daemon Stream (${args.scenarioKey})`,
    status: 'active',
    authMode: 'node-token',
    ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
    capabilitiesJson: {
      maxConcurrency: 1,
      supportsExecDriver: true,
      supportsArtifacts: true,
      supportsSnapshots: true,
      terminalStream: true,
      terminal: {
        backend: 'tmux',
        attach: true,
        input: true,
        interrupt: true,
        terminate: true,
      },
    },
    metadataJson: {
      seededBy: 'seed-real-daemon-stream-scenario',
      scenarioKey: args.scenarioKey,
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
  if (!node) {
    throw new Error('Seeded real daemon node could not be read back');
  }
  return {
    node,
    nodeKey,
    nodeToken: nodeToken.token,
  };
}

async function upsertProfile(args: SeedRealDaemonArgs, token: string, nodeId: string) {
  const values = {
    nodeId,
    profileKey: args.profileKey,
    displayName: `${args.profileKey} Real Daemon Stream`,
    agentType: 'code',
    driver: 'exec',
    status: 'active',
    capabilitiesJson: {
      maxConcurrency: 1,
      terminalStream: true,
      terminalBackend: 'tmux',
    },
    runtimeSnapshotJson: {
      seededAt: new Date().toISOString(),
      workspaceRoot: args.workspaceRoot,
    },
    metadataJson: {
      scenarioKey: args.scenarioKey,
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
    throw new Error('Seeded real daemon profile could not be read back');
  }
  return profile;
}

async function createConfigFile(args: SeedRealDaemonArgs, nodeId: string, nodeKey: string, nodeToken: string) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'agw-real-daemon-stream-'));
  const configPath = path.join(dir, 'daemon-config.json');
  await fs.writeFile(
    configPath,
    JSON.stringify(
      {
        serverUrl: args.baseUrl,
        nodeId,
        nodeKey,
        nodeToken,
        tokenLast4: nodeToken.slice(-4),
        heartbeatIntervalSeconds: 10,
        claimIntervalSeconds: 1,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  return configPath;
}

async function createRun(args: SeedRealDaemonArgs, token: string, nodeId: string, profileId: string) {
  const promptHash = createHash('sha256').update(args.prompt).digest('hex');
  const runCode = `agw_real_daemon_stream_${args.scenarioKey}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const data = await requestJson<JsonRecord>(args.baseUrl, '/api/agentGatewayApi:createRun', {
    method: 'POST',
    token,
    body: {
      runCode,
      sourceType: 'acceptance-smoke',
      nodeId,
      agentProfileId: profileId,
      promptSnapshot: {
        text: args.prompt,
        promptHash,
      },
      executionPayload: {
        mode: 'real-daemon-stream',
        commandKey: args.profileKey,
        profileKey: args.profileKey,
        args: args.profileKey === 'codex' ? ['exec', args.prompt] : ['run', args.prompt],
        cwd: '.',
        timeoutMs: 180_000,
        workspaceRoot: args.workspaceRoot,
        promptHash,
      },
    },
  });
  return {
    runId: getString(data.id),
    runCode,
    promptHash,
  };
}

async function main() {
  const args = await parseArgs(process.argv);
  const token = await signIn(args);
  const { node, nodeKey, nodeToken } = await upsertNode(args, token);
  const nodeId = getString(node.id);
  const profile = await upsertProfile(args, token, nodeId);
  const configPath = await createConfigFile(args, nodeId, nodeKey, nodeToken);
  const run = await createRun(args, token, nodeId, getString(profile.id));
  const output = {
    runId: run.runId,
    runCode: run.runCode,
    nodeId,
    nodeToken,
    profileKey: args.profileKey,
    configPath,
    workspaceRoot: args.workspaceRoot,
    promptHash: run.promptHash,
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
