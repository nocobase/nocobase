/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
import { createRunJSSourceAuditActions, createVscFileAuditActions } from '@nocobase/runjs/workspace/server';

type AuditAction = {
  name: string;
  getMetaData?: (ctx: Context) => Promise<Record<string, unknown>>;
};

type AuditManagerLike = {
  registerAction(action: AuditAction): void;
  resources: Map<string, Map<string, unknown>>;
};

interface OwnedAuditRegistration {
  resourceName: string;
  actionName: string;
  owned: unknown;
  previous: unknown;
}

export function registerJsTemplateRunJSWriteAuditActions(auditManager: AuditManagerLike, db: Database): () => void {
  const registrations: OwnedAuditRegistration[] = [];
  const actions = [...createVscFileAuditActions(db), ...createRunJSSourceAuditActions(db)].map((action) => ({
    name: action.name,
    getMetaData: async (ctx: Context) => sanitizeWriteAuditMetadata(await action.getMetaData(ctx)),
  }));

  for (const action of actions) {
    const key = parseAuditActionName(action.name);
    const previous = auditManager.resources.get(key.resourceName)?.get(key.actionName);
    auditManager.registerAction(action);
    const owned = auditManager.resources.get(key.resourceName)?.get(key.actionName);
    registrations.push({ ...key, owned, previous });
  }

  return () => {
    for (const registration of [...registrations].reverse()) {
      const resource = auditManager.resources.get(registration.resourceName);
      if (!resource || resource.get(registration.actionName) !== registration.owned) {
        continue;
      }
      if (registration.previous) {
        resource.set(registration.actionName, registration.previous);
      } else {
        resource.delete(registration.actionName);
        if (!resource.size) {
          auditManager.resources.delete(registration.resourceName);
        }
      }
    }
  };
}

function sanitizeWriteAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const request = toRecord(metadata.request);
  const response = toRecord(metadata.response);
  return compactObject({
    resource: safeString(metadata.resource),
    action: safeString(metadata.action),
    locatorKind: safeString(metadata.locatorKind),
    ownerType: safeString(metadata.ownerType),
    ownerId: safeString(metadata.ownerId),
    repositoryOwnerId: safeString(metadata.repositoryOwnerId),
    repoId: safeString(metadata.repoId),
    commitId: safeString(metadata.commitId),
    targetCommitId: safeString(metadata.targetCommitId),
    sourceCommitId: safeString(metadata.sourceCommitId),
    refName: safeString(metadata.refName),
    fileCount: safeNumber(metadata.fileCount),
    request: sanitizeAuditRequest(sanitizeWriteAuditBody(toRecord(request.body))),
    response: { body: sanitizeWriteAuditBody(toRecord(response.body)) },
  });
}

function sanitizeAuditRequest(body: Record<string, unknown>): Record<string, unknown> {
  return {
    params: {},
    query: {},
    body,
    path: undefined,
    headers: {},
  };
}

function sanitizeWriteAuditBody(body: Record<string, unknown>): Record<string, unknown> {
  const repository = sanitizeRepository(toRecord(body.repository));
  const commit = sanitizeCommit(toRecord(body.commit));
  const initialCommit = sanitizeCommit(toRecord(body.initialCommit));
  const ref = sanitizeRef(toRecord(body.ref));
  const artifact = sanitizeArtifact(toRecord(body.artifact));
  const files = summarizeFiles(body.files);
  const changes = summarizeChanges(body.changes);
  return compactObject({
    repoId: safeString(body.repoId),
    ownerType: safeString(body.ownerType),
    ownerId: safeString(body.ownerId),
    locatorKind: safeString(body.locatorKind),
    baseCommitId: safeNullableString(body.baseCommitId),
    targetCommitId: safeString(body.targetCommitId),
    sourceCommitId: safeString(body.sourceCommitId),
    refName: safeString(body.refName),
    repository,
    commit,
    initialCommit,
    ref,
    artifact,
    ownerFingerprint: safeString(body.ownerFingerprint),
    fileCount: safeNumber(body.fileCount) ?? files?.count,
    totalSize: files?.totalSize ?? changes?.totalSize,
    contentHashes: changes?.contentHashes,
  });
}

function summarizeFiles(value: unknown): { count: number; totalSize?: number } | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const sizes = value.map((file) => safeNumber(toRecord(file).size)).filter((size): size is number => size != null);
  return {
    count: value.length,
    ...(sizes.length ? { totalSize: sizes.reduce((total, size) => total + size, 0) } : {}),
  };
}

function summarizeChanges(value: unknown): { totalSize?: number; contentHashes?: string[] } | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const records = value.map(toRecord);
  const sizes = records.map((change) => safeNumber(change.size)).filter((size): size is number => size != null);
  const contentHashes = records
    .map((change) => safeHash(change.contentHash))
    .filter((hash): hash is string => Boolean(hash));
  return compactObject({
    totalSize: sizes.length ? sizes.reduce((total, size) => total + size, 0) : undefined,
    contentHashes: contentHashes.length ? contentHashes : undefined,
  });
}

function sanitizeRepository(value: Record<string, unknown>): Record<string, unknown> | undefined {
  const result = compactObject({
    id: safeString(value.id),
    ownerType: safeString(value.ownerType),
    ownerId: safeString(value.ownerId),
  });
  return Object.keys(result).length ? result : undefined;
}

function sanitizeCommit(value: Record<string, unknown>): Record<string, unknown> | undefined {
  const result = compactObject({
    id: safeString(value.id),
    repoId: safeString(value.repoId),
    parentCommitId: safeNullableString(value.parentCommitId),
  });
  return Object.keys(result).length ? result : undefined;
}

function sanitizeRef(value: Record<string, unknown>): Record<string, unknown> | undefined {
  const result = compactObject({
    name: safeString(value.name),
    repoId: safeString(value.repoId),
    commitId: safeNullableString(value.commitId),
  });
  return Object.keys(result).length ? result : undefined;
}

function sanitizeArtifact(value: Record<string, unknown>): Record<string, unknown> | undefined {
  const result = compactObject({
    filesHash: safeHash(value.filesHash),
    runtimeCodeHash: safeHash(value.runtimeCodeHash),
    diagnosticsCount: safeNumber(value.diagnosticsCount),
  });
  return Object.keys(result).length ? result : undefined;
}

function parseAuditActionName(name: string): { resourceName: string; actionName: string } {
  const [resourceName, actionName, extra] = name.split(':');
  if (!resourceName || !actionName || extra) {
    throw new TypeError(`Invalid audit action name: ${name}`);
  }
  return { resourceName, actionName };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function safeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function safeNullableString(value: unknown): string | null | undefined {
  return value === null ? null : safeString(value);
}

function safeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function safeHash(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-f0-9]{64}$/iu.test(value) ? value : undefined;
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'undefined')) as T;
}
