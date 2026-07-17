/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LightExtensionSyncActionContract,
  LightExtensionSyncActionName,
  LightExtensionSyncConfigureInput,
  LightExtensionSyncConfigureResult,
  LightExtensionSyncCreateFromGitInput,
  LightExtensionSyncCreateFromGitResult,
  LightExtensionSyncDisconnectInput,
  LightExtensionSyncDisconnectResult,
  LightExtensionSyncGetInput,
  LightExtensionSyncGetResult,
  LightExtensionSyncPlanInput,
  LightExtensionSyncPlanResult,
  LightExtensionSyncPullInput,
  LightExtensionSyncPullResult,
  LightExtensionSyncPushInput,
  LightExtensionSyncPushResult,
  LightExtensionSyncTestConnectionInput,
  LightExtensionSyncTestConnectionResult,
} from '../../shared/types';
import type { ApiClientLike } from './lightExtensionEntriesRequests';
import { unwrapResourceResponse } from './lightExtensionEntriesRequests';

type SyncActionInput<TAction extends LightExtensionSyncActionName> = LightExtensionSyncActionContract[TAction]['input'];

type SyncActionResult<TAction extends LightExtensionSyncActionName> =
  LightExtensionSyncActionContract[TAction]['result'];

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

const syncActionUrls: Record<LightExtensionSyncActionName, string> = {
  get: 'lightExtensionSync:get',
  configure: 'lightExtensionSync:configure',
  disconnect: 'lightExtensionSync:disconnect',
  testConnection: 'lightExtensionSync:testConnection',
  plan: 'lightExtensionSync:plan',
  pull: 'lightExtensionSync:pull',
  push: 'lightExtensionSync:push',
  createFromGit: 'lightExtensionSync:createFromGit',
};

const authRefActions = new Set<LightExtensionSyncActionName>(['configure', 'testConnection', 'createFromGit']);
const sensitiveCredentialKeyPattern = /(token|authorization|password|secret|credential|privatekey)/i;
const authRefPattern = /^\{\{ \$env\.[A-Za-z_][A-Za-z0-9_]* \}\}$/;
const MAX_LITERAL_CREDENTIAL_LENGTH = 255;
const actionFields: Record<LightExtensionSyncActionName, ReadonlySet<string>> = {
  get: new Set(['repoId']),
  configure: new Set(['repoId', 'provider', 'config', 'authRef']),
  disconnect: new Set(['repoId']),
  testConnection: new Set(['repoId', 'provider', 'config', 'authRef']),
  plan: new Set(['repoId']),
  pull: new Set([
    'repoId',
    'expectedHeadCommitId',
    'expectedRemoteRevision',
    'expectedRemoteTargetVersion',
    'planFingerprint',
  ]),
  push: new Set([
    'repoId',
    'expectedHeadCommitId',
    'expectedRemoteRevision',
    'expectedRemoteTargetVersion',
    'planFingerprint',
  ]),
  createFromGit: new Set(['provider', 'config', 'name', 'title', 'description', 'authRef']),
};
const configFields = new Set(['owner', 'repository', 'branch', 'subdirectory']);

export class LightExtensionSyncRequestInputError extends Error {
  readonly code = 'LIGHT_EXTENSION_SYNC_INVALID_CLIENT_INPUT';

  readonly status = 422;

  constructor() {
    super('Light extension sync request input is invalid');
    this.name = 'LightExtensionSyncRequestInputError';
  }
}

export async function requestLightExtensionSync<TAction extends LightExtensionSyncActionName>(
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

export function getLightExtensionSync(api: ApiClientLike, input: LightExtensionSyncGetInput) {
  return requestLightExtensionSync(api, 'get', input) as Promise<LightExtensionSyncGetResult>;
}

export function configureLightExtensionSync(api: ApiClientLike, input: LightExtensionSyncConfigureInput) {
  return requestLightExtensionSync(api, 'configure', input) as Promise<LightExtensionSyncConfigureResult>;
}

export function disconnectLightExtensionSync(api: ApiClientLike, input: LightExtensionSyncDisconnectInput) {
  return requestLightExtensionSync(api, 'disconnect', input) as Promise<LightExtensionSyncDisconnectResult>;
}

export function testLightExtensionSyncConnection(api: ApiClientLike, input: LightExtensionSyncTestConnectionInput) {
  return requestLightExtensionSync(api, 'testConnection', input) as Promise<LightExtensionSyncTestConnectionResult>;
}

export function planLightExtensionSync(api: ApiClientLike, input: LightExtensionSyncPlanInput) {
  return requestLightExtensionSync(api, 'plan', input) as Promise<LightExtensionSyncPlanResult>;
}

export function pullLightExtensionSync(api: ApiClientLike, input: LightExtensionSyncPullInput) {
  return requestLightExtensionSync(api, 'pull', input) as Promise<LightExtensionSyncPullResult>;
}

export function pushLightExtensionSync(api: ApiClientLike, input: LightExtensionSyncPushInput) {
  return requestLightExtensionSync(api, 'push', input) as Promise<LightExtensionSyncPushResult>;
}

export function createLightExtensionFromGit(api: ApiClientLike, input: LightExtensionSyncCreateFromGitInput) {
  return requestLightExtensionSync(api, 'createFromGit', input) as Promise<LightExtensionSyncCreateFromGitResult>;
}

function validateSyncInput(action: LightExtensionSyncActionName, input: unknown): void {
  const record = requireRecord(input);
  rejectCredentialFields(record);
  assertOnlyFields(record, actionFields[action]);

  switch (action) {
    case 'get':
    case 'disconnect':
    case 'plan':
      requireNonEmptyString(record.repoId);
      return;
    case 'configure':
      requireNonEmptyString(record.repoId);
      validateProvider(record.provider);
      validateConfig(record.config);
      validateAuthRef(action, record);
      return;
    case 'testConnection':
      requireNonEmptyString(record.repoId);
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
      requireNonEmptyString(record.repoId);
      requireNullableString(record.expectedHeadCommitId);
      requireNullableString(record.expectedRemoteRevision);
      requirePositiveInteger(record.expectedRemoteTargetVersion);
      requireNonEmptyString(record.planFingerprint);
      return;
    case 'createFromGit':
      validateProvider(record.provider);
      validateConfig(record.config);
      requireNonEmptyString(record.name);
      requireOptionalNullableString(record, 'title');
      requireOptionalNullableString(record, 'description');
      validateAuthRef(action, record);
      return;
  }
}

function rejectCredentialFields(input: Record<string, unknown>): void {
  const seen = new WeakSet<object>();

  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (seen.has(value)) {
      throw new LightExtensionSyncRequestInputError();
    }
    seen.add(value);

    for (const [key, child] of Object.entries(value)) {
      const normalizedKey = key.replace(/[^A-Za-z0-9]/g, '');
      if (key !== 'authRef' && sensitiveCredentialKeyPattern.test(normalizedKey)) {
        throw new LightExtensionSyncRequestInputError();
      }
      visit(child);
    }
  };

  visit(input);
}

function validateAuthRef(action: LightExtensionSyncActionName, record: Record<string, unknown>): void {
  if (!('authRef' in record)) {
    return;
  }
  if (!authRefActions.has(action) || typeof record.authRef !== 'string') {
    throw new LightExtensionSyncRequestInputError();
  }
  if (authRefPattern.test(record.authRef)) {
    return;
  }
  if (
    !record.authRef ||
    record.authRef.trim() !== record.authRef ||
    record.authRef.length > MAX_LITERAL_CREDENTIAL_LENGTH ||
    hasControlCharacter(record.authRef) ||
    record.authRef.includes('{{') ||
    record.authRef.includes('}}')
  ) {
    throw new LightExtensionSyncRequestInputError();
  }
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function validateProvider(value: unknown): void {
  if (value !== 'github') {
    throw new LightExtensionSyncRequestInputError();
  }
}

function validateConfig(value: unknown): void {
  const config = requireRecord(value);
  assertOnlyFields(config, configFields);
  requireTrimmedString(config.owner, false);
  requireTrimmedString(config.repository, false);
  requireTrimmedString(config.branch, true);
  if (config.subdirectory !== null) {
    requireTrimmedString(config.subdirectory, true);
  }
}

function assertOnlyFields(record: Record<string, unknown>, allowed: ReadonlySet<string>): void {
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new LightExtensionSyncRequestInputError();
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LightExtensionSyncRequestInputError();
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown): void {
  requireTrimmedString(value, false);
}

function requireTrimmedString(value: unknown, allowEmpty: boolean): void {
  if (typeof value !== 'string' || value.trim() !== value || (!allowEmpty && !value)) {
    throw new LightExtensionSyncRequestInputError();
  }
}

function requireNullableString(value: unknown): void {
  if (value !== null && typeof value !== 'string') {
    throw new LightExtensionSyncRequestInputError();
  }
}

function requireOptionalNullableString(record: Record<string, unknown>, key: string): void {
  if (key in record) {
    requireNullableString(record[key]);
  }
}

function requirePositiveInteger(value: unknown): void {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new LightExtensionSyncRequestInputError();
  }
}
