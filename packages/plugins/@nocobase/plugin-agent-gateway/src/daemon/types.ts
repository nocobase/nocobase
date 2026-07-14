/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AgentProviderKey } from '../shared/providerCapabilities';
import type {
  AgentGatewayActionRequest,
  AgentGatewayActionResponse,
  AgentGatewayApiAction,
  CanonicalRunSnapshot,
} from '../shared/contracts';
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
  capabilitiesJson: JsonRecord;
  metadataJson: JsonRecord;
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
  executionPolicies: ExecutionPolicyDefinition[];
  savedAt: string;
}

export interface ExecutionPolicyOptionRule {
  flag: string;
  type: 'boolean' | 'enum' | 'integer';
  allowedValues?: string[];
  min?: number;
  max?: number;
}

export interface ExecutionPolicyDefinition {
  executionPolicyKey: string;
  provider: AgentProviderKey;
  executable: string;
  baseArgs?: string[];
  allowedOptions?: Record<string, ExecutionPolicyOptionRule>;
  options?: Record<string, boolean | number | string>;
  workspaceRoot: string;
  envKeys?: string[];
  defaultTimeoutMs?: number;
  maxTimeoutMs: number;
}

export type ExecutionPolicySet = Record<string, ExecutionPolicyDefinition> | ExecutionPolicyDefinition[];

export interface GatewayRequestOptions {
  action?: AgentGatewayApiAction;
  method: 'GET' | 'POST';
  path: string;
  body?: object;
  nodeToken?: string;
  authToken?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface GatewayRequester {
  request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T>;
}

export interface GatewayActionRequestOptions<Action extends AgentGatewayApiAction>
  extends Omit<GatewayRequestOptions, 'body'> {
  action: Action;
  body?: AgentGatewayActionRequest<Action>;
}

export async function requestGatewayAction<Action extends AgentGatewayApiAction>(
  requester: GatewayRequester,
  options: GatewayActionRequestOptions<Action>,
): Promise<AgentGatewayActionResponse<Action>> {
  return (await requester.request({
    ...options,
    body: options.body,
  })) as AgentGatewayActionResponse<Action>;
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
  executionPolicyKey?: string;
  profileCapabilities?: JsonRecord;
  cancelRequested?: boolean;
  cancelReason?: string;
}

export interface CanonicalClaimedRun extends CanonicalRunSnapshot {
  id?: string;
  executionPayloadJson: JsonRecord;
  promptSnapshot?: JsonRecord;
  timeoutMs?: number;
}

export interface ClaimedRunLease extends RunLease {
  claimed: true;
  runId: string;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  run: CanonicalClaimedRun;
  executionPolicyKey: string;
}

export interface PendingControlRequest extends JsonRecord {
  id: string;
  runId: string;
  action: 'interrupt' | 'terminate';
  status?: 'accepted' | 'delivered';
  reason?: string;
  createdAt: string;
}
