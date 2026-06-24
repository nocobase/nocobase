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
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';

import { VscError, isVscError } from '../../shared/errors';
import type { DiffCommitsInput, DiffDraftInput, DiffFileEndpoint, DiffFileInput } from '../services/DiffService';
import type { DiscardDraftInput, GetDraftInput, SaveDraftInput } from '../services/DraftService';
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
import type { VscDraftFileChange, VscFileChange, VscTreeEntryInput } from '../../shared/types';

export const vscFileActionNames = [
  'createRepository',
  'getRepository',
  'archiveRepository',
  'pull',
  'getFile',
  'saveDraft',
  'getDraft',
  'discardDraft',
  'diffDraft',
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
  };
  auth?: {
    user?: unknown;
  };
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
};

type CurrentUserContext = {
  authorId: string | null;
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
  saveDraft: (service, input, currentUser) =>
    service.saveDraft(normalizeSaveDraftInput(input, currentUser), currentUser),
  getDraft: (service, input, currentUser) => service.getDraft(normalizeDraftUserInput(input, currentUser), currentUser),
  discardDraft: (service, input, currentUser) =>
    service.discardDraft(normalizeDraftUserInput(input, currentUser), currentUser),
  diffDraft: (service, input, currentUser) =>
    service.diffDraft(normalizeDiffDraftInput(input, currentUser), currentUser),
  push: (service, input, currentUser) => service.push(normalizePushInput(input, currentUser), currentUser),
  listCommits: (service, input, currentUser) => service.listCommits(normalizeRepositoryIdInput(input), currentUser),
  getCommit: (service, input, currentUser) => service.getCommit(normalizeGetCommitInput(input), currentUser),
  diff: (service, input, currentUser) => service.diff(normalizeDiffCommitsInput(input), currentUser),
  diffFile: (service, input, currentUser) => service.diffFile(normalizeDiffFileInput(input, currentUser), currentUser),
  restoreFile: (service, input, currentUser) =>
    service.restoreFile(normalizeRestoreFileInput(input, currentUser), currentUser),
  restoreCommit: (service, input, currentUser) =>
    service.restoreCommit(normalizeRestoreCommitInput(input, currentUser), currentUser),
  listRefs: (service, input, currentUser) => service.listRefs(normalizeListRefsInput(input), currentUser),
  updateRef: (service, input, currentUser) => service.updateRef(normalizeUpdateRefInput(input), currentUser),
};

export function createVscFileResource(db: Database): ResourceOptions {
  return {
    name: 'vscFile',
    only: [...vscFileActionNames],
    actions: Object.fromEntries(
      vscFileActionNames.map((actionName) => [actionName, createVscFileAction(db, resourceActionRunners[actionName])]),
    ) as Record<VscFileActionName, HandlerType>,
  };
}

function createVscFileAction(db: Database, run: ResourceActionRunner): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as VscResourceContext;
    const service = new VscFileService(db);

    try {
      resourceCtx.body = await run(service, getActionInput(resourceCtx), {
        authorId: getCurrentUserId(resourceCtx),
      });
      await next();
    } catch (error) {
      if (!isVscError(error)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = error.status;
      resourceCtx.body = error.toResponseBody();
    }
  };
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
    ref: optionalString(input, 'ref'),
    knownTreeHash: optionalString(input, 'knownTreeHash'),
    includeContent: optionalIncludeContent(input),
    selectedPaths: optionalStringArray(input, 'selectedPaths'),
  });
}

function normalizeGetFileInput(input: ResourceActionInput): GetFileInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    ref: optionalString(input, 'ref'),
    path: requireString(input, 'path'),
  });
}

function normalizeSaveDraftInput(input: ResourceActionInput, currentUser: CurrentUserContext): SaveDraftInput {
  return {
    ...normalizeDraftUserInput(input, currentUser),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    files: requireArray(input, 'files', normalizeDraftFileChange),
  };
}

function normalizeDraftUserInput(input: ResourceActionInput, currentUser: CurrentUserContext): GetDraftInput {
  return {
    repoId: requireString(input, 'repoId'),
    userId: requireCurrentDraftUserId(input, currentUser),
  };
}

function normalizeDiffDraftInput(input: ResourceActionInput, currentUser: CurrentUserContext): DiffDraftInput {
  return normalizeDraftUserInput(input, currentUser);
}

function normalizePushInput(input: ResourceActionInput, currentUser: CurrentUserContext): PushInput {
  const draftId = optionalString(input, 'draftId');
  if (draftId && !currentUser.authorId) {
    throw new VscError('PERMISSION_DENIED', 'Current user is required to push a draft');
  }

  return compactObject({
    repoId: requireString(input, 'repoId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    message: requireString(input, 'message'),
    files: requireArray(input, 'files', normalizeFileChange),
    allowEmptyCommit: optionalBoolean(input, 'allowEmptyCommit'),
    draftId,
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

function normalizeDiffCommitsInput(input: ResourceActionInput): DiffCommitsInput {
  return {
    repoId: requireString(input, 'repoId'),
    fromCommitId: requireString(input, 'fromCommitId'),
    toCommitId: requireString(input, 'toCommitId'),
  };
}

function normalizeDiffFileInput(input: ResourceActionInput, currentUser: CurrentUserContext): DiffFileInput {
  return compactObject({
    repoId: requireString(input, 'repoId'),
    from: normalizeOptionalDiffFileEndpoint(input.from, currentUser, 'from'),
    to: normalizeOptionalDiffFileEndpoint(input.to, currentUser, 'to'),
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
  return compactObject({
    repoId: requireString(input, 'repoId'),
    name: requireString(input, 'name'),
    targetCommitId: requireString(input, 'targetCommitId'),
    basePublishedCommitId: optionalNullableString(input, 'basePublishedCommitId'),
  });
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
  const operation = optionalDraftFileOperation(entry, 'operation', label);

  return compactObject({
    ...normalizeTreeEntryInput(entry, label),
    operation,
  });
}

function normalizeDraftFileChange(value: unknown, label: string): VscDraftFileChange {
  const entry = requireRecord(value, label);
  const operation = requireDraftFileOperation(entry, 'operation', label);
  const content = optionalString(entry, 'content', label);

  if (operation === 'upsert' && typeof content !== 'string') {
    throwBadRequest(`${fieldPath(label, 'content')} must be a string for upsert operations`);
  }

  return compactObject({
    path: requireString(entry, 'path', label),
    operation,
    content,
  });
}

function normalizeOptionalDiffFileEndpoint(
  value: unknown,
  currentUser: CurrentUserContext,
  label: string,
): DiffFileEndpoint | null | undefined {
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
  if (type === 'draft') {
    return {
      type,
      userId: requireCurrentDraftUserId(endpoint, currentUser, label),
      path: requireString(endpoint, 'path', label),
    };
  }
  if (type === 'blob') {
    return {
      type,
      blobHash: requireString(endpoint, 'blobHash', label),
    };
  }

  throwBadRequest(`${fieldPath(label, 'type')} must be one of commit, draft, or blob`);
}

function requireCurrentDraftUserId(
  input: ResourceActionInput,
  currentUser: CurrentUserContext,
  label?: string,
): string {
  if (!currentUser.authorId) {
    throw new VscError('PERMISSION_DENIED', 'Current user is required for draft actions');
  }

  const requestedUserId = optionalUserId(input, 'userId', label);
  if (requestedUserId && requestedUserId !== currentUser.authorId) {
    throw new VscError('PERMISSION_DENIED', 'Draft user does not match the current user');
  }

  return currentUser.authorId;
}

function requireString(input: ResourceActionInput, key: string, label?: string): string {
  const value = input[key];
  if (typeof value !== 'string' || !value) {
    throwBadRequest(`${fieldPath(label, key)} must be a non-empty string`);
  }

  return value;
}

function optionalString(input: ResourceActionInput, key: string, label?: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throwBadRequest(`${fieldPath(label, key)} must be a string`);
  }

  return value;
}

function optionalUserId(input: ResourceActionInput, key: string, label?: string): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined' || value === null) {
    return undefined;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throwBadRequest(`${fieldPath(label, key)} must be a string or number`);
  }

  return String(value);
}

function requireNullableString(input: ResourceActionInput, key: string, label?: string): string | null {
  const value = input[key];
  if (value === null || typeof value === 'string') {
    return value;
  }

  throwBadRequest(`${fieldPath(label, key)} must be a string or null`);
}

function optionalNullableString(input: ResourceActionInput, key: string, label?: string): string | null | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === null || typeof value === 'string') {
    return value;
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

function requireDraftFileOperation(
  input: ResourceActionInput,
  key: string,
  label?: string,
): VscDraftFileChange['operation'] {
  const value = input[key];
  if (value === 'upsert' || value === 'delete') {
    return value;
  }

  throwBadRequest(`${fieldPath(label, key)} must be one of upsert or delete`);
}

function optionalDraftFileOperation(
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
