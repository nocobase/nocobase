/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import type { AgentProviderKey } from '../providerCapabilities';
import {
  AGENT_GATEWAY_API_ACTIONS,
  createActionContract,
  parseCanonicalListResponse,
  type AgentGatewayCanonicalListResponse,
  type AgentGatewayDomainContractMap,
  type AgentGatewayEmptyRequest,
  type AgentGatewayObjectDto,
} from './common';

export interface CanonicalRunSnapshot extends JsonRecord {
  provider: AgentProviderKey;
  capabilitiesSnapshotJson: JsonRecord;
  executionPolicyKey: string;
  sourceType: string;
}

export interface CreateRunRequest {
  runCode?: string;
  promptSnapshot?: JsonRecord;
  executionPayloadJson: JsonRecord;
  sourceType: string;
  sourceCollection?: string;
  sourceRecordId?: string;
  nodeId?: string;
  agentProfileId?: string;
  promptTemplateId?: string;
  taskTemplateId?: string;
  dispatchBindingId?: string;
  provider: AgentProviderKey;
  capabilitiesSnapshotJson: JsonRecord;
  executionPolicyKey: string;
}

export const AGENT_GATEWAY_RUN_EXECUTION_PAYLOAD_FIELDS = [
  'executionPolicyKey',
  'prompt',
  'message',
  'messageHash',
  'mode',
  'providerSessionId',
  'cwd',
  'timeoutMs',
  'source',
  'title',
  'instruction',
  'artifactRoot',
  'artifactPaths',
  'artifactGlobs',
  'artifacts',
  'includeOlderArtifacts',
  'artifactModifiedSince',
  'maxArtifactUploads',
  'maxArtifactScanEntries',
  'resolvedSkills',
  'skillVersion',
  'skillVersions',
  'taskTemplate',
  'dispatch',
  'fields',
  'skills',
] as const;

const AGENT_GATEWAY_RUN_EXECUTION_PAYLOAD_FIELD_SET = new Set<string>(AGENT_GATEWAY_RUN_EXECUTION_PAYLOAD_FIELDS);

export function getUnknownRunExecutionPayloadField(payload: JsonRecord) {
  return Object.keys(payload).find((field) => !AGENT_GATEWAY_RUN_EXECUTION_PAYLOAD_FIELD_SET.has(field));
}

export interface RunLeaseRequest {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
}

export interface CreateTaskRunRequest {
  runCode?: string;
  title?: string;
  instruction?: string;
  prompt?: string;
  cwd?: string;
  nodeId?: string;
  agentProfileId?: string;
  skillVersionIds?: string[];
  artifactRoot?: string;
  artifactPaths?: string[];
  artifactGlobs?: string[];
  artifacts?: JsonRecord[];
  includeOlderArtifacts?: boolean;
  maxArtifactUploads?: number;
  maxArtifactScanEntries?: number;
  taskTemplateId?: string;
  taskTemplateKey?: string;
  promptTemplateId?: string;
  dispatchBindingId?: string;
  timeoutMs?: number;
  sourceType?: string;
  sourceCollection?: string;
  sourceRecordId?: string | number;
}

export interface ClaimRunRequest {
  runId?: string;
  profileId?: string;
  profileKey?: string;
}

export interface HeartbeatRunRequest extends RunLeaseRequest {
  status?: string;
}

export interface CompleteRunRequest extends RunLeaseRequest {
  resultSummaryJson?: JsonRecord;
}

export interface FailRunRequest extends CompleteRunRequest {
  errorSummary?: string;
}

export type TimeoutRunRequest = FailRunRequest;

export interface AckCancelRunRequest extends RunLeaseRequest {
  reason?: string;
}

export interface CancelRunRequest {
  reason?: string;
}

export interface ListRunsQuery {
  filter?: string;
  sort?: string;
  page?: number | string;
  pageSize?: number | string;
  limit?: number | string;
  status?: string;
  nodeId?: string;
  agentProfileId?: string;
  taskTemplateId?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface RunDto extends AgentGatewayObjectDto {
  id?: string;
  runCode?: string;
  status?: string;
  provider?: AgentProviderKey;
  executionPayloadJson?: JsonRecord;
  resultSummaryJson?: JsonRecord;
}

export interface RunOptionsResponse extends AgentGatewayObjectDto {
  nodes?: AgentGatewayObjectDto[];
  agentProfiles?: AgentGatewayObjectDto[];
  skillVersions?: AgentGatewayObjectDto[];
  taskTemplates?: AgentGatewayObjectDto[];
}

export interface RunLeaseResponseDto extends AgentGatewayObjectDto {
  runId: string;
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  claimed?: boolean;
  claimExpiresAt?: string;
  leaseTtlMs?: number;
  serverTime?: string;
  run?: RunDto;
  profileKey?: string;
  executionPolicyKey?: string;
  profileCapabilities?: JsonRecord;
  cancelRequested?: boolean;
  cancelReason?: string;
}

export type ClaimRunResponse = RunLeaseResponseDto;

export type ListRunOptionsResponse = RunOptionsResponse;
export type CreateTaskRunResponse = RunDto;
export type ListRunsResponse = AgentGatewayCanonicalListResponse<RunDto>;
export type GetRunResponse = RunDto;
export type CreateRunResponse = RunDto;
export type HeartbeatRunResponse = RunLeaseResponseDto;
export type CompleteRunResponse = AgentGatewayObjectDto;
export type FailRunResponse = AgentGatewayObjectDto;
export type TimeoutRunResponse = AgentGatewayObjectDto;
export type AckCancelRunResponse = AgentGatewayObjectDto;
export type CancelRunResponse = RunDto;
export type ExpireRunLeasesResponse = AgentGatewayObjectDto;

export interface RunActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.listRunOptions]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.createTaskRun]: CreateTaskRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.listRuns]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.getRun]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.createRun]: CreateRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.claimRun]: ClaimRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.heartbeatRun]: HeartbeatRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.completeRun]: CompleteRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.failRun]: FailRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.timeoutRun]: TimeoutRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.ackCancelRun]: AckCancelRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.cancelRun]: CancelRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.expireRunLeases]: AgentGatewayEmptyRequest;
}

export interface RunActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.listRunOptions]: ListRunOptionsResponse;
  [AGENT_GATEWAY_API_ACTIONS.createTaskRun]: CreateTaskRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.listRuns]: ListRunsResponse;
  [AGENT_GATEWAY_API_ACTIONS.getRun]: GetRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.createRun]: CreateRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.claimRun]: ClaimRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.heartbeatRun]: HeartbeatRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.completeRun]: CompleteRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.failRun]: FailRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.timeoutRun]: TimeoutRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.ackCancelRun]: AckCancelRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.cancelRun]: CancelRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.expireRunLeases]: ExpireRunLeasesResponse;
}

export const runContracts = {
  [AGENT_GATEWAY_API_ACTIONS.createRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createRun,
    CreateRunRequest,
    CreateRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.createRun, [
    'runCode',
    'promptSnapshot',
    'executionPayloadJson',
    'sourceType',
    'sourceCollection',
    'sourceRecordId',
    'nodeId',
    'agentProfileId',
    'promptTemplateId',
    'taskTemplateId',
    'dispatchBindingId',
    'provider',
    'capabilitiesSnapshotJson',
    'executionPolicyKey',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.listRunOptions]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listRunOptions,
    AgentGatewayEmptyRequest,
    ListRunOptionsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listRunOptions, []),
  [AGENT_GATEWAY_API_ACTIONS.createTaskRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createTaskRun,
    CreateTaskRunRequest,
    CreateTaskRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.createTaskRun, [
    'runCode',
    'title',
    'instruction',
    'prompt',
    'cwd',
    'nodeId',
    'agentProfileId',
    'skillVersionIds',
    'artifactRoot',
    'artifactPaths',
    'artifactGlobs',
    'artifacts',
    'includeOlderArtifacts',
    'maxArtifactUploads',
    'maxArtifactScanEntries',
    'taskTemplateId',
    'taskTemplateKey',
    'promptTemplateId',
    'dispatchBindingId',
    'timeoutMs',
    'sourceType',
    'sourceCollection',
    'sourceRecordId',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.listRuns]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listRuns,
    AgentGatewayEmptyRequest,
    ListRunsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listRuns, [], undefined, parseCanonicalListResponse<RunDto>),
  [AGENT_GATEWAY_API_ACTIONS.getRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getRun,
    AgentGatewayEmptyRequest,
    GetRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.getRun, []),
  [AGENT_GATEWAY_API_ACTIONS.claimRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.claimRun,
    ClaimRunRequest,
    ClaimRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.claimRun, ['runId', 'profileId', 'profileKey'] as const),
  [AGENT_GATEWAY_API_ACTIONS.heartbeatRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.heartbeatRun,
    HeartbeatRunRequest,
    HeartbeatRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, ['claimToken', 'claimAttempt', 'leaseVersion', 'status'] as const),
  [AGENT_GATEWAY_API_ACTIONS.completeRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.completeRun,
    CompleteRunRequest,
    CompleteRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.completeRun, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'resultSummaryJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.failRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.failRun,
    FailRunRequest,
    FailRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.failRun, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'errorSummary',
    'resultSummaryJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.timeoutRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.timeoutRun,
    TimeoutRunRequest,
    TimeoutRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.timeoutRun, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'errorSummary',
    'resultSummaryJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.ackCancelRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.ackCancelRun,
    AckCancelRunRequest,
    AckCancelRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.ackCancelRun, ['claimToken', 'claimAttempt', 'leaseVersion', 'reason'] as const),
  [AGENT_GATEWAY_API_ACTIONS.cancelRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.cancelRun,
    CancelRunRequest,
    CancelRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.cancelRun, ['reason']),
  [AGENT_GATEWAY_API_ACTIONS.expireRunLeases]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.expireRunLeases,
    AgentGatewayEmptyRequest,
    ExpireRunLeasesResponse
  >(AGENT_GATEWAY_API_ACTIONS.expireRunLeases, []),
} as const satisfies AgentGatewayDomainContractMap<RunActionRequestMap, RunActionResponseMap>;
