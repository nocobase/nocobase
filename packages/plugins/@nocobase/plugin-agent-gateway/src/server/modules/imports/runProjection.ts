/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

import { AgentProviderKey, isAgentProviderKey } from '../../../shared/providerCapabilities';
import { EXTERNAL_IMPORT_CAPABILITIES, EXTERNAL_IMPORT_SOURCE_TYPE } from '../../../shared/externalRunImport';
import { IMPORTING_RUN_STATUS } from '../../../shared/runState';
import { redactRunErrorSummary, redactRunResultSummary } from '../../security';
import {
  JsonRecord,
  ModelRecord,
  getDate,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelValue,
  getRecord,
  getString,
} from '../../actions/utils';
import { getTokenUsageSummaryFromRecord } from '../../services/observationRollup';

const IMPORTED_RUN_STATUSES = new Set(['running', 'succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const TERMINAL_IMPORTED_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);

function getIdentifierString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

export function getImportProvider(ctx: Context, value: unknown) {
  const provider = getString(value);
  if (!isAgentProviderKey(provider)) {
    ctx.throw(400, 'provider is required and must be canonical');
  }
  return provider;
}

export function getImportStatus(ctx: Context, values: JsonRecord, existingStatus?: string) {
  const status = getString(values.status);
  if (status) {
    if (IMPORTED_RUN_STATUSES.has(status)) {
      return status;
    }
    ctx.throw(400, 'status is not supported');
  }
  if (existingStatus) {
    return existingStatus;
  }
  return getString(values.errorSummary) ? 'failed' : 'succeeded';
}

export function assertImportedRunStatusTransition(ctx: Context, currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus || currentStatus === 'running') {
    return;
  }
  ctx.throw(409, `Imported run status cannot transition from ${currentStatus} to ${nextStatus}`);
}

export function isTerminalImportedRunStatus(status: string) {
  return TERMINAL_IMPORTED_RUN_STATUSES.has(status);
}

function getImportedRunTimestamps(values: JsonRecord, status: string, now: Date, existing?: ModelRecord) {
  const existingJson = existing ? getModelJson(existing) : {};
  const startedAt =
    getDate(values.startedAt) ||
    getDate(values.requestedAt) ||
    (existingJson.startedAt ? getDate(existingJson.startedAt) : null) ||
    now;
  const requestedAt =
    getDate(values.requestedAt) || (existingJson.requestedAt ? getDate(existingJson.requestedAt) : null) || startedAt;
  const finishedAt =
    getDate(values.finishedAt) ||
    getDate(values.completedAt) ||
    getDate(values.failedAt) ||
    (existingJson.finishedAt ? getDate(existingJson.finishedAt) : null) ||
    (TERMINAL_IMPORTED_RUN_STATUSES.has(status) ? now : null);

  return {
    requestedAt,
    queuedAt: existingJson.queuedAt ? getDate(existingJson.queuedAt) || requestedAt : requestedAt,
    startedAt,
    ...(status === 'running' ? { completedAt: null, failedAt: null, canceledAt: null, finishedAt: null } : {}),
    ...(status === 'succeeded'
      ? { completedAt: finishedAt || now, failedAt: null, canceledAt: null, finishedAt: finishedAt || now }
      : {}),
    ...(status === 'failed' || status === 'timeout' || status === 'abandoned'
      ? { completedAt: null, failedAt: finishedAt || now, canceledAt: null, finishedAt: finishedAt || now }
      : {}),
    ...(status === 'canceled'
      ? { completedAt: null, failedAt: null, canceledAt: finishedAt || now, finishedAt: finishedAt || now }
      : {}),
  };
}

function getImportedRunPayload(values: JsonRecord, provider: AgentProviderKey, existing?: ModelRecord) {
  const existingPayload = getRecord(existing ? getModelValue(existing, 'executionPayloadJson') : undefined);
  const existingFields = getRecord(existingPayload.fields);
  const title = getString(values.title) || getString(existingPayload.title);
  const instruction = getString(values.instruction) || getString(existingPayload.instruction);
  const externalRunKey = getString(values.externalRunKey) || getString(existingFields.externalRunKey);
  const providerSessionId = getString(values.providerSessionId) || getString(existingPayload.providerSessionId);
  return {
    executionPolicyKey: `external-import:${provider}`,
    source: 'external-import',
    title: title || null,
    instruction: instruction || null,
    providerSessionId: providerSessionId || null,
    fields: {
      ...existingFields,
      externalRunKey: externalRunKey || null,
      metadataJson: {
        ...getRecord(existingFields.metadataJson),
        ...getRecord(values.metadataJson),
      },
    },
  };
}

function getImportedRunPromptSnapshot(values: JsonRecord, existing?: ModelRecord) {
  const existingSnapshot = getRecord(existing ? getModelValue(existing, 'promptSnapshot') : undefined);
  const existingVariables = getRecord(existingSnapshot.variables);
  const title = getString(values.title) || getString(existingVariables.title);
  const instruction =
    getString(values.instruction) ||
    getString(existingVariables.instruction) ||
    getString(existingSnapshot.renderedPrompt);
  return {
    ...existingSnapshot,
    templateKey: 'agent-gateway-external-import',
    templateText: '{{instruction}}',
    renderedPrompt: instruction || title || 'External imported run',
    variables: {
      title: title || null,
      instruction: instruction || null,
      externalRunKey: getString(values.externalRunKey) || getString(existingVariables.externalRunKey) || null,
    },
    renderedAt: new Date().toISOString(),
  };
}

function getImportedRunResultSummary(values: JsonRecord, provider: AgentProviderKey, existing?: ModelRecord) {
  const existingResultSummary = getRecord(existing ? getModelValue(existing, 'resultSummaryJson') : undefined);
  const title = getString(values.title) || getString(existingResultSummary.title);
  const resultSummary = {
    ...existingResultSummary,
    ...getRecord(values.resultSummaryJson),
    ...(title ? { title } : {}),
    requestedFrom: 'external-import',
    provider,
    externalRunKey: getString(values.externalRunKey) || getString(existingResultSummary.externalRunKey) || null,
  };
  const redactedResultSummary = getRecord(redactRunResultSummary(resultSummary));
  const tokenUsageJson = getTokenUsageSummaryFromRecord(resultSummary);
  return tokenUsageJson ? { ...redactedResultSummary, tokenUsageJson } : redactedResultSummary;
}

export function getRunUpdateValues(
  values: JsonRecord,
  status: string,
  provider: AgentProviderKey,
  now: Date,
  existing?: ModelRecord,
) {
  const providerSessionId = getString(values.providerSessionId);
  return {
    status,
    cancelRequested: status === 'canceled',
    promptSnapshot: getImportedRunPromptSnapshot(values, existing),
    executionPayloadJson: getImportedRunPayload(values, provider, existing),
    resultSummaryJson: getImportedRunResultSummary(values, provider, existing),
    errorSummary: getString(values.errorSummary)
      ? redactRunErrorSummary(getString(values.errorSummary))
      : existing
        ? getModelString(existing, 'errorSummary') || null
        : null,
    sourceType: EXTERNAL_IMPORT_SOURCE_TYPE,
    provider,
    capabilitiesSnapshotJson: EXTERNAL_IMPORT_CAPABILITIES,
    executionPolicyKey: `external-import:${provider}`,
    sourceCollection:
      getString(values.sourceCollection) || (existing ? getModelString(existing, 'sourceCollection') : '') || null,
    sourceRecordId:
      getIdentifierString(values.sourceRecordId) ||
      (existing ? getModelString(existing, 'sourceRecordId') : '') ||
      null,
    claimAttempt: existing ? getModelNumber(existing, 'claimAttempt') : 0,
    leaseVersion: existing ? getModelNumber(existing, 'leaseVersion') : 0,
    claimTokenHash: null,
    claimTokenLast4: null,
    claimExpiresAt: null,
    terminalBackend: null,
    terminalStatus: null,
    terminalSessionName: null,
    terminalStartedAt: null,
    terminalEndedAt: null,
    terminalLastActivityAt: null,
    terminalExitCode: null,
    agentSessionProviderId:
      providerSessionId || (existing ? getModelString(existing, 'agentSessionProviderId') : '') || null,
    ...getImportedRunTimestamps(values, status, now, existing),
  };
}

export function getNewImportingRunValues(finalRunValues: JsonRecord) {
  const provisionalValues = { ...finalRunValues };
  delete provisionalValues.resultSummaryJson;
  return {
    ...provisionalValues,
    status: IMPORTING_RUN_STATUS,
    cancelRequested: false,
    completedAt: null,
    failedAt: null,
    canceledAt: null,
    finishedAt: null,
    errorSummary: null,
  };
}
