/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import { stdin } from 'process';
import path from 'path';

import { AgentGatewayApiClient } from './apiClient';
import { getDefaultConfigPath, readDaemonConfig } from './config';
import { AgentGatewayDaemonNodeClient } from './gateway';
import { ExecCommandAllowlist, executeAllowlistedCommand } from './execDriver';
import { runOpenCodeSmoke } from './openCodeSmoke';
import { detectAgentProfiles } from './profileDetection';
import { heartbeatDaemonNode, registerDaemonNode } from './registration';
import { runDaemonLoop, runDaemonOnce } from './runner';
import { SkillVersionSource, syncNodeSkillVersion } from './skillSync';
import { JsonRecord } from './types';

interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [, , command = 'help', ...args] = argv;
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return {
    command,
    flags,
  };
}

function getFlagString(flags: Record<string, string | boolean>, key: string) {
  const value = flags[key];
  return typeof value === 'string' ? value.trim() : '';
}

function getFlagNumber(flags: Record<string, string | boolean>, key: string, fallback: number) {
  const rawValue = getFlagString(flags, key);
  const numberValue = Number(rawValue);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

async function getRegisterNodeKey(flags: Record<string, string | boolean>) {
  const explicitNodeKey = getFlagString(flags, 'node-key');
  if (explicitNodeKey) {
    return explicitNodeKey;
  }

  try {
    const config = await readDaemonConfig(getFlagString(flags, 'config') || undefined);
    return config.nodeKey;
  } catch {
    return undefined;
  }
}

function getDaemonDataPath(...segments: string[]) {
  return path.join(path.dirname(getDefaultConfigPath()), ...segments);
}

function getDefaultAllowlist(): ExecCommandAllowlist {
  return {
    opencode: {
      commandKey: 'opencode',
      executable: 'opencode',
      allowedEnvKeys: ['NOCOBASE_API_BASE_URL', 'NOCOBASE_ADMIN_URL', 'NOCOBASE_API_TOKEN'],
      defaultTimeoutMs: 30 * 60 * 1000,
    },
    codex: {
      commandKey: 'codex',
      executable: 'codex',
      allowedEnvKeys: [],
      defaultTimeoutMs: 30 * 60 * 1000,
    },
    'claude-code': {
      commandKey: 'claude-code',
      executable: 'claude',
      allowedEnvKeys: [],
      defaultTimeoutMs: 30 * 60 * 1000,
    },
  };
}

async function readStdin() {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

function printJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function parseJsonRecord(rawValue: string, flagName: string) {
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (Object.prototype.toString.call(parsed) === '[object Object]') {
      return parsed as JsonRecord;
    }
  } catch {
    throw new Error(`${flagName} must be valid JSON`);
  }
  throw new Error(`${flagName} must be a JSON object`);
}

function parseJsonStringArray(rawValue: string, flagName: string) {
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    throw new Error(`${flagName} must be valid JSON`);
  }
  throw new Error(`${flagName} must be a JSON string array`);
}

function isSkillVersionSource(value: unknown): value is SkillVersionSource {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }
  const source = value as Record<string, unknown>;
  if (source.type === 'zip') {
    return (
      typeof source.sha256 === 'string' &&
      (typeof source.archivePath === 'string' || typeof source.archiveUrl === 'string')
    );
  }
  if (source.type === 'github') {
    return (
      typeof source.repoUrl === 'string' &&
      (typeof source.commitSha === 'string' || typeof source.archiveUrl === 'string')
    );
  }
  return false;
}

async function getSkillSource(flags: Record<string, string | boolean>) {
  const sourceJson = getFlagString(flags, 'skill-source-json');
  const sourceFile = getFlagString(flags, 'skill-source-file');
  const source = sourceJson
    ? parseJsonRecord(sourceJson, '--skill-source-json')
    : sourceFile
      ? parseJsonRecord(await fs.readFile(sourceFile, 'utf8'), '--skill-source-file')
      : {};
  if (!isSkillVersionSource(source)) {
    throw new Error('--skill-source-json or --skill-source-file must define an immutable zip/github Skill source');
  }
  return source;
}

async function handleRegister(flags: Record<string, string | boolean>) {
  const serverUrl = getFlagString(flags, 'server-url');
  if (!serverUrl) {
    throw new Error('--server-url is required');
  }
  const inviteToken = flags['invite-token-stdin'] === true ? await readStdin() : getFlagString(flags, 'invite-token');
  if (!inviteToken) {
    throw new Error('--invite-token or --invite-token-stdin is required');
  }

  const requester = new AgentGatewayApiClient(serverUrl);
  const configPath = getFlagString(flags, 'config') || undefined;
  const result = await registerDaemonNode({
    requester,
    serverUrl,
    inviteToken,
    configPath,
    nodeKey: await getRegisterNodeKey(flags),
  });
  printJson(result);
}

async function handleHeartbeat(flags: Record<string, string | boolean>) {
  const config = await readDaemonConfig(getFlagString(flags, 'config') || undefined);
  const requester = new AgentGatewayApiClient(config.serverUrl);
  const profiles = await detectAgentProfiles();
  const result = await heartbeatDaemonNode({
    requester,
    config,
    profiles,
  });
  printJson(result);
}

async function handleRun(flags: Record<string, string | boolean>) {
  const baseConfig = await readDaemonConfig(getFlagString(flags, 'config') || undefined);
  const config = {
    ...baseConfig,
    serverUrl: getFlagString(flags, 'server-url') || baseConfig.serverUrl,
    nodeId: getFlagString(flags, 'node-id') || baseConfig.nodeId,
    nodeToken: getFlagString(flags, 'node-token') || baseConfig.nodeToken,
    tokenLast4: getFlagString(flags, 'node-token')
      ? getFlagString(flags, 'node-token').slice(-4)
      : baseConfig.tokenLast4,
  };
  const requester = new AgentGatewayApiClient(config.serverUrl, getFlagNumber(flags, 'request-timeout-ms', 30_000));
  const gateway = new AgentGatewayDaemonNodeClient(requester, config);
  const runOptions = {
    gateway,
    allowlist: getDefaultAllowlist(),
    workspaceRoot: path.resolve(getFlagString(flags, 'workspace-root') || process.cwd()),
    skillsRoot: path.resolve(getFlagString(flags, 'skills-root') || getDaemonDataPath('skills')),
    artifactDir: path.resolve(getFlagString(flags, 'artifact-dir') || getDaemonDataPath('artifacts')),
    terminalBackend: getFlagString(flags, 'terminal-backend') === 'exec' ? ('exec' as const) : ('tmux' as const),
    claimProfileKey: getFlagString(flags, 'profile-key') || undefined,
    claimRunId: getFlagString(flags, 'run-id') || undefined,
    pollIntervalMs: getFlagNumber(
      flags,
      'poll-interval-ms',
      config.claimIntervalSeconds ? config.claimIntervalSeconds * 1000 : 10_000,
    ),
    runHeartbeatIntervalMs: getFlagNumber(flags, 'run-heartbeat-interval-ms', 10_000),
  };
  if (flags.once === true) {
    printJson(await runDaemonOnce(runOptions));
    return;
  }

  const stopController = new AbortController();
  const stop = () => {
    stopController.abort();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  await runDaemonLoop({
    ...runOptions,
    stopSignal: stopController.signal,
  });
}

async function handleSmokeOpenCode(flags: Record<string, string | boolean>) {
  const skillVersionId = getFlagString(flags, 'skill-version-id');
  if (!skillVersionId) {
    throw new Error('--skill-version-id is required');
  }
  const config = await readDaemonConfig(getFlagString(flags, 'config') || undefined);
  const requester = new AgentGatewayApiClient(config.serverUrl, getFlagNumber(flags, 'request-timeout-ms', 30_000));
  const gateway = new AgentGatewayDaemonNodeClient(requester, config);
  const workspaceRoot = path.resolve(getFlagString(flags, 'workspace-root') || process.cwd());
  const artifactDir = path.resolve(getFlagString(flags, 'artifact-dir') || getDaemonDataPath('artifacts'));
  const prompt = getFlagString(flags, 'prompt') || 'Create a minimal NocoBase UI build smoke result.';
  const opencodeArgs = getFlagString(flags, 'opencode-args-json')
    ? parseJsonStringArray(getFlagString(flags, 'opencode-args-json'), '--opencode-args-json')
    : ['run', prompt];
  const skillSource = await getSkillSource(flags);

  const result = await runOpenCodeSmoke({
    gateway,
    prompt,
    skillVersion: {
      skillVersionId,
      versionLabel: getFlagString(flags, 'skill-version-label') || skillVersionId,
      source: skillSource,
    },
    syncSkillVersion: async (skillVersion) =>
      await syncNodeSkillVersion({
        nodeId: gateway.nodeId,
        skillsRoot: path.resolve(getFlagString(flags, 'skills-root') || getDaemonDataPath('skills')),
        skillVersion,
        downloadHeaders: gateway.getNodeAuthHeaders(),
        trustedArchiveServerUrl: gateway.serverUrl,
        writeInstallStatus: async (installPayload) => {
          await gateway.upsertSkillInstall(installPayload);
        },
      }),
    executeOpenCode: async (signals) =>
      await executeAllowlistedCommand({
        commandKey: 'opencode',
        allowlist: getDefaultAllowlist(),
        args: opencodeArgs,
        cwd: workspaceRoot,
        workspaceRoot,
        artifactDir,
        cancelSignal: signals.cancelSignal,
        leaseLostSignal: signals.leaseLostSignal,
      }),
  });
  printJson(result);
}

async function handleDetectProfiles() {
  printJson(await detectAgentProfiles());
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: agent-gateway-daemon <command> [options]',
      '',
      'Commands:',
      '  register --server-url <url> --invite-token <token>',
      '  register --server-url <url> --invite-token-stdin',
      '  heartbeat [--config <path>]',
      '  run [--config <path>] [--server-url <url>] [--node-id <id>] [--node-token <token>]',
      '      [--once] [--profile-key <key>] [--run-id <id>] [--workspace-root <path>]',
      '      [--terminal-backend tmux|exec]',
      '  smoke-opencode --skill-version-id <id> --skill-source-json <json> [--workspace-root <path>]',
      '  detect-profiles',
      '',
    ].join('\n'),
  );
}

export async function runCli(argv: string[]) {
  const { command, flags } = parseArgs(argv);
  if (command === 'register') {
    await handleRegister(flags);
    return;
  }
  if (command === 'heartbeat') {
    await handleHeartbeat(flags);
    return;
  }
  if (command === 'run') {
    await handleRun(flags);
    return;
  }
  if (command === 'smoke-opencode') {
    await handleSmokeOpenCode(flags);
    return;
  }
  if (command === 'detect-profiles') {
    await handleDetectProfiles();
    return;
  }
  printHelp();
}
