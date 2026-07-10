/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';
import { isVscError } from '@nocobase/plugin-vsc-file';

import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type { LightExtensionFileChange } from '../../shared/types';
import type {
  LightExtensionDiffFileEndpoint,
  LightExtensionDiffFileInput,
  LightExtensionDiffInput,
  LightExtensionGetCommitInput,
  LightExtensionGetFileInput,
  LightExtensionListCommitsInput,
  LightExtensionPullCommitInput,
  LightExtensionPullInput,
} from '../services/LightExtensionFileService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { toLightExtensionSourceError } from './errorContract';

export const lightExtensionFileActionNames = [
  'pull',
  'pullCommit',
  'getFile',
  'readArchivedSource',
  'saveSource',
  'listCommits',
  'history',
  'getCommit',
  'diff',
  'diffFile',
] as const;

type LightExtensionFileActionName = (typeof lightExtensionFileActionNames)[number];

type ResourceActionInput = Record<string, unknown>;

type LightExtensionResourceContext = Context & {
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
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
};

type ResourceActionRunner = (
  services: LightExtensionFileActionServices,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

interface LightExtensionFileActionServices {
  fileService: LightExtensionFileService;
  runtimeCompileService: LightExtensionRuntimeCompileService;
}

const resourceActionRunners: Record<LightExtensionFileActionName, ResourceActionRunner> = {
  pull: (services, input, currentUser) => services.fileService.pull(normalizePullInput(input), currentUser),
  pullCommit: (services, input, currentUser) =>
    services.fileService.pullCommit(normalizePullCommitInput(input), currentUser),
  getFile: (services, input, currentUser) => services.fileService.getFile(normalizeGetFileInput(input), currentUser),
  readArchivedSource: (services, input, currentUser) =>
    services.fileService.readArchivedSource(normalizeGetFileInput(input), currentUser),
  saveSource: (services, input, currentUser) =>
    services.runtimeCompileService.saveSource(
      {
        repoId: requireRepoId(input),
        baseCommitId: optionalNullableString(input, 'baseCommitId') ?? null,
        message: requireString(input, 'message'),
        files: requireArray(input, 'files', normalizeFileChange),
        allowEmptyCommit: optionalBoolean(input, 'allowEmptyCommit'),
      },
      currentUser,
    ),
  listCommits: (services, input, currentUser) =>
    services.fileService.listCommits(normalizeListCommitsInput(input), currentUser),
  history: (services, input, currentUser) =>
    services.fileService.listCommits(normalizeListCommitsInput(input), currentUser),
  getCommit: (services, input, currentUser) =>
    services.fileService.getCommit(normalizeGetCommitInput(input), currentUser),
  diff: (services, input, currentUser) => services.fileService.diff(normalizeDiffInput(input), currentUser),
  diffFile: (services, input, currentUser) => services.fileService.diffFile(normalizeDiffFileInput(input), currentUser),
};

export function createLightExtensionFilesResource(
  fileService: LightExtensionFileService,
  runtimeCompileService: LightExtensionRuntimeCompileService,
): ResourceOptions {
  const services = {
    fileService,
    runtimeCompileService,
  };

  return {
    name: 'lightExtensionFiles',
    only: [...lightExtensionFileActionNames],
    actions: Object.fromEntries(
      lightExtensionFileActionNames.map((actionName) => [
        actionName,
        createLightExtensionFileAction(services, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionFileActionName, HandlerType>,
  };
}

function createLightExtensionFileAction(
  services: LightExtensionFileActionServices,
  run: ResourceActionRunner,
): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as LightExtensionResourceContext;
    const input = getActionInput(resourceCtx);

    try {
      resourceCtx.body = await run(services, input, getServiceContext(resourceCtx));
      await next();
    } catch (error) {
      const safeError = isVscError(error) ? toLightExtensionSourceError(error, getOptionalRepoId(input)) : error;
      if (!isLightExtensionError(safeError)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = safeError.status;
      resourceCtx.body = safeError.toResponseBody();
    }
  };
}

function normalizePullInput(input: ResourceActionInput): LightExtensionPullInput {
  return compactObject({
    repoId: requireRepoId(input),
    ref: optionalString(input, 'ref'),
    knownTreeHash: optionalString(input, 'knownTreeHash'),
    includeContent: optionalIncludeContent(input),
    selectedPaths: optionalStringArray(input, 'selectedPaths'),
  });
}

function normalizePullCommitInput(input: ResourceActionInput): LightExtensionPullCommitInput {
  return compactObject({
    repoId: requireRepoId(input),
    commitId: requireString(input, 'commitId'),
    knownTreeHash: optionalString(input, 'knownTreeHash'),
    includeContent: optionalIncludeContent(input),
    selectedPaths: optionalStringArray(input, 'selectedPaths'),
  });
}

function normalizeGetFileInput(input: ResourceActionInput): LightExtensionGetFileInput {
  return compactObject({
    repoId: requireRepoId(input),
    ref: optionalString(input, 'ref'),
    path: requireString(input, 'path'),
  });
}

function normalizeListCommitsInput(input: ResourceActionInput): LightExtensionListCommitsInput {
  return compactObject({
    repoId: requireRepoId(input),
    limit: optionalPositiveInteger(input, 'limit'),
    beforeSeq: optionalPositiveInteger(input, 'beforeSeq'),
  });
}

function normalizeGetCommitInput(input: ResourceActionInput): LightExtensionGetCommitInput {
  return {
    repoId: requireRepoId(input),
    commitId: requireString(input, 'commitId'),
  };
}

function normalizeDiffInput(input: ResourceActionInput): LightExtensionDiffInput {
  return {
    repoId: requireRepoId(input),
    fromCommitId: requireString(input, 'fromCommitId'),
    toCommitId: requireString(input, 'toCommitId'),
  };
}

function normalizeDiffFileInput(input: ResourceActionInput): LightExtensionDiffFileInput {
  return compactObject({
    repoId: requireRepoId(input),
    from: normalizeOptionalDiffFileEndpoint(input.from, 'from'),
    to: normalizeOptionalDiffFileEndpoint(input.to, 'to'),
  });
}

function normalizeOptionalDiffFileEndpoint(
  value: unknown,
  label: string,
): LightExtensionDiffFileEndpoint | null | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === null) {
    return null;
  }

  const record = requireRecord(value, label);
  const type = requireString(record, 'type', `${label}.type`);
  if (type !== 'commit') {
    throw invalidInput(`${label}.type must be commit`);
  }

  return {
    type,
    commitId: requireString(record, 'commitId', `${label}.commitId`),
    path: requireString(record, 'path', `${label}.path`),
  };
}

function normalizeFileChange(value: unknown, label: string): LightExtensionFileChange {
  const record = requireRecord(value, label);
  const operation = optionalFileOperation(record, 'operation', label);
  const normalized = compactObject({
    path: requireString(record, 'path', label),
    content: optionalString(record, 'content', label),
    blobHash: optionalString(record, 'blobHash', label),
    size: optionalNumber(record, 'size', label),
    language: optionalString(record, 'language', label),
    mode: optionalString(record, 'mode', label),
    operation,
  });

  assertFileChangeSource(normalized, label);

  return normalized;
}

function getActionInput(ctx: LightExtensionResourceContext): ResourceActionInput {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;

  return {
    ...queryParams,
    ...values,
  };
}

function getServiceContext(ctx: LightExtensionResourceContext): LightExtensionServiceContext {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  return {
    actorUserId: getCurrentUserId(ctx),
    requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
    requestSource: getHeader(headers, 'x-request-source'),
  };
}

function getCurrentUserId(ctx: LightExtensionResourceContext): string | null {
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

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function requireRepoId(input: ResourceActionInput): string {
  return requireString(
    {
      repoId: input.repoId || input.filterByTk,
    },
    'repoId',
  );
}

function getOptionalRepoId(input: ResourceActionInput): string | undefined {
  const value = input.repoId || input.filterByTk;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function requireString(input: ResourceActionInput, key: string, label = key): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${label} is required`);
  }

  return value.trim();
}

function optionalString(input: ResourceActionInput, key: string, label = key): string | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string`);
  }

  return value;
}

function optionalNullableString(input: ResourceActionInput, key: string, label = key): string | null | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw invalidInput(`${label} must be a string or null`);
  }

  return value;
}

function optionalNumber(input: ResourceActionInput, key: string, label = key): number | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalidInput(`${label} must be a number`);
  }

  return value;
}

function optionalPositiveInteger(input: ResourceActionInput, key: string, label = key): number | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 1) {
    throw invalidInput(`${label} must be a positive integer`);
  }

  return value as number;
}

function optionalBoolean(input: ResourceActionInput, key: string, label = key): boolean | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw invalidInput(`${label} must be a boolean`);
  }

  return value;
}

function optionalFileOperation(
  input: ResourceActionInput,
  key: string,
  label: string,
): LightExtensionFileChange['operation'] {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === 'upsert' || value === 'delete') {
    return value;
  }

  throw invalidInput(`${label}.${key} must be upsert or delete`);
}

function optionalIncludeContent(input: ResourceActionInput): LightExtensionPullInput['includeContent'] {
  const value = input.includeContent;
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (value === 'none' || value === 'selected' || value === 'all') {
    return value;
  }

  throw invalidInput('includeContent must be none, selected, or all');
}

function optionalStringArray(input: ResourceActionInput, key: string, label = key): string[] | undefined {
  const value = input[key];
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw invalidInput(`${label} must be an array of strings`);
  }

  return value;
}

function requireArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
): T[] {
  const value = input[key];
  if (!Array.isArray(value)) {
    throw invalidInput(`${key} must be an array`);
  }

  return value.map((item, index) => normalize(item, `${key}[${index}]`));
}

function requireRecord(value: unknown, label: string): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidInput(`${label} must be an object`);
  }

  return value as ResourceActionInput;
}

function toRecord(value: unknown): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ResourceActionInput;
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'undefined')) as T;
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}

function assertFileChangeSource(file: LightExtensionFileChange, label: string): void {
  if (file.operation === 'delete') {
    if (typeof file.content !== 'undefined' || typeof file.blobHash !== 'undefined') {
      throw invalidInput(`${label} delete operation must not include content or blobHash`);
    }

    return;
  }

  if (typeof file.content !== 'string' && !file.blobHash) {
    throw invalidInput(`${label} must include content or blobHash for upsert`);
  }
}
