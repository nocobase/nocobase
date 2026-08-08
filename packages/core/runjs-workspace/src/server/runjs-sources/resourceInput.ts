/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';

import { VscError } from '../../shared/errors';
import { validateRunJSWorkspacePathValue } from '../../shared/runjs-workspace-path';
import {
  normalizeRunJSSourceLocator,
  type RunJSSourceAdapterContext,
  type RunJSSourceCompilePreviewInput,
  type RunJSSourceDiffInput,
  type RunJSSourceExportZipInput,
  type RunJSSourceFileChange,
  type RunJSSourceGetVersionInput,
  type RunJSSourceHistoryInput,
  type RunJSSourceImportZipInput,
  type RunJSSourceInitialSource,
  type RunJSSourcePermissionCheck,
  type RunJSSourcePermissionResult,
  type RunJSSourceSaveChangesInput,
  type RunJSSourceSaveInput,
} from '../../shared/runjs-source-types';
import type { VscFileChange } from '../../shared/types';
import type { VscPermissionRequestMetadata } from '../permissions';

export type ResourceActionInput = Record<string, unknown>;

export type RunJSSourceResourceContext = Context & {
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
  dataSource?: {
    name?: unknown;
  };
  state?: Record<string, unknown>;
  can?: (options: RunJSSourcePermissionCheck) => unknown;
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
  set?: (name: string, value: string) => void;
};

type RunJSSourceRepoInput = Pick<RunJSSourceHistoryInput, 'locator' | 'repoId'>;

export function normalizeInitialRunJSSource(value: unknown): RunJSSourceInitialSource | undefined {
  if (value === undefined) {
    return undefined;
  }

  const source = toRecord(value);
  if (typeof source.version !== 'string' || !source.version) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', 'RunJS initial source is invalid');
  }
  // Missing code is treated as empty inline source (e.g. js-template → inline with no stored code).
  if (source.code !== undefined && source.code !== null && typeof source.code !== 'string') {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', 'RunJS initial source is invalid');
  }

  return {
    code: typeof source.code === 'string' ? source.code : '',
    version: source.version,
  };
}

function normalizeRepoInput(input: ResourceActionInput): RunJSSourceRepoInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: requireString(input, 'repoId'),
  };
}

export function normalizeCompilePreviewInput(input: ResourceActionInput): RunJSSourceCompilePreviewInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
    baseCommitId: optionalNullableString(input, 'baseCommitId'),
    files: requireArray(input, 'files', normalizeRunJSPreviewFileChange),
    entryPath: optionalRunJSWorkspacePath(input, 'entry') || optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

export function normalizeExportZipInput(input: ResourceActionInput): RunJSSourceExportZipInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
    commitId: optionalString(input, 'commitId'),
  };
}

export function normalizeImportZipInput(input: ResourceActionInput): RunJSSourceImportZipInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    zipBase64: requireString(input, 'zipBase64'),
  };
}

export function normalizeHistoryInput(input: ResourceActionInput): RunJSSourceHistoryInput {
  return {
    ...normalizeRepoInput(input),
    limit: optionalNumber(input, 'limit'),
    beforeSeq: optionalNumber(input, 'beforeSeq'),
  };
}

export function normalizeDiffInput(input: ResourceActionInput): RunJSSourceDiffInput {
  return {
    ...normalizeRepoInput(input),
    fromCommitId: requireString(input, 'fromCommitId'),
    toCommitId: requireString(input, 'toCommitId'),
  };
}

export function normalizeGetVersionInput(input: ResourceActionInput): RunJSSourceGetVersionInput {
  return {
    ...normalizeRepoInput(input),
    commitId: requireString(input, 'commitId'),
    includeFiles: optionalBoolean(input, 'includeFiles') ?? false,
  };
}

export function normalizeSaveInput(input: ResourceActionInput): RunJSSourceSaveInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    baseOwnerFingerprint: requireString(input, 'baseOwnerFingerprint'),
    message: requireCommitMessage(input.message),
    files: requireArray(input, 'files', normalizeRunJSFileChange),
    entryPath: optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

export function normalizeSaveChangesInput(input: ResourceActionInput): RunJSSourceSaveChangesInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: requireString(input, 'repoId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    baseOwnerFingerprint: requireString(input, 'baseOwnerFingerprint'),
    message: requireCommitMessage(input.message),
    changes: requireArray(input, 'changes', normalizeRunJSIncrementalFileChange),
    entryPath: optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

export function createAdapterContext(
  ctx: RunJSSourceResourceContext,
  transaction?: unknown,
): RunJSSourceAdapterContext {
  return {
    userId: getCurrentUserId(ctx),
    request: getRequestMetadata(ctx),
    state: getCurrentState(ctx),
    currentUser: getCurrentUser(ctx),
    timezone: getRequestTimezone(ctx),
    transaction,
    can: (input) => normalizePermissionResult(ctx.can?.(input)),
  };
}

export function getActionInput(ctx: RunJSSourceResourceContext): ResourceActionInput {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;

  return {
    ...queryParams,
    ...values,
  };
}

function getCurrentUserId(ctx: RunJSSourceResourceContext): string | null {
  const user = getCurrentUser(ctx);
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

function getCurrentUser(ctx: RunJSSourceResourceContext): unknown {
  const state = toRecord(ctx.state);
  return state.currentUser || ctx.auth?.user;
}

function getCurrentState(ctx: RunJSSourceResourceContext): Record<string, unknown> {
  return toRecord(ctx.state);
}

function getRequestMetadata(ctx: RunJSSourceResourceContext): Record<string, unknown> & VscPermissionRequestMetadata {
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
  }) as Record<string, unknown> & VscPermissionRequestMetadata;
}

function getRequestTimezone(ctx: RunJSSourceResourceContext): string | undefined {
  const headers = ctx.request?.headers || ctx.request?.header || {};
  return getHeader(headers, 'x-timezone');
}

function normalizePermissionResult(value: unknown): RunJSSourcePermissionResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const input = value as { params?: unknown };
  if (!input.params || typeof input.params !== 'object' || Array.isArray(input.params)) {
    return {};
  }

  return {
    params: input.params as RunJSSourcePermissionResult['params'],
  };
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toRecord(value: unknown): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ResourceActionInput;
}

function requireString(input: ResourceActionInput, key: string): string {
  const value = input[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" is invalid`);
}

function optionalString(input: ResourceActionInput, key: string): string | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" is invalid`);
}

function optionalRunJSWorkspacePath(input: ResourceActionInput, key: string): string | undefined {
  const value = optionalString(input, key);
  if (value === undefined) {
    return undefined;
  }

  return normalizeAllowedRunJSWorkspacePath(value, key);
}

function optionalNullableString(input: ResourceActionInput, key: string): string | null | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a string or null`);
}

function requireNullableString(input: ResourceActionInput, key: string): string | null {
  if (input[key] === null) {
    return null;
  }

  return requireString(input, key);
}

function requireCommitMessage(value: unknown): string {
  if (typeof value !== 'string') {
    throw new VscError('RUNJS_COMMIT_MESSAGE_INVALID', 'RunJS save commit message is required');
  }
  const message = value.trim();
  if (message.length < 3 || message.length > 200) {
    throw new VscError('RUNJS_COMMIT_MESSAGE_INVALID', 'RunJS save commit message must be 3-200 characters');
  }

  return message;
}

function requireArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
  options: { allowEmpty?: boolean } = {},
): T[] {
  const value = input[key];
  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0)) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a non-empty array`);
  }

  return value.map((item, index) => normalize(item, `${key}[${index}]`));
}

function normalizeFileChange(value: unknown, label: string): VscFileChange {
  const input = requireRecord(value, label);

  return compactObject({
    path: requireString(input, 'path'),
    operation: optionalFileOperation(input, 'operation', label),
    content: optionalString(input, 'content'),
    blobHash: optionalString(input, 'blobHash'),
    size: optionalNumber(input, 'size'),
    language: optionalString(input, 'language'),
    mode: optionalString(input, 'mode'),
  }) as unknown as VscFileChange;
}

function normalizeRunJSFileChange(value: unknown, label: string): VscFileChange {
  return normalizeRunJSFilePath(normalizeFileChange(value, label), `${label}.path`);
}

function normalizeRunJSIncrementalFileChange(value: unknown, label: string): RunJSSourceFileChange {
  const input = requireRecord(value, label);
  const operation = requireFileOperation(input, 'operation', label);
  const content = input.content;
  if (operation === 'upsert' && typeof content !== 'string') {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}.content" must be a string`);
  }

  return normalizeRunJSFilePath(
    compactObject({
      path: requireString(input, 'path'),
      operation,
      expectedBlobHash: requireNullableString(input, 'expectedBlobHash'),
      content: operation === 'upsert' ? content : undefined,
      language: optionalString(input, 'language'),
      mode: optionalString(input, 'mode'),
    }) as unknown as RunJSSourceFileChange,
    `${label}.path`,
  );
}

function normalizePreviewFileChange(value: unknown, label: string): VscFileChange {
  const file = normalizeFileChange(value, label);

  return {
    ...file,
    operation: file.operation || 'upsert',
  };
}

function normalizeRunJSPreviewFileChange(value: unknown, label: string): VscFileChange {
  return normalizeRunJSFilePath(normalizePreviewFileChange(value, label), `${label}.path`);
}

function normalizeRunJSFilePath<TFile extends { path: string }>(file: TFile, label: string): TFile {
  return {
    ...file,
    path: normalizeAllowedRunJSWorkspacePath(file.path, label),
  };
}

export function normalizeAllowedRunJSWorkspacePath(path: string, label: string): string {
  const validation = validateRunJSWorkspacePathValue(path);
  if (validation.valid && validation.path) {
    return validation.path;
  }

  throw new VscError('PATH_INVALID', validation.message || `RunJS source field "${label}" is invalid`, {
    details: {
      field: label,
      path: validation.path || path,
      reason: validation.reason || 'invalid',
    },
  });
}

function optionalFileOperation(
  input: ResourceActionInput,
  key: string,
  label: string,
): VscFileChange['operation'] | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === 'upsert' || value === 'delete') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}.${key}" is invalid`);
}

function requireFileOperation(
  input: ResourceActionInput,
  key: string,
  label: string,
): RunJSSourceFileChange['operation'] {
  const operation = optionalFileOperation(input, key, label);
  if (operation) {
    return operation;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}.${key}" is required`);
}

function requireRecord(value: unknown, label: string): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}" must be an object`);
  }

  return value as ResourceActionInput;
}

function optionalNumber(input: ResourceActionInput, key: string): number | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a number`);
}

function optionalBoolean(input: ResourceActionInput, key: string): boolean | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a boolean`);
}

export function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

export function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return undefined;
}
