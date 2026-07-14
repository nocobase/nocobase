/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AgentProviderCapabilities, AgentProviderKey } from '../shared/providerCapabilities';
import {
  parseAgentGatewayActionResponse,
  type AgentGatewayActionRequest,
  type AgentGatewayActionResponse,
  type AgentGatewayApiAction,
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
  request(options: GatewayRequestOptions): Promise<unknown>;
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
  const response = await requester.request({
    ...options,
    body: options.body,
  });
  return parseAgentGatewayActionResponse(options.action, response);
}

export interface RunLease {
  runId: string;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  claimExpiresAt?: string;
  leaseTtlMs?: number;
  serverTime?: string;
  localLeaseDeadlineMonotonicMs?: number;
  claimed?: true;
  run?: CanonicalClaimedRun;
  profileKey?: string;
  executionPolicyKey?: string;
  profileCapabilities?: JsonRecord;
  cancelRequested?: boolean;
  cancelReason?: string;
}

export interface CanonicalClaimedRun {
  id?: string;
  provider: AgentProviderKey;
  capabilitiesSnapshotJson: AgentProviderCapabilities;
  executionPolicyKey: string;
  sourceType: string;
  executionPayloadJson: JsonRecord;
  promptSnapshot?: JsonRecord;
  timeoutMs?: number;
  startedAt?: string;
  requestedAt?: string;
  createdAt?: string;
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

export interface UnclaimedRunLease {
  claimed: false;
  reason?: string;
  checkedAt?: string;
}

export type ClaimRunResult = ClaimedRunLease | UnclaimedRunLease;

export interface PendingControlRequest {
  id: string;
  runId: string;
  action: 'interrupt' | 'terminate';
  status: 'accepted' | 'delivered';
  reason?: string;
  createdAt: string;
}
