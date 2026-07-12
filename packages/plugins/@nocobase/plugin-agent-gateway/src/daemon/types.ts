/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AgentProviderKey } from '../shared/providerCapabilities';
import type { JsonRecord } from '../shared/json';

export type { JsonRecord } from '../shared/json';

export type AgentGatewayProfileKey = string;

export type AgentGatewayProfileStatus = 'active' | 'missing' | 'auth_required' | 'error';

export interface DetectedAgentProfile {
  profileKey: AgentGatewayProfileKey;
  provider: AgentProviderKey;
  displayName: string;
  agentType: 'code';
  driver: 'exec';
  status: AgentGatewayProfileStatus;
  capabilities: JsonRecord;
  metadata: JsonRecord;
}

export interface DaemonConfig {
  serverUrl: string;
  nodeId: string;
  nodeKey: string;
  nodeToken: string;
  installationId?: string;
  tokenLast4?: string;
  heartbeatIntervalSeconds?: number;
  claimIntervalSeconds?: number;
  savedAt: string;
}

export interface GatewayRequestOptions {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  nodeToken?: string;
  authToken?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface GatewayRequester {
  request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T>;
}

export interface RunLease extends JsonRecord {
  runId: string;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  claimExpiresAt?: string;
  leaseTtlMs?: number;
  serverTime?: string;
  localLeaseDeadlineMonotonicMs?: number;
  claimed?: boolean;
  run?: JsonRecord;
  profileKey?: string;
  profileProvider?: AgentProviderKey;
  profileCapabilities?: JsonRecord;
  cancelRequested?: boolean;
  cancelReason?: string;
}

export interface PendingControlRequest extends JsonRecord {
  id: string;
  runId: string;
  action: 'interrupt' | 'terminate';
  status?: 'accepted' | 'delivered';
  reason?: string;
  createdAt: string;
}
