/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';

export interface RemoteSyncAuditAction {
  name: string;
  getMetaData: (ctx: Context) => Promise<Record<string, unknown>>;
}

type RemoteSyncAuditContext = Context & {
  action?: {
    params?: unknown;
  };
  body?: unknown;
  request?: {
    params?: unknown;
    query?: unknown;
    body?: unknown;
  };
};

const safeAuditFields = [
  'remoteId',
  'provider',
  'repoId',
  'operation',
  'localCommitId',
  'expectedLocalCommitId',
  'resultLocalCommitId',
  'remoteRevision',
  'expectedRemoteRevision',
  'resultRemoteRevision',
  'contentHash',
  'jobId',
  'fileCount',
  'result',
  'reasonCode',
] as const;

export function createRemoteSyncAuditAction(name: string): RemoteSyncAuditAction {
  return {
    name,
    getMetaData: async (ctx) => sanitizeRemoteSyncAuditMetadata(ctx),
  };
}

export function sanitizeRemoteSyncAuditMetadata(ctx: Context): Record<string, unknown> {
  const auditCtx = ctx as RemoteSyncAuditContext;
  const actionParams = toRecord(auditCtx.action?.params);
  const actionValues = toRecord(actionParams.values);
  const requestParams = sanitizeAuditPayload(auditCtx.request?.params);
  const requestQuery = sanitizeAuditPayload(auditCtx.request?.query);
  const requestBody = {
    ...sanitizeAuditPayload(actionValues),
    ...sanitizeAuditPayload(auditCtx.request?.body),
  };
  const responseBody = sanitizeAuditPayload(unwrapData(auditCtx.body));

  return {
    ...compactObject({
      ...requestParams,
      ...requestQuery,
      ...requestBody,
      ...responseBody,
    }),
    request: {
      params: requestParams,
      query: requestQuery,
      body: requestBody,
      headers: {},
    },
    response: {
      body: responseBody,
    },
  };
}

export function sanitizeAuditPayload(value: unknown): Record<string, unknown> {
  const record = toRecord(value);
  const sanitized: Record<string, unknown> = {};

  for (const field of safeAuditFields) {
    const fieldValue = record[field];
    if (isSafeScalar(fieldValue) && !isSensitiveString(fieldValue)) {
      sanitized[field] = fieldValue;
    }
  }

  if (!('fileCount' in sanitized) && Array.isArray(record.files)) {
    sanitized.fileCount = record.files.length;
  }
  return sanitized;
}

function unwrapData(value: unknown): unknown {
  const record = toRecord(value);
  return 'data' in record ? record.data : value;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isSafeScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function isSensitiveString(value: string | number | boolean | null): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return (
    /(token|authorization|password|secret|credential|private[\s_-]?key)/i.test(value) ||
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/.test(value) ||
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/.test(value)
  );
}

function compactObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
