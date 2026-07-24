/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model, Transaction } from '@nocobase/database';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { VscError, isVscError } from '../../../shared/vsc-file/errors';
import type { ListCommitsInput } from '../services/CommitService';
import type { DiffCommitsInput, DiffFileEndpoint, DiffFileInput } from '../services/DiffService';
import type { VscPermissionAction, VscPermissionHookRegistry, VscPermissionRequestMetadata } from '../permissions';
import type { ListRefsInput, RestoreCommitInput, RestoreFileInput, UpdateRefInput } from '../services/RefService';
import type {
  CreateRepositoryInput,
  GetCommitInput,
  GetFileInput,
  PullInput,
  PushInput,
  RepositoryIdInput,
} from '../services/VscFileService';
import { VscFileService } from '../services/VscFileService';
import { RepositoryService } from '../services/RepositoryService';
import { RemoteSyncError } from '../remotes/RemoteSyncAdapter';
import type { VscFileChange, VscTreeEntryInput } from '../../../shared/vsc-file/types';

export const vscFileActionNames = [
  'createRepository',
  'getRepository',
  'archiveRepository',
  'pull',
  'getFile',
  'push',
  'listCommits',
  'getCommit',
  'diff',
  'diffFile',
  'restoreFile',
  'restoreCommit',
  'listRefs',
  'updateRef',
] as const;

type VscFileActionName = (typeof vscFileActionNames)[number];

type ResourceActionInput = Record<string, unknown>;

type VscResourceContext = Context & {
  action?: {
    params?: unknown;
    resourceName?: string;
    actionName?: string;
  };
  auth?: {
    user?: unknown;
  };
  request?: {
    path?: string;
    method?: string;
    header?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
  };
  state?: {
    currentRole?: unknown;
    currentRoles?: unknown;
  };
  dataSource?: {
    name?: unknown;
  };
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
};

type CurrentUserContext = {
  authorId: string | null;
  request?: VscPermissionRequestMetadata;
  transaction?: Transaction;
};

type ResourceActionRunner = (
  service: VscFileService,
  input: ResourceActionInput,
  currentUser: CurrentUserContext,
) => Promise<unknown>;

const resourceActionRunners: Record<VscFileActionName, ResourceActionRunner> = {
  createRepository: (service, input, currentUser) =>
    service.createRepository(normalizeCreateRepositoryInput(input, currentUser), currentUser),
  getRepository: (service, input, currentUser) => service.getRepository(normalizeRepositoryIdInput(input), currentUser),
  archiveRepository: (service, input, currentUser) =>
    service.archiveRepository(normalizeRepositoryIdInput(input), currentUser),
  pull: (service, input, currentUser) => service.pull(normalizePullInput(input), currentUser),
  getFile: (service, input, currentUser) => service.getFile(normalizeGetFileInput(input), currentUser),
  push: (service, input, currentUser) => service.push(normalizePushInput(input, currentUser), currentUser),
  listCommits: (service, input, currentUser) => service.listCommits(normalizeListCommitsInput(input), currentUser),
  getCommit: (service, input, currentUser) => service.getCommit(normalizeGetCommitInput(input), currentUser),
  diff: (service, input, currentUser) => service.diff(normalizeDiffCommitsInput(input), currentUser),
  diffFile: (service, input, currentUser) => service.diffFile(normalizeDiffFileInput(input), currentUser),
  restoreFile: (service, input, currentUser) =>
    service.restoreFile(normalizeRestoreFileInput(input, currentUser), currentUser),
  restoreCommit: (service, input, currentUser) =>
    service.restoreCommit(normalizeRestoreCommitInput(input, currentUser), currentUser),
  listRefs: (service, input, currentUser) => service.listRefs(normalizeListRefsInput(input), currentUser),
  updateRef: (service, input, currentUser) => service.updateRef(normalizeUpdateRefInput(input), currentUser),
};

export function createVscFileResource(db: Database, permissionHooks?: VscPermissionHookRegistry): ResourceOptions {
  return {
    name: 'vscFile',
    only: [...vscFileActionNames],
    actions: Object.fromEntries(
      vscFileActionNames.map((actionName) => [
        actionName,
        createVscFileAction(db, actionName, resourceActionRunners[actionName], permissionHooks),
      ]),
    ) as Record<VscFileActionName, HandlerType>,
  };
}

function createVscFileAction(
  db: Database,
  actionName: VscFileActionName,
  run: ResourceActionRunner,
  permissionHooks?: VscPermissionHookRegistry,
): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as VscResourceContext;
    const service = new VscFileService(db, permissionHooks);

    const input = getActionInput(resourceCtx);
    const currentUser = {
      authorId: getCurrentUserId(resourceCtx),
      request: getRequestMetadata(resourceCtx),
    };

    try {
      await preflightProtectedOwner(db, permissionHooks, actionName, input, currentUser);
      resourceCtx.body =
        actionName === 'archiveRepository'
          ? await db.sequelize.transaction(async (transaction) => {
              const repoId = requireString(input, 'repoId');
              await assertRepositorySyncIdle(db, repoId, transaction);
              return run(service, input, { ...currentUser, transaction });
            })
          : await run(service, input, currentUser);
      await next();
    } catch (error) {
      if (!isVscError(error) && !(error instanceof RemoteSyncError)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = error.status;
      resourceCtx.body = error.toResponseBody();
    }
  };
}

async function preflightProtectedOwner(
  db: Database,
  permissionHooks: VscPermissionHookRegistry | undefined,
  action: VscPermissionAction,
  input: ResourceActionInput,
  currentUser: CurrentUserContext,
): Promise<void> {
  if (!permissionHooks) {
    return;
  }
  if (action === 'createRepository') {
    const ownerType = typeof input.ownerType === 'string' ? input.ownerType : undefined;
    if (ownerType !== 'light-extension' && ownerType !== 'runjs-source') {
      return;
    }
    await permissionHooks.assertAllowed({
      userId: currentUser.authorId,
      action,
      ownerType,
      ownerId: typeof input.ownerId === 'string' ? input.ownerId : undefined,
      request: currentUser.request,
    });
    return;
  }
  const repoId = typeof input.repoId === 'string' ? input.repoId : undefined;
  if (!repoId) {
    return;
  }
  const repository = await new RepositoryService(db).getRepository(repoId, currentUser.transaction);
  if (repository.ownerType !== 'light-extension' && repository.ownerType !== 'runjs-source') {
    return;
  }
  await permissionHooks.assertAllowed({
    userId: currentUser.authorId,
    action,
    repoId,
    repository,
    ownerType: repository.ownerType,
    ownerId: repository.ownerId,
    request: currentUser.request,
  });
}

async function assertRepositorySyncIdle(db: Database, repoId: string, transaction: Transaction): Promise<void> {
  const remotes = await db.getRepository('vscFileRemotes').find({
    filter: { repoId },
    fields: ['id'],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const repository = await db.getModel<Model>('vscFileRepositories').findByPk(repoId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!repository || !remotes.length) {
    return;
  }
  const activeJobs = await db.getRepository('vscFileSyncJobs').count({
    filter: {
      remoteId: { $in: remotes.map((remote) => String(remote.get('id'))) },
      status: { $in: ['pending', 'running', 'finalize-pending'] },
    },
    transaction,
  });
  if (activeJobs > 0) {
    throw new RemoteSyncError('BUSY', 'Repository has an active synchronization job', {
      details: { reasonCode: 'active-sync-job' },
    });
  }
}

function getActionInput(ctx: VscResourceContext): ResourceActionInput {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;

  return {
    ...queryParams,
    ...values,
  };
}

function toRecord(value: unknown): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ResourceActionInput;
}

function getCurrentUserId(ctx: VscResourceContext): string | null {
  const user = ctx.auth?.user;
  if (!user || typeof user !== 'object') {
    return null;
  }

  const userWithId = user as { id?: unknown };
  if (typeof userWithId.id === 'string' || typeof userWithId.id === 'number') {
    return String(userWithId.id);
  }

  const get = (user as { get?: (key: string) => unknown }).get;
  if (typeof get !== 'function') {
    return null;
  }

  const id = get('id');
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}

function getRequestMetadata(ctx: VscResourceContext): VscPermissionRequestMetadata {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  return compactObject({
    resourceName: ctx.action?.resourceName,
    actionName: ctx.action?.actionName,
    requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
    path: ctx.request?.path,
    method: ctx.request?.method,
    requestSource: getHeader(headers, 'x-request-source'),
    locale: getHeader(headers, 'x-locale'),
    timezone: getHeader(headers, 'x-timezone'),
    dataSource: getHeader(headers, 'x-data-source') || toStringValue(ctx.dataSource?.name),
    roleName: toStringValue(ctx.state?.currentRole),
    roles: toStringArray(ctx.state?.currentRoles),
  });
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.map((item) => toStringValue(item)).filter((item): item is string => typeof item === 'string');

  return strings.length ? strings : undefined;
}

function normalizeCreateRepositoryInput(
  input: ResourceActionInput,
  currentUser: CurrentUserContext,
): CreateRepositoryInput {
  const initialFiles = optionalArray(input, 'initialFiles', normalizeTreeEntryInput);

  return compactObject({
    ownerType: requireString(input, 'ownerType'),
    ownerId: requireString(input, 'ownerId'),
    name: requireString(input, 'name'),
    initialFiles,
    message: optionalString(input, 'message'),
    authorId: currentUser.authorId,
    metadata: optionalRecord(input, 'metadata'),
  });
}

function normalizeRepositoryIdInput(input: ResourceActionInput): RepositoryIdInput {
  return {
    repoId: requireString(input, 'repoId'),
  };
}

function normalizePullInput(input: ResourceActionInput): PullInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    ref: optionalRefName(input, 'ref'),
    knownTreeHash: optionalString(input, 'knownTreeHash'),
    includeContent: optionalIncludeContent(input),
    selectedPaths: optionalStringArray(input, 'selectedPaths'),
  });
}

function normalizeGetFileInput(input: ResourceActionInput): GetFileInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    ref: optionalRefName(input, 'ref'),
    path: requireString(input, 'path'),
  });
}

function normalizePushInput(input: ResourceActionInput, currentUser: CurrentUserContext): PushInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    message: requireString(input, 'message'),
    files: requireArray(input, 'files', normalizeFileChange),
    allowEmptyCommit: optionalBoolean(input, 'allowEmptyCommit'),
    authorId: currentUser.authorId,
    metadata: optionalRecord(input, 'metadata'),
  });
}

function normalizeGetCommitInput(input: ResourceActionInput): GetCommitInput {
  return {
    repoId: requireString(input, 'repoId'),
    commitId: requireString(input, 'commitId'),
  };
}

function normalizeListCommitsInput(input: ResourceActionInput): ListCommitsInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    limit: optionalPositiveInteger(input, 'limit'),
    beforeSeq: optionalPositiveInteger(input, 'beforeSeq'),
  });
}

function normalizeDiffCommitsInput(input: ResourceActionInput): DiffCommitsInput {
  return {
    repoId: requireString(input, 'repoId'),
    fromCommitId: requireString(input, 'fromCommitId'),
    toCommitId: requireString(input, 'toCommitId'),
  };
}

function normalizeDiffFileInput(input: ResourceActionInput): DiffFileInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    from: normalizeOptionalDiffFileEndpoint(input.from, 'from'),
    to: normalizeOptionalDiffFileEndpoint(input.to, 'to'),
  });
}

function normalizeRestoreFileInput(input: ResourceActionInput, currentUser: CurrentUserContext): RestoreFileInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    sourceCommitId: requireString(input, 'sourceCommitId'),
    path: requireString(input, 'path'),
    message: optionalString(input, 'message'),
    authorId: currentUser.authorId,
    metadata: optionalRecord(input, 'metadata'),
  });
}

function normalizeRestoreCommitInput(input: ResourceActionInput, currentUser: CurrentUserContext): RestoreCommitInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    sourceCommitId: requireString(input, 'sourceCommitId'),
    message: optionalString(input, 'message'),
    authorId: currentUser.authorId,
    metadata: optionalRecord(input, 'metadata'),
  });
}

function normalizeListRefsInput(input: ResourceActionInput): ListRefsInput {
  return normalizeRepositoryIdInput(input);
}

function normalizeUpdateRefInput(input: ResourceActionInput): UpdateRefInput {
  return {
    repoId: requireString(input, 'repoId'),
    name: requireHeadRefName(input, 'name'),
    targetCommitId: requireString(input, 'targetCommitId'),
  };
}

function normalizeTreeEntryInput(value: unknown, label: string): VscTreeEntryInput {
  const entry = requireRecord(value, label);

  return compactObject({
    path: requireString(entry, 'path', label),
    content: optionalString(entry, 'content', label),
    blobHash: optionalString(entry, 'blobHash', label),
    size: optionalNumber(entry, 'size', label),
    language: optionalString(entry, 'language', label),
    mode: optionalString(entry, 'mode', label),
  });
}

function normalizeFileChange(value: unknown, label: string): VscFileChange {
  const entry = requireRecord(value, label);
  const operation = optionalFileOperation(entry, 'operation', label);

  return compactObject({
    ...normalizeTreeEntryInput(entry, label),
    operation,
  });
}

function normalizeOptionalDiffFileEndpoint(value: unknown, label: string): DiffFileEndpoint | null | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === null) {
    return null;
  }

  const endpoint = requireRecord(value, label);
  const type = requireString(endpoint, 'type', label);

  if (type === 'commit') {
    return {
      type,
      commitId: requireString(endpoint, 'commitId', label),
      path: requireString(endpoint, 'path', label),
    };
  }
  throwBadRequest(`${fieldPath(label, 'type')} must be commit`);
}

function requireString(input: ResourceActionInput, key: string, label?: string): string {
  const value = input[key];
  if (typeof value !== 'string' || !value) {
    throwBadRequest(`${fieldPath(label, key)} must be a non-empty string`);
  }

  return value as string;
}

function optionalString(input: ResourceActionInput, key: string, label?: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throwBadRequest(`${fieldPath(label, key)} must be a string`);
  }

  return value as string;
}

function optionalRefName(input: ResourceActionInput, key: string): PullInput['ref'] | undefined {
  const value = optionalString(input, key);
  if (value === undefined) {
    return undefined;
  }
  if (value === 'head') {
    return 'head';
  }

  throwBadRequest(`${key} must be head`);
}

function requireHeadRefName(input: ResourceActionInput, key: string): UpdateRefInput['name'] {
  const value = requireString(input, key);
  if (value === 'head') {
    return value;
  }

  throwBadRequest(`${key} must be head`);
}

function requireNullableString(input: ResourceActionInput, key: string, label?: string): string | null {
  const value = input[key];
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value as string;
  }

  throwBadRequest(`${fieldPath(label, key)} must be a string or null`);
}

function optionalNullableString(input: ResourceActionInput, key: string, label?: string): string | null | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value as string;
  }

  throwBadRequest(`${fieldPath(label, key)} must be a string or null`);
}

function optionalNumber(input: ResourceActionInput, key: string, label?: string): number | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throwBadRequest(`${fieldPath(label, key)} must be a finite number`);
  }

  return value;
}

function optionalPositiveInteger(input: ResourceActionInput, key: string, label?: string): number | undefined {
  const value = optionalNumber(input, key, label);
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 1) {
    throwBadRequest(`${fieldPath(label, key)} must be a positive integer`);
  }

  return value;
}

function optionalBoolean(input: ResourceActionInput, key: string, label?: string): boolean | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throwBadRequest(`${fieldPath(label, key)} must be a boolean`);
  }

  return value;
}

function optionalRecord(input: ResourceActionInput, key: string, label?: string): Record<string, unknown> | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }

  return requireRecord(value, fieldPath(label, key));
}

function requireRecord(value: unknown, label: string): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throwBadRequest(`${label} must be an object`);
  }

  return value as ResourceActionInput;
}

function requireArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
): T[] {
  const value = input[key];
  if (!Array.isArray(value)) {
    throwBadRequest(`${key} must be an array`);
  }

  return value.map((item, index) => normalize(item, `${key}[${index}]`));
}

function optionalArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
): T[] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throwBadRequest(`${key} must be an array`);
  }

  return value.map((item, index) => normalize(item, `${key}[${index}]`));
}

function optionalStringArray(input: ResourceActionInput, key: string): string[] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throwBadRequest(`${key} must be an array`);
  }

  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throwBadRequest(`${key}[${index}] must be a string`);
    }
    return item;
  });
}

function optionalIncludeContent(input: ResourceActionInput): PullInput['includeContent'] | undefined {
  const value = input.includeContent;
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === 'none' || value === 'selected' || value === 'all') {
    return value;
  }

  throwBadRequest('includeContent must be one of none, selected, or all');
}

function optionalFileOperation(
  input: ResourceActionInput,
  key: string,
  label?: string,
): VscFileChange['operation'] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === 'upsert' || value === 'delete') {
    return value;
  }

  throwBadRequest(`${fieldPath(label, key)} must be one of upsert or delete`);
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'undefined')) as T;
}

function fieldPath(label: string | undefined, key: string): string {
  return label ? `${label}.${key}` : key;
}

function throwBadRequest(message: string): never {
  throw new VscError('PATH_INVALID', message, { status: 400 });
}
