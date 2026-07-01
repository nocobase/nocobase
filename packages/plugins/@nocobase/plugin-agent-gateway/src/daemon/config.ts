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

import { DaemonConfig, JsonRecord } from './types';

export function getDefaultConfigPath() {
  return path.join(homedir(), '.agent-gateway-daemon', 'config.json');
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
    typeof record.savedAt === 'string'
  );
}

export async function readDaemonConfig(configPath = getDefaultConfigPath()): Promise<DaemonConfig> {
  const content = await fs.readFile(configPath, 'utf8');
  const parsed = JSON.parse(content) as unknown;
  if (!isDaemonConfig(parsed)) {
    throw new Error(`Invalid Agent Gateway daemon config: ${configPath}`);
  }
  return parsed;
}

export async function writeDaemonConfig(config: DaemonConfig, configPath = getDefaultConfigPath()) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await fs.chmod(configPath, 0o600);
}

export function serializeSafeConfig(config: DaemonConfig) {
  return {
    serverUrl: config.serverUrl,
    nodeId: config.nodeId,
    nodeKey: config.nodeKey,
    tokenLast4: config.tokenLast4 || config.nodeToken.slice(-4),
    heartbeatIntervalSeconds: config.heartbeatIntervalSeconds,
    claimIntervalSeconds: config.claimIntervalSeconds,
    savedAt: config.savedAt,
  };
}
