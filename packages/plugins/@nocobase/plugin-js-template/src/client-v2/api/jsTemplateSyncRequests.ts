/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  JsTemplateSyncActionContract,
  JsTemplateSyncActionName,
  JsTemplateSyncConfigureInput,
  JsTemplateSyncConfigureResult,
  JsTemplateSyncCreateFromGitInput,
  JsTemplateSyncCreateFromGitResult,
  JsTemplateSyncDisconnectInput,
  JsTemplateSyncDisconnectResult,
  JsTemplateSyncGetInput,
  JsTemplateSyncGetResult,
  JsTemplateSyncPlanInput,
  JsTemplateSyncPlanResult,
  JsTemplateSyncPullInput,
  JsTemplateSyncPullResult,
  JsTemplateSyncPushInput,
  JsTemplateSyncPushResult,
  JsTemplateSyncTestConnectionInput,
  JsTemplateSyncTestConnectionResult,
} from '../../shared/types';
import type { ApiClientLike } from './jsTemplatesRequests';
import { unwrapResourceResponse } from './jsTemplatesRequests';

type SyncActionInput<TAction extends JsTemplateSyncActionName> = JsTemplateSyncActionContract[TAction]['input'];

type SyncActionResult<TAction extends JsTemplateSyncActionName> = JsTemplateSyncActionContract[TAction]['result'];

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

const syncActionUrls: Record<JsTemplateSyncActionName, string> = {
  get: 'jsTemplateSync:get',
  configure: 'jsTemplateSync:configure',
  disconnect: 'jsTemplateSync:disconnect',
  testConnection: 'jsTemplateSync:testConnection',
  plan: 'jsTemplateSync:plan',
  pull: 'jsTemplateSync:pull',
  push: 'jsTemplateSync:push',
  createFromGit: 'jsTemplateSync:createFromGit',
};

const authRefActions = new Set<JsTemplateSyncActionName>(['configure', 'testConnection', 'createFromGit']);
const sensitiveCredentialKeyPattern = /(token|authorization|password|secret|credential|privatekey)/i;
const authRefPattern = /^\{\{ \$env\.[A-Za-z_][A-Za-z0-9_]* \}\}$/;
const actionFields: Record<JsTemplateSyncActionName, ReadonlySet<string>> = {
  get: new Set(['projectId']),
  configure: new Set(['projectId', 'provider', 'config', 'authRef']),
  disconnect: new Set(['projectId']),
  testConnection: new Set(['projectId', 'provider', 'config', 'authRef']),
  plan: new Set(['projectId']),
  pull: new Set([
    'projectId',
    'expectedHeadCommitId',
    'expectedRemoteRevision',
    'expectedRemoteTargetVersion',
    'planFingerprint',
  ]),
  push: new Set([
    'projectId',
    'expectedHeadCommitId',
    'expectedRemoteRevision',
    'expectedRemoteTargetVersion',
    'planFingerprint',
  ]),
  createFromGit: new Set(['idempotencyKey', 'provider', 'config', 'name', 'title', 'description', 'authRef']),
};
const configFields = new Set(['url', 'branch', 'subdirectory', 'transport']);

export class JsTemplateSyncRequestInputError extends Error {
  readonly code = 'JS_TEMPLATE_SYNC_INVALID_CLIENT_INPUT';

  readonly status = 422;

  constructor() {
    super('JS Template sync request input is invalid');
    this.name = 'JsTemplateSyncRequestInputError';
  }
}

export async function requestJsTemplateSync<TAction extends JsTemplateSyncActionName>(
  api: ApiClientLike,
  action: TAction,
  input: SyncActionInput<TAction>,
): Promise<SyncActionResult<TAction>> {
  validateSyncInput(action, input);
  const response = await api.request<ResourceResponse<SyncActionResult<TAction>>>({
    url: syncActionUrls[action],
    method: 'post',
    data: input,
    skipNotify: true,
  });
  return unwrapResourceResponse(response);
}

export function getJsTemplateSync(api: ApiClientLike, input: JsTemplateSyncGetInput) {
  return requestJsTemplateSync(api, 'get', input) as Promise<JsTemplateSyncGetResult>;
}

export function configureJsTemplateSync(api: ApiClientLike, input: JsTemplateSyncConfigureInput) {
  return requestJsTemplateSync(api, 'configure', input) as Promise<JsTemplateSyncConfigureResult>;
}

export function disconnectJsTemplateSync(api: ApiClientLike, input: JsTemplateSyncDisconnectInput) {
  return requestJsTemplateSync(api, 'disconnect', input) as Promise<JsTemplateSyncDisconnectResult>;
}

export function testJsTemplateSyncConnection(api: ApiClientLike, input: JsTemplateSyncTestConnectionInput) {
  return requestJsTemplateSync(api, 'testConnection', input) as Promise<JsTemplateSyncTestConnectionResult>;
}

export function planJsTemplateSync(api: ApiClientLike, input: JsTemplateSyncPlanInput) {
  return requestJsTemplateSync(api, 'plan', input) as Promise<JsTemplateSyncPlanResult>;
}

export function pullJsTemplateSync(api: ApiClientLike, input: JsTemplateSyncPullInput) {
  return requestJsTemplateSync(api, 'pull', input) as Promise<JsTemplateSyncPullResult>;
}

export function pushJsTemplateSync(api: ApiClientLike, input: JsTemplateSyncPushInput) {
  return requestJsTemplateSync(api, 'push', input) as Promise<JsTemplateSyncPushResult>;
}

export function createJsTemplateFromGit(api: ApiClientLike, input: JsTemplateSyncCreateFromGitInput) {
  return requestJsTemplateSync(api, 'createFromGit', input) as Promise<JsTemplateSyncCreateFromGitResult>;
}

function validateSyncInput(action: JsTemplateSyncActionName, input: unknown): void {
  const record = requireRecord(input);
  rejectCredentialFields(record);
  assertOnlyFields(record, actionFields[action]);

  switch (action) {
    case 'get':
    case 'disconnect':
    case 'plan':
      requireNonEmptyString(record.projectId);
      return;
    case 'configure':
      requireNonEmptyString(record.projectId);
      validateProvider(record.provider);
      validateConfig(record.config);
      validateAuthRef(action, record);
      return;
    case 'testConnection':
      requireNonEmptyString(record.projectId);
      if ('provider' in record) {
        validateProvider(record.provider);
      }
      if ('config' in record) {
        validateConfig(record.config);
      }
      validateAuthRef(action, record);
      return;
    case 'pull':
    case 'push':
      requireNonEmptyString(record.projectId);
      requireNullableString(record.expectedHeadCommitId);
      requireNullableString(record.expectedRemoteRevision);
      requirePositiveInteger(record.expectedRemoteTargetVersion);
      requireNonEmptyString(record.planFingerprint);
      return;
    case 'createFromGit':
      requireBoundedIdempotencyKey(record.idempotencyKey);
      validateProvider(record.provider);
      validateConfig(record.config);
      requireNonEmptyString(record.name);
      requireOptionalNullableString(record, 'title');
      requireOptionalNullableString(record, 'description');
      validateAuthRef(action, record);
      return;
  }
}

function requireBoundedIdempotencyKey(value: unknown): void {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > 255) {
    throw new JsTemplateSyncRequestInputError();
  }
}

function rejectCredentialFields(input: Record<string, unknown>): void {
  const seen = new WeakSet<object>();

  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (seen.has(value)) {
      throw new JsTemplateSyncRequestInputError();
    }
    seen.add(value);

    for (const [key, child] of Object.entries(value)) {
      const normalizedKey = key.replace(/[^A-Za-z0-9]/g, '');
      if (key !== 'authRef' && sensitiveCredentialKeyPattern.test(normalizedKey)) {
        throw new JsTemplateSyncRequestInputError();
      }
      visit(child);
    }
  };

  visit(input);
}

function validateAuthRef(action: JsTemplateSyncActionName, record: Record<string, unknown>): void {
  if (!('authRef' in record)) {
    return;
  }
  if (!authRefActions.has(action)) {
    throw new JsTemplateSyncRequestInputError();
  }
  if (record.authRef !== null) {
    if (typeof record.authRef !== 'string' || !isCredentialInput(record.authRef)) {
      throw new JsTemplateSyncRequestInputError();
    }
  }
}

function isCredentialInput(value: string): boolean {
  return authRefPattern.test(value);
}

function validateProvider(value: unknown): void {
  if (value !== 'git') {
    throw new JsTemplateSyncRequestInputError();
  }
}

function validateConfig(value: unknown): void {
  const config = requireRecord(value);
  assertOnlyFields(config, configFields);
  requireTrimmedString(config.url, false);
  if (config.branch !== undefined && config.branch !== null) {
    requireTrimmedString(config.branch, false);
  }
  if (config.subdirectory !== undefined && config.subdirectory !== null) {
    requireTrimmedString(config.subdirectory, true);
  }
  if (config.transport !== undefined && config.transport !== 'http' && config.transport !== 'https') {
    throw new JsTemplateSyncRequestInputError();
  }
}

function assertOnlyFields(record: Record<string, unknown>, allowed: ReadonlySet<string>): void {
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new JsTemplateSyncRequestInputError();
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new JsTemplateSyncRequestInputError();
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown): void {
  requireTrimmedString(value, false);
}

function requireTrimmedString(value: unknown, allowEmpty: boolean): void {
  if (typeof value !== 'string' || value.trim() !== value || (!allowEmpty && !value)) {
    throw new JsTemplateSyncRequestInputError();
  }
}

function requireNullableString(value: unknown): void {
  if (value !== null && typeof value !== 'string') {
    throw new JsTemplateSyncRequestInputError();
  }
}

function requireOptionalNullableString(record: Record<string, unknown>, key: string): void {
  if (key in record) {
    requireNullableString(record[key]);
  }
}

function requirePositiveInteger(value: unknown): void {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new JsTemplateSyncRequestInputError();
  }
}
