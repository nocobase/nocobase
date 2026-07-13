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
import { AGENT_GATEWAY_API_ACTIONS, createActionContract } from './common';

export interface CanonicalRunSnapshot extends JsonRecord {
  provider: AgentProviderKey;
  capabilitiesSnapshotJson: JsonRecord;
  executionPolicyKey: string;
  sourceType: string;
}

export interface CreateRunRequest extends JsonRecord {
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

export interface RunLeaseRequest extends JsonRecord {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
}

export type RunActionResponse = JsonRecord;

export const runContracts = {
  [AGENT_GATEWAY_API_ACTIONS.createRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createRun,
    CreateRunRequest,
    RunActionResponse
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
  [AGENT_GATEWAY_API_ACTIONS.createTaskRun]: createActionContract(AGENT_GATEWAY_API_ACTIONS.createTaskRun, [
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
  [AGENT_GATEWAY_API_ACTIONS.claimRun]: createActionContract(AGENT_GATEWAY_API_ACTIONS.claimRun, [
    'runId',
    'profileId',
    'profileKey',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.heartbeatRun]: createActionContract(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'status',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.completeRun]: createActionContract(AGENT_GATEWAY_API_ACTIONS.completeRun, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'resultSummaryJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.failRun]: createActionContract(AGENT_GATEWAY_API_ACTIONS.failRun, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'errorSummary',
    'resultSummaryJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.timeoutRun]: createActionContract(AGENT_GATEWAY_API_ACTIONS.timeoutRun, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'errorSummary',
    'resultSummaryJson',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.ackCancelRun]: createActionContract(AGENT_GATEWAY_API_ACTIONS.ackCancelRun, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'reason',
  ] as const),
  [AGENT_GATEWAY_API_ACTIONS.cancelRun]: createActionContract(AGENT_GATEWAY_API_ACTIONS.cancelRun, ['reason'] as const),
} as const;
