/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type { LightExtensionErrorCode } from '../../shared/errors';
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
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { LightExtensionSyncRequestInputError, requestLightExtensionSync } from '../api/lightExtensionSyncRequests';
import { invalidateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { invalidateLightExtensionSettingsDescriptorCache } from '../resolvers/LightExtensionSettingsDescriptorCache';

type SyncActionInput<TAction extends LightExtensionSyncActionName> = LightExtensionSyncActionContract[TAction]['input'];

type SyncActionResult<TAction extends LightExtensionSyncActionName> =
  LightExtensionSyncActionContract[TAction]['result'];

type FlowContextWithApi = {
  api: ApiClientLike;
};

const errorTranslationKeys: Partial<Record<LightExtensionErrorCode, string>> = {
  LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE: 'The configured credential is unavailable',
  LIGHT_EXTENSION_SYNC_AUTH_FAILED: 'GitHub authentication failed',
  LIGHT_EXTENSION_SYNC_RATE_LIMITED: 'GitHub API rate limit reached. Try again later or configure a GitHub token.',
  LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE: 'The sync provider is unavailable',
  LIGHT_EXTENSION_SYNC_UNSUPPORTED_PROVIDER: 'The sync provider is unsupported',
  LIGHT_EXTENSION_SYNC_REMOTE_NOT_FOUND: 'The remote repository or path was not found',
  LIGHT_EXTENSION_SYNC_REMOTE_CHANGED: 'The remote source changed; refresh the plan and try again',
  LIGHT_EXTENSION_SYNC_DIVERGED: 'Local and remote changes have diverged',
  LIGHT_EXTENSION_SYNC_BUSY: 'Another sync operation is in progress',
  LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT: 'The remote source contains unsupported content',
  LIGHT_EXTENSION_SYNC_LOCAL_OUTDATED: 'The local source changed; refresh the plan and try again',
  LIGHT_EXTENSION_SYNC_CONFIG_INVALID: 'The sync configuration is invalid',
  LIGHT_EXTENSION_SYNC_AUTH_REF_INVALID: 'The credential reference is invalid',
  LIGHT_EXTENSION_PERMISSION_DENIED: 'You do not have permission to perform this sync operation',
};

export function getLightExtensionSyncErrorTranslationKey(code?: string | null): string | undefined {
  return code ? errorTranslationKeys[code as LightExtensionErrorCode] : undefined;
}

interface LightExtensionSyncHookErrorOptions {
  operation: LightExtensionSyncActionName;
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class LightExtensionSyncHookError extends Error {
  readonly operation: LightExtensionSyncActionName;

  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: LightExtensionSyncHookErrorOptions) {
    super(options.message);
    this.name = 'LightExtensionSyncHookError';
    this.operation = options.operation;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface UseLightExtensionSyncResult {
  get(input: LightExtensionSyncGetInput): Promise<LightExtensionSyncGetResult>;
  configure(input: LightExtensionSyncConfigureInput): Promise<LightExtensionSyncConfigureResult>;
  disconnect(input: LightExtensionSyncDisconnectInput): Promise<LightExtensionSyncDisconnectResult>;
  testConnection(input: LightExtensionSyncTestConnectionInput): Promise<LightExtensionSyncTestConnectionResult>;
  plan(input: LightExtensionSyncPlanInput): Promise<LightExtensionSyncPlanResult>;
  pull(input: LightExtensionSyncPullInput): Promise<LightExtensionSyncPullResult>;
  push(input: LightExtensionSyncPushInput): Promise<LightExtensionSyncPushResult>;
  createFromGit(input: LightExtensionSyncCreateFromGitInput): Promise<LightExtensionSyncCreateFromGitResult>;
}

export function useLightExtensionSync(): UseLightExtensionSyncResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);

  const requestOperation = useCallback(
    async <TAction extends LightExtensionSyncActionName>(
      operation: TAction,
      input: SyncActionInput<TAction>,
    ): Promise<SyncActionResult<TAction>> => {
      try {
        return await requestLightExtensionSync(ctx.api, operation, input);
      } catch (error) {
        throw normalizeLightExtensionSyncError(operation, error, t('Light extension request failed'));
      }
    },
    [ctx.api, t],
  );

  const get = useCallback((input: LightExtensionSyncGetInput) => requestOperation('get', input), [requestOperation]);
  const configure = useCallback(
    (input: LightExtensionSyncConfigureInput) => requestOperation('configure', input),
    [requestOperation],
  );
  const disconnect = useCallback(
    (input: LightExtensionSyncDisconnectInput) => requestOperation('disconnect', input),
    [requestOperation],
  );
  const testConnection = useCallback(
    (input: LightExtensionSyncTestConnectionInput) => requestOperation('testConnection', input),
    [requestOperation],
  );
  const plan = useCallback((input: LightExtensionSyncPlanInput) => requestOperation('plan', input), [requestOperation]);
  const pull = useCallback(
    async (input: LightExtensionSyncPullInput) => {
      const result = await requestOperation('pull', input);
      invalidateLightExtensionSettingsDescriptorCache(ctx.api, input.repoId);
      invalidateLightExtensionRuntimeCache(ctx.api, input.repoId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const push = useCallback((input: LightExtensionSyncPushInput) => requestOperation('push', input), [requestOperation]);
  const createFromGit = useCallback(
    (input: LightExtensionSyncCreateFromGitInput) => requestOperation('createFromGit', input),
    [requestOperation],
  );

  return useMemo(
    () => ({ get, configure, disconnect, testConnection, plan, pull, push, createFromGit }),
    [configure, createFromGit, disconnect, get, plan, pull, push, testConnection],
  );
}

function normalizeLightExtensionSyncError(
  operation: LightExtensionSyncActionName,
  error: unknown,
  fallbackMessage: string,
): LightExtensionSyncHookError {
  if (error instanceof LightExtensionSyncRequestInputError) {
    return new LightExtensionSyncHookError({
      operation,
      code: error.code,
      status: error.status,
      message: error.message,
    });
  }

  const response = getRecordProperty(error, 'response');
  const serverError = getFirstServerError(response?.data) || getFirstServerError(error);
  return new LightExtensionSyncHookError({
    operation,
    code: toNonEmptyString(serverError?.code),
    status: toNumber(serverError?.status) ?? toNumber(response?.status),
    message: toNonEmptyString(serverError?.message) || fallbackMessage,
    details: toRecord(serverError?.details) || undefined,
  });
}

function getFirstServerError(value: unknown): Record<string, unknown> | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }
  if (Array.isArray(record.errors)) {
    return record.errors.map(toRecord).find((item): item is Record<string, unknown> => Boolean(item)) || null;
  }
  return toRecord(record.error);
}

function getRecordProperty(value: unknown, key: string): Record<string, unknown> | null {
  return toRecord(toRecord(value)?.[key]);
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
