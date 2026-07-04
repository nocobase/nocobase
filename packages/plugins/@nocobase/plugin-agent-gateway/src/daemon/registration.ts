/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { hostname, platform, arch } from 'os';

import { writeDaemonConfig, serializeSafeConfig } from './config';
import { DaemonConfig, DetectedAgentProfile, GatewayRequester, JsonRecord } from './types';

export interface RegisterDaemonOptions {
  requester: GatewayRequester;
  serverUrl: string;
  inviteToken: string;
  configPath?: string;
  nodeKey?: string;
  displayName?: string;
  daemonVersion?: string;
  capabilities?: JsonRecord;
}

export interface HeartbeatDaemonOptions {
  requester: GatewayRequester;
  config: DaemonConfig;
  profiles: DetectedAgentProfile[];
  currentConcurrency?: number;
  daemonVersion?: string;
  capabilities?: JsonRecord;
}

function getNodeKey(providedKey?: string) {
  const normalizedHostname = hostname()
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '-')
    .replace(/-+/g, '-');
  return providedKey || `${normalizedHostname || 'local'}-agent-gateway-daemon`;
}

function getDaemonVersion(providedVersion?: string) {
  return providedVersion || 'agent-gateway-daemon/0.1.0';
}

export async function registerDaemonNode(options: RegisterDaemonOptions) {
  const nodeKey = getNodeKey(options.nodeKey);
  const registerResponse = await options.requester.request<{
    nodeId: string;
    nodeKey?: string;
    nodeToken: string;
    tokenLast4?: string;
    heartbeatIntervalSeconds?: number;
    claimIntervalSeconds?: number;
  }>({
    method: 'POST',
    path: '/api/agent-gateway/nodes:register',
    body: {
      inviteToken: options.inviteToken,
      nodeKey,
      displayName: options.displayName || nodeKey,
      daemonVersion: getDaemonVersion(options.daemonVersion),
      hostInfo: {
        hostname: hostname(),
        platform: platform(),
        arch: arch(),
      },
      capabilities: options.capabilities || {
        maxConcurrency: 1,
        supportsExecDriver: true,
      },
    },
  });

  const config: DaemonConfig = {
    serverUrl: options.serverUrl,
    nodeId: registerResponse.nodeId,
    nodeKey: registerResponse.nodeKey || nodeKey,
    nodeToken: registerResponse.nodeToken,
    tokenLast4: registerResponse.tokenLast4 || registerResponse.nodeToken.slice(-4),
    heartbeatIntervalSeconds: registerResponse.heartbeatIntervalSeconds,
    claimIntervalSeconds: registerResponse.claimIntervalSeconds,
    savedAt: new Date().toISOString(),
  };
  await writeDaemonConfig(config, options.configPath);
  return serializeSafeConfig(config);
}

export async function heartbeatDaemonNode(options: HeartbeatDaemonOptions) {
  return await options.requester.request({
    method: 'POST',
    path: `/api/agent-gateway/nodes/${options.config.nodeId}/heartbeat`,
    nodeToken: options.config.nodeToken,
    body: {
      currentConcurrency: options.currentConcurrency || 0,
      daemonVersion: getDaemonVersion(options.daemonVersion),
      hostInfo: {
        hostname: hostname(),
        platform: platform(),
        arch: arch(),
      },
      capabilities: options.capabilities || {
        maxConcurrency: 1,
        supportsExecDriver: true,
        supportsArtifacts: true,
        supportsSnapshots: true,
      },
      profiles: options.profiles,
    },
  });
}
