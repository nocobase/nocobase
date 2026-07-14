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

import {
  EXTERNAL_IMPORTED_RUN_STATUSES,
  EXTERNAL_LOG_FORMATS,
  ExternalImportedRunStatus,
  ExternalLogFormat,
} from '../shared/externalRunImport';
import { AgentGatewayApiClient } from './apiClient';
import { createDefaultExecutionPolicies, getDefaultConfigPath, readDaemonConfig } from './config';
import { AgentGatewayDaemonNodeClient } from './gateway';
import { uploadExternalRun } from './externalRunUploader';
import { detectAgentProfiles } from './profileDetection';
import { heartbeatDaemonNode, registerDaemonNode } from './registration';
import { runDaemonLoop, runDaemonOnce } from './runner';
import { JsonRecord } from './types';

interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean | string[]>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [, , command = 'help', ...args] = argv;
  const flags: Record<string, string | boolean | string[]> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const next = args[index + 1];
    const value = !next || next.startsWith('--') ? true : next;
    if (value !== true) {
      index += 1;
    }
    const existing = flags[key];
    if (existing === undefined) {
      flags[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(String(value));
    } else {
      flags[key] = [String(existing), String(value)];
    }
  }
  return {
    command,
    flags,
  };
}

function getFlagString(flags: Record<string, string | boolean | string[]>, key: string) {
  const value = flags[key];
  if (Array.isArray(value)) {
    return getString(value[value.length - 1]);
  }
  return typeof value === 'string' ? value.trim() : '';
}

function getFlagStrings(flags: Record<string, string | boolean | string[]>, key: string) {
  const value = flags[key];
  if (Array.isArray(value)) {
    return value.map(getString).filter(Boolean);
  }
  return typeof value === 'string' && value.trim() ? [value.trim()] : [];
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getFlagNumber(flags: Record<string, string | boolean | string[]>, key: string, fallback: number) {
  const rawValue = getFlagString(flags, key);
  const numberValue = Number(rawValue);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

async function getRegisterIdentity(flags: Record<string, string | boolean | string[]>) {
  const explicitNodeKey = getFlagString(flags, 'node-key');
  try {
    const config = await readDaemonConfig(getFlagString(flags, 'config') || undefined);
    return {
      nodeKey: explicitNodeKey || config.nodeKey,
      installationId: config.installationId,
    };
  } catch {
    return {
      nodeKey: explicitNodeKey || undefined,
    };
  }
}

function getDaemonDataPath(...segments: string[]) {
  return path.join(path.dirname(getDefaultConfigPath()), ...segments);
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
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

function getDefaultExternalLogFormat(provider: string) {
  if (provider === 'codex') {
    return 'codex-jsonl';
  }
  if (provider === 'opencode') {
    return 'opencode-jsonl';
  }
  if (provider === 'claude-code') {
    return 'claude-code-jsonl';
  }
  return 'text';
}

function getExternalLogFormat(flags: Record<string, string | boolean | string[]>, provider: string): ExternalLogFormat {
  const format = getFlagString(flags, 'format') || getDefaultExternalLogFormat(provider);
  if (!EXTERNAL_LOG_FORMATS.includes(format as ExternalLogFormat)) {
    throw new Error(`--format must be one of: ${EXTERNAL_LOG_FORMATS.join(', ')}`);
  }
  return format as ExternalLogFormat;
}

function getExternalRunStatus(flags: Record<string, string | boolean | string[]>) {
  const status = getFlagString(flags, 'status');
  if (!status) {
    return undefined;
  }
  if (!EXTERNAL_IMPORTED_RUN_STATUSES.includes(status as ExternalImportedRunStatus)) {
    throw new Error(`--status must be one of: ${EXTERNAL_IMPORTED_RUN_STATUSES.join(', ')}`);
  }
  return status as ExternalImportedRunStatus;
}

async function handleRegister(flags: Record<string, string | boolean | string[]>) {
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
  const identity = await getRegisterIdentity(flags);
  const result = await registerDaemonNode({
    requester,
    serverUrl,
    inviteToken,
    configPath,
    nodeKey: identity.nodeKey,
    installationId: identity.installationId,
    executionPolicies: createDefaultExecutionPolicies(
      path.resolve(getFlagString(flags, 'workspace-root') || process.cwd()),
    ),
  });
  printJson(result);
}

async function handleHeartbeat(flags: Record<string, string | boolean | string[]>) {
  const config = await readDaemonConfig(getFlagString(flags, 'config') || undefined);
  const requester = new AgentGatewayApiClient(config.serverUrl);
  const profiles = await detectAgentProfiles({
    executionPolicies: config.executionPolicies,
  });
  const result = await heartbeatDaemonNode({
    requester,
    config,
    profiles,
  });
  printJson(result);
}

async function handleRun(flags: Record<string, string | boolean | string[]>) {
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
  const stopController = new AbortController();
  const requester = new AgentGatewayApiClient(
    config.serverUrl,
    getFlagNumber(flags, 'request-timeout-ms', 30_000),
    stopController.signal,
  );
  const gateway = new AgentGatewayDaemonNodeClient(requester, config);
  const runOptions = {
    gateway,
    executionPolicies: config.executionPolicies,
    skillsRoot: path.resolve(getFlagString(flags, 'skills-root') || getDaemonDataPath('skills')),
    artifactDir: path.resolve(getFlagString(flags, 'artifact-dir') || getDaemonDataPath('artifacts')),
    terminalBackend: getFlagString(flags, 'terminal-backend') === 'exec' ? ('exec' as const) : ('tmux' as const),
    detectOptions: {
      executionPolicies: config.executionPolicies,
    },
    claimProfileKey: getFlagString(flags, 'profile-key') || undefined,
    claimRunId: getFlagString(flags, 'run-id') || undefined,
    pollIntervalMs: getFlagNumber(
      flags,
      'poll-interval-ms',
      config.claimIntervalSeconds ? config.claimIntervalSeconds * 1000 : 10_000,
    ),
    nodeHeartbeatIntervalMs: getFlagNumber(
      flags,
      'node-heartbeat-interval-ms',
      config.heartbeatIntervalSeconds ? config.heartbeatIntervalSeconds * 1000 : 30_000,
    ),
    runHeartbeatIntervalMs: getFlagNumber(flags, 'run-heartbeat-interval-ms', 10_000),
  };
  if (flags.once === true) {
    printJson(await runDaemonOnce(runOptions));
    return;
  }

  const stop = () => {
    stopController.abort();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  await runDaemonLoop({
    ...runOptions,
    stopSignal: stopController.signal,
    onLoopError: (error, state) => {
      process.stderr.write(
        [
          new Date().toISOString(),
          'Agent Gateway daemon loop error; retrying',
          `source=${state.source}`,
          `failureCount=${state.failureCount}`,
          `retryDelayMs=${state.retryDelayMs}`,
          `error=${getErrorMessage(error)}`,
        ].join(' '),
      );
      process.stderr.write('\n');
    },
  });
}

async function getExternalImportServerUrl(flags: Record<string, string | boolean | string[]>) {
  const explicitServerUrl = getFlagString(flags, 'server-url');
  if (explicitServerUrl) {
    return explicitServerUrl;
  }
  const config = await readDaemonConfig(getFlagString(flags, 'config') || undefined);
  return config.serverUrl;
}

async function handleImportExternalRun(flags: Record<string, string | boolean | string[]>) {
  const apiToken = getFlagString(flags, 'api-token');
  if (!apiToken) {
    throw new Error('--api-token is required');
  }
  const externalRunKey = getFlagString(flags, 'external-run-key');
  const runCode = getFlagString(flags, 'run-code');
  if (!externalRunKey && !runCode) {
    throw new Error('--external-run-key or --run-code is required');
  }
  const provider = getFlagString(flags, 'provider') || 'generic-cli';
  const logFile = getFlagString(flags, 'log-file');
  const logFromStdin = flags['log-stdin'] === true;
  const artifactPaths = getFlagStrings(flags, 'artifact-file');
  if (!logFile && !logFromStdin && !artifactPaths.length) {
    throw new Error('--log-file, --log-stdin, or --artifact-file is required');
  }
  if (logFile && logFromStdin) {
    throw new Error('--log-file and --log-stdin cannot be used together');
  }

  const resultSummary = getFlagString(flags, 'result-summary-json')
    ? parseJsonRecord(getFlagString(flags, 'result-summary-json'), '--result-summary-json')
    : {};
  const metadata = getFlagString(flags, 'metadata-json')
    ? parseJsonRecord(getFlagString(flags, 'metadata-json'), '--metadata-json')
    : {};
  const requester = new AgentGatewayApiClient(
    await getExternalImportServerUrl(flags),
    getFlagNumber(flags, 'request-timeout-ms', 30_000),
  );
  const response = await uploadExternalRun({
    requester,
    authToken: apiToken,
    provider,
    title: getFlagString(flags, 'title') || undefined,
    instruction: getFlagString(flags, 'instruction') || getFlagString(flags, 'prompt') || undefined,
    status: getExternalRunStatus(flags),
    externalRunKey: externalRunKey || undefined,
    runCode: runCode || undefined,
    sourceCollection: getFlagString(flags, 'source-collection') || undefined,
    sourceRecordId: getFlagString(flags, 'source-record-id') || undefined,
    outputAgentRunField: getFlagString(flags, 'output-agent-run-field') || undefined,
    providerSessionId: getFlagString(flags, 'provider-session-id') || undefined,
    resultSummary,
    metadata,
    errorSummary: getFlagString(flags, 'error-summary') || undefined,
    log:
      logFile || logFromStdin
        ? {
            format: getExternalLogFormat(flags, provider),
            artifactKey: getFlagString(flags, 'log-artifact-key') || undefined,
            ...(logFile ? { filePath: logFile } : { stream: stdin }),
          }
        : undefined,
    artifactPaths,
  });
  printJson(response);
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
      '  register --server-url <url> --invite-token <token> [--workspace-root <path>]',
      '  register --server-url <url> --invite-token-stdin [--workspace-root <path>]',
      '  heartbeat [--config <path>]',
      '  run [--config <path>] [--server-url <url>] [--node-id <id>] [--node-token <token>]',
      '      [--once] [--profile-key <key>] [--run-id <id>]',
      '      [--terminal-backend tmux|exec]',
      '  import-external-run --server-url <url> --api-token <token> --external-run-key <key> --provider <provider> --log-file <path>',
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
  if (command === 'import-external-run') {
    await handleImportExternalRun(flags);
    return;
  }
  if (command === 'detect-profiles') {
    await handleDetectProfiles();
    return;
  }
  printHelp();
}
