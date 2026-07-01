/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

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

interface SeedSmokeArgs extends AdminScriptArgs {
  scenarioKey: string;
  freshRun: boolean;
}

const PROFILE_KEY = 'opencode';

function normalizeScenarioKey(value: string) {
  const normalized = value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
  return normalized || 'protocol-smoke';
}

function parseArgs(argv: string[]): SeedSmokeArgs {
  const adminArgs = parseAdminArgs(argv);
  const { flags, booleanFlags } = parseAdminFlags(argv);
  const scenarioKey = normalizeScenarioKey(getString(flags['scenario-key']) || 'protocol-smoke');
  return {
    ...adminArgs,
    scenarioKey,
    freshRun: booleanFlags.has('fresh-run') || getString(flags['fresh-run']) !== 'false',
  };
}

async function upsertNode(args: SeedSmokeArgs, token: string) {
  const nodeKey = `terminal-stream-smoke-${args.scenarioKey}`;
  const nodeToken = createNodeToken();
  const now = new Date().toISOString();
  const values = {
    nodeKey,
    displayName: `Terminal Stream Smoke (${args.scenarioKey})`,
    status: 'active',
    authMode: 'node-token',
    ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
    capabilitiesJson: {
      maxConcurrency: 1,
      terminalStream: true,
      supportsExecDriver: false,
      supportsArtifacts: false,
      supportsSnapshots: false,
    },
    metadataJson: {
      seededBy: 'seed-terminal-stream-smoke-scenario',
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
    throw new Error('Seeded smoke node could not be read back');
  }
  return {
    node,
    nodeKey,
    nodeToken: nodeToken.token,
  };
}

async function upsertProfile(args: SeedSmokeArgs, token: string, nodeId: string) {
  const values = {
    nodeId,
    profileKey: PROFILE_KEY,
    displayName: 'OpenCode Protocol Smoke',
    agentType: 'code',
    driver: 'fake',
    status: 'active',
    capabilitiesJson: {
      maxConcurrency: 1,
      terminalStream: true,
    },
    runtimeSnapshotJson: {
      seededAt: new Date().toISOString(),
    },
    metadataJson: {
      scenarioKey: args.scenarioKey,
    },
  };
  const existing = await findOneByFilter(args.baseUrl, token, 'agAgentProfiles', {
    nodeId,
    profileKey: PROFILE_KEY,
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
    profileKey: PROFILE_KEY,
  });
  if (!profile) {
    throw new Error('Seeded smoke profile could not be read back');
  }
  return profile;
}

async function createFreshRun(args: SeedSmokeArgs, nodeId: string, nodeToken: string) {
  const runCode = `agw_terminal_stream_smoke_${args.scenarioKey}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const data = await requestJson<JsonRecord>(
    args.baseUrl,
    `/api/agent-gateway/nodes/${encodeURIComponent(nodeId)}/smoke-runs:create`,
    {
      method: 'POST',
      nodeToken,
      body: {
        runCode,
        profileKey: PROFILE_KEY,
        promptSnapshot: {
          text: `Terminal stream protocol smoke: ${args.scenarioKey}`,
        },
        executionPayload: {
          mode: 'terminal-stream-protocol-smoke',
          scenarioKey: args.scenarioKey,
          profileKey: PROFILE_KEY,
        },
      },
    },
  );
  return {
    runId: getString(data.runId),
    runCode,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.freshRun) {
    throw new Error('--fresh-run is required for terminal stream smoke browser validation');
  }
  const token = await signIn(args);
  const { node, nodeToken } = await upsertNode(args, token);
  const nodeId = getString(node.id);
  await upsertProfile(args, token, nodeId);
  const run = await createFreshRun(args, nodeId, nodeToken);
  const output = {
    runId: run.runId,
    runCode: run.runCode,
    scenarioKey: args.scenarioKey,
    nodeId,
    nodeToken,
    profileKey: PROFILE_KEY,
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
