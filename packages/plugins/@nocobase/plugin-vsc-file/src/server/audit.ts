/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model } from '@nocobase/database';

export const vscFileAuditActionNames = [
  'createRepository',
  'archiveRepository',
  'saveDraft',
  'push',
  'restoreFile',
  'restoreCommit',
  'updateRef',
] as const;

type VscFileAuditActionName = (typeof vscFileAuditActionNames)[number];

type VscAuditAction = {
  name: `vscFile:${VscFileAuditActionName}`;
  getMetaData: (ctx: Context) => Promise<Record<string, unknown>>;
};

type VscAuditContext = Context & {
  action?: {
    actionName?: string;
    params?: unknown;
  };
  body?: unknown;
};

interface VscAuditRepository {
  id: string;
  ownerType: string;
  ownerId: string;
}

export function createVscFileAuditActions(db: Database): VscAuditAction[] {
  return vscFileAuditActionNames.map((actionName) => ({
    name: `vscFile:${actionName}`,
    getMetaData: (ctx) => getVscFileAuditMetadata(db, ctx),
  }));
}

async function getVscFileAuditMetadata(db: Database, ctx: Context): Promise<Record<string, unknown>> {
  const auditCtx = ctx as VscAuditContext;
  const actionName = auditCtx.action?.actionName;
  const input = getActionInput(auditCtx);
  const responseData = unwrapData(auditCtx.body);
  const response = toRecord(responseData);
  const responseRepository = getRepositoryFromResponse(response);
  const requestedRepoId = toStringValue(input.repoId);
  const repoId = responseRepository?.id || requestedRepoId;
  const repository = responseRepository || (repoId ? await findRepository(db, repoId) : null);
  const commit = toRecord(response.commit);
  const initialCommit = toRecord(response.initialCommit);
  const ref = toRecord(response.ref);
  const targetCommitId =
    toStringValue(commit.id) || toStringValue(initialCommit.id) || toStringValue(input.targetCommitId);
  const refName = toStringValue(ref.name) || (actionName === 'updateRef' ? toStringValue(input.name) : undefined);

  return {
    ...compactObject({
      repoId: repository?.id || repoId,
      ownerType: repository?.ownerType || toStringValue(input.ownerType),
      ownerId: repository?.ownerId || toStringValue(input.ownerId),
      targetCommitId,
      sourceCommitId: toStringValue(input.sourceCommitId),
      refName,
    }),
    request: {
      body: sanitizeRequestBody(actionName, input),
    },
    response: {
      body: sanitizeResponseBody(response),
    },
  };
}

function getActionInput(ctx: VscAuditContext): Record<string, unknown> {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;

  return {
    ...queryParams,
    ...values,
  };
}

function unwrapData(body: unknown): unknown {
  const record = toRecord(body);
  if ('data' in record) {
    return record.data;
  }

  return body;
}

function getRepositoryFromResponse(response: Record<string, unknown>): VscAuditRepository | null {
  const repository = toRecord(response.repository);
  const id = toStringValue(repository.id);
  const ownerType = toStringValue(repository.ownerType);
  const ownerId = toStringValue(repository.ownerId);

  if (!id || !ownerType || !ownerId) {
    return null;
  }

  return {
    id,
    ownerType,
    ownerId,
  };
}

function sanitizeRequestBody(actionName: string | undefined, input: Record<string, unknown>): Record<string, unknown> {
  const fileKey = actionName === 'createRepository' ? 'initialFiles' : 'files';

  return compactObject({
    repoId: toStringValue(input.repoId),
    ownerType: toStringValue(input.ownerType),
    ownerId: toStringValue(input.ownerId),
    name: actionName === 'createRepository' ? toStringValue(input.name) : undefined,
    baseCommitId: toNullableStringValue(input.baseCommitId),
    targetCommitId: toStringValue(input.targetCommitId),
    sourceCommitId: toStringValue(input.sourceCommitId),
    refName: actionName === 'updateRef' ? toStringValue(input.name) : undefined,
    [fileKey]: sanitizeFileList(input[fileKey]),
  });
}

function sanitizeResponseBody(response: Record<string, unknown>): Record<string, unknown> {
  const repository = getRepositoryFromResponse(response);
  const commit = toRecord(response.commit);
  const initialCommit = toRecord(response.initialCommit);
  const ref = toRecord(response.ref);
  const draft = toRecord(response.draft);

  return compactObject({
    repository: repository
      ? {
          id: repository.id,
          ownerType: repository.ownerType,
          ownerId: repository.ownerId,
        }
      : undefined,
    commit: sanitizeCommit(commit),
    initialCommit: sanitizeCommit(initialCommit),
    ref: sanitizeRef(ref),
    draft: sanitizeDraft(draft),
    fileCount: countArray(response.files),
  });
}

function sanitizeCommit(commit: Record<string, unknown>): Record<string, unknown> | undefined {
  const id = toStringValue(commit.id);
  if (!id) {
    return undefined;
  }

  return compactObject({
    id,
    repoId: toStringValue(commit.repoId),
    parentCommitId: toNullableStringValue(commit.parentCommitId),
  });
}

function sanitizeRef(ref: Record<string, unknown>): Record<string, unknown> | undefined {
  const name = toStringValue(ref.name);
  if (!name) {
    return undefined;
  }

  return compactObject({
    name,
    repoId: toStringValue(ref.repoId),
    commitId: toNullableStringValue(ref.commitId),
  });
}

function sanitizeDraft(draft: Record<string, unknown>): Record<string, unknown> | undefined {
  const id = toStringValue(draft.id);
  if (!id) {
    return undefined;
  }

  return compactObject({
    id,
    repoId: toStringValue(draft.repoId),
    userId: toStringValue(draft.userId),
    baseCommitId: toNullableStringValue(draft.baseCommitId),
    status: toStringValue(draft.status),
  });
}

function sanitizeFileList(value: unknown): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((file) => {
    const record = toRecord(file);

    return compactObject({
      path: toStringValue(record.path),
      operation: toStringValue(record.operation),
      size: toNumberValue(record.size),
      language: toStringValue(record.language),
      mode: toStringValue(record.mode),
    });
  });
}

async function findRepository(db: Database, repoId: string): Promise<VscAuditRepository | null> {
  const record = (await db.getRepository('vscFileRepositories').findOne({
    filterByTk: repoId,
    fields: ['id', 'ownerType', 'ownerId'],
  })) as Model | null;

  if (!record) {
    return null;
  }

  const id = toStringValue(record.get('id'));
  const ownerType = toStringValue(record.get('ownerType'));
  const ownerId = toStringValue(record.get('ownerId'));

  if (!id || !ownerType || !ownerId) {
    return null;
  }

  return {
    id,
    ownerType,
    ownerId,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toNullableStringValue(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return toStringValue(value);
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return undefined;
}

function countArray(value: unknown): number | undefined {
  return Array.isArray(value) ? value.length : undefined;
}

function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'undefined'));
}
