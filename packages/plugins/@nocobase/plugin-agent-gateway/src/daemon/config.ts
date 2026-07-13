/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import { homedir } from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { DaemonConfig, ExecutionPolicyDefinition, ExecutionPolicyOptionRule, JsonRecord } from './types';
import { getExplicitAgentProviderKey } from '../shared/providerCapabilities';

export function getDefaultConfigPath() {
  return path.join(homedir(), '.agent-gateway-daemon', 'config.json');
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isExecutionPolicyOptionRule(value: unknown): value is ExecutionPolicyOptionRule {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as JsonRecord;
  return (
    typeof record.flag === 'string' &&
    (record.type === 'boolean' || record.type === 'enum' || record.type === 'integer') &&
    (record.allowedValues === undefined || isStringArray(record.allowedValues)) &&
    (record.min === undefined || typeof record.min === 'number') &&
    (record.max === undefined || typeof record.max === 'number')
  );
}

function isExecutionPolicy(value: unknown): value is ExecutionPolicyDefinition {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as JsonRecord;
  const allowedOptions = record.allowedOptions;
  const options = record.options;
  return (
    typeof record.executionPolicyKey === 'string' &&
    Boolean(getExplicitAgentProviderKey(record.provider)) &&
    typeof record.executable === 'string' &&
    (record.baseArgs === undefined || isStringArray(record.baseArgs)) &&
    (allowedOptions === undefined ||
      (Object.prototype.toString.call(allowedOptions) === '[object Object]' &&
        Object.values(allowedOptions as JsonRecord).every(isExecutionPolicyOptionRule))) &&
    (options === undefined ||
      (Object.prototype.toString.call(options) === '[object Object]' &&
        Object.values(options as JsonRecord).every(
          (item) => typeof item === 'boolean' || typeof item === 'number' || typeof item === 'string',
        ))) &&
    typeof record.workspaceRoot === 'string' &&
    (record.envKeys === undefined || isStringArray(record.envKeys)) &&
    (record.defaultTimeoutMs === undefined || typeof record.defaultTimeoutMs === 'number') &&
    typeof record.maxTimeoutMs === 'number'
  );
}

function isDaemonConfig(value: unknown): value is DaemonConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as JsonRecord;
  return (
    typeof record.serverUrl === 'string' &&
    typeof record.nodeId === 'string' &&
    typeof record.nodeKey === 'string' &&
    typeof record.nodeToken === 'string' &&
    (record.installationId === undefined || typeof record.installationId === 'string') &&
    Array.isArray(record.executionPolicies) &&
    record.executionPolicies.length > 0 &&
    record.executionPolicies.every(isExecutionPolicy) &&
    typeof record.savedAt === 'string'
  );
}

export function createDefaultExecutionPolicies(workspaceRoot: string): ExecutionPolicyDefinition[] {
  const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
  return [
    {
      executionPolicyKey: 'opencode',
      provider: 'opencode',
      executable: 'opencode',
      workspaceRoot: resolvedWorkspaceRoot,
      envKeys: ['NOCOBASE_API_BASE_URL', 'NOCOBASE_ADMIN_URL', 'NOCOBASE_API_TOKEN'],
      defaultTimeoutMs: 24 * 60 * 60 * 1000,
      maxTimeoutMs: 24 * 60 * 60 * 1000,
    },
    {
      executionPolicyKey: 'codex',
      provider: 'codex',
      executable: 'codex',
      workspaceRoot: resolvedWorkspaceRoot,
      envKeys: [],
      defaultTimeoutMs: 24 * 60 * 60 * 1000,
      maxTimeoutMs: 24 * 60 * 60 * 1000,
    },
    {
      executionPolicyKey: 'claude-code',
      provider: 'claude-code',
      executable: 'claude',
      workspaceRoot: resolvedWorkspaceRoot,
      envKeys: [],
      defaultTimeoutMs: 24 * 60 * 60 * 1000,
      maxTimeoutMs: 24 * 60 * 60 * 1000,
    },
  ];
}

export async function readDaemonConfig(configPath = getDefaultConfigPath()): Promise<DaemonConfig> {
  const content = await fs.readFile(configPath, 'utf8');
  const parsed = JSON.parse(content) as unknown;
  if (!isDaemonConfig(parsed)) {
    throw new Error(`Invalid Agent Gateway daemon config: ${configPath}`);
  }
  if (parsed.installationId) {
    return parsed;
  }
  const config = {
    ...parsed,
    installationId: randomUUID(),
  };
  await writeDaemonConfig(config, configPath);
  return config;
}

export async function writeDaemonConfig(config: DaemonConfig, configPath = getDefaultConfigPath()) {
  const configDir = path.dirname(configPath);
  const tempPath = path.join(configDir, `.${path.basename(configPath)}.${process.pid}.${randomUUID()}.tmp`);
  await fs.mkdir(configDir, { recursive: true });
  try {
    await fs.writeFile(tempPath, `${JSON.stringify(config, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await fs.rename(tempPath, configPath);
    await fs.chmod(configPath, 0o600);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => {
      // The atomic rename already removed the temporary path on success.
    });
  }
}

export function serializeSafeConfig(config: DaemonConfig) {
  return {
    serverUrl: config.serverUrl,
    nodeId: config.nodeId,
    nodeKey: config.nodeKey,
    installationId: config.installationId,
    tokenLast4: config.tokenLast4 || config.nodeToken.slice(-4),
    heartbeatIntervalSeconds: config.heartbeatIntervalSeconds,
    claimIntervalSeconds: config.claimIntervalSeconds,
    executionPolicies: config.executionPolicies.map((policy) => ({
      executionPolicyKey: policy.executionPolicyKey,
      provider: policy.provider,
      maxTimeoutMs: policy.maxTimeoutMs,
      optionKeys: Object.keys(policy.allowedOptions || {}),
      envKeys: policy.envKeys || [],
    })),
    savedAt: config.savedAt,
  };
}
