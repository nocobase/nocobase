/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context } from '@nocobase/actions';

import { JsonRecord, getRecord, getString } from '../actions/utils';

export type AgentActionAuditStatus = 'accepted' | 'denied' | 'succeeded' | 'failed';

export interface AgentActionAuditInput {
  action:
    | 'resume'
    | 'message'
    | 'cancel'
    | 'interrupt'
    | 'terminate'
    | 'readTerminal'
    | 'readArtifacts'
    | 'readRawLogs'
    | 'rawTerminalWrite'
    | 'rawTerminalWriteDenied';
  runId?: number | string;
  sessionId?: number | string;
  operatorId?: number | string;
  redactedPreview?: string;
  contentHash?: string;
  contentSize?: number;
  permissionKey: string;
  resultStatus: AgentActionAuditStatus;
  provider?: string;
  metadataJson?: Record<string, unknown>;
}

interface LoggerLike {
  warn?(message: string, meta?: Record<string, unknown>): void;
}

function getOptionalId(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

function getOptionalPositiveSize(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

function getAuditValues(input: AgentActionAuditInput) {
  return {
    id: randomUUID(),
    action: input.action,
    runId: getOptionalId(input.runId),
    sessionId: getOptionalId(input.sessionId),
    operatorId: getOptionalId(input.operatorId),
    redactedPreview: getString(input.redactedPreview) || null,
    contentHash: getString(input.contentHash) || null,
    contentSize: getOptionalPositiveSize(input.contentSize),
    permissionKey: input.permissionKey,
    resultStatus: input.resultStatus,
    provider: getString(input.provider) || null,
    metadataJson: getRecord(input.metadataJson as JsonRecord | undefined),
  };
}

export async function createAgentActionAudit(ctx: Context, input: AgentActionAuditInput) {
  return await ctx.db.getRepository('agAgentActionAudits').create({
    values: getAuditValues(input),
  });
}

export async function auditMutatingAgentAction(ctx: Context, input: AgentActionAuditInput) {
  return await createAgentActionAudit(ctx, input);
}

export async function auditAgentActionBestEffort(
  ctx: Context,
  input: AgentActionAuditInput,
  logger: LoggerLike = ctx.app?.logger || ctx.app?.log,
) {
  try {
    return await createAgentActionAudit(ctx, input);
  } catch (error) {
    logger?.warn?.('Agent Gateway action audit write failed', {
      action: input.action,
      permissionKey: input.permissionKey,
      resultStatus: input.resultStatus,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return null;
  }
}

export async function auditReadAgentAction(
  ctx: Context,
  input: AgentActionAuditInput,
  logger: LoggerLike = ctx.app?.logger || ctx.app?.log,
) {
  try {
    return await createAgentActionAudit(ctx, input);
  } catch (error) {
    logger?.warn?.('Agent Gateway read audit write failed', {
      action: input.action,
      permissionKey: input.permissionKey,
      resultStatus: input.resultStatus,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return null;
  }
}
