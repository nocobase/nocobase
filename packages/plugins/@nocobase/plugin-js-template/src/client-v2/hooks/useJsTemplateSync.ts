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
import type { JsTemplateErrorCode } from '../../shared/errors';
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
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { JsTemplateSyncRequestInputError, requestJsTemplateSync } from '../api/jsTemplateSyncRequests';
import { invalidateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { invalidateJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';

type SyncActionInput<TAction extends JsTemplateSyncActionName> = JsTemplateSyncActionContract[TAction]['input'];

type SyncActionResult<TAction extends JsTemplateSyncActionName> = JsTemplateSyncActionContract[TAction]['result'];

type FlowContextWithApi = {
  api: ApiClientLike;
};

const errorTranslationKeys: Partial<Record<JsTemplateErrorCode, string>> = {
  JS_TEMPLATE_SYNC_CREDENTIAL_UNAVAILABLE: 'The configured credential is unavailable',
  JS_TEMPLATE_SYNC_AUTH_FAILED: 'Git authentication failed',
  JS_TEMPLATE_SYNC_RATE_LIMITED: 'The Git remote is temporarily unavailable. Try again later.',
  JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE: 'The sync provider is unavailable',
  JS_TEMPLATE_SYNC_UNSUPPORTED_PROVIDER: 'The sync provider is unsupported',
  JS_TEMPLATE_SYNC_REMOTE_NOT_FOUND: 'The remote repository or path was not found',
  JS_TEMPLATE_SYNC_REMOTE_CHANGED: 'The remote source changed; refresh the plan and try again',
  JS_TEMPLATE_SYNC_DIVERGED: 'Local and remote changes have diverged',
  JS_TEMPLATE_SYNC_BUSY: 'Another sync operation is in progress',
  JS_TEMPLATE_SYNC_UNSAFE_CONTENT: 'The remote source contains unsupported content',
  JS_TEMPLATE_SYNC_LOCAL_OUTDATED: 'The local source changed; refresh the plan and try again',
  JS_TEMPLATE_SYNC_CONFIG_INVALID: 'The sync configuration is invalid',
  JS_TEMPLATE_SYNC_AUTH_REF_INVALID: 'The credential reference is invalid',
  JS_TEMPLATE_PERMISSION_DENIED: 'You do not have permission to perform this sync operation',
};

export function getJsTemplateSyncErrorTranslationKey(
  code?: string | null,
  reasonCode?: string | null,
): string | undefined {
  if (code === 'JS_TEMPLATE_SYNC_CONFIG_INVALID' && reasonCode === 'default-branch-unavailable') {
    return 'The remote repository has no default branch. Enter a branch explicitly.';
  }
  return code ? errorTranslationKeys[code as JsTemplateErrorCode] : undefined;
}

interface JsTemplateSyncHookErrorOptions {
  operation: JsTemplateSyncActionName;
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class JsTemplateSyncHookError extends Error {
  readonly operation: JsTemplateSyncActionName;

  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: JsTemplateSyncHookErrorOptions) {
    super(options.message);
    this.name = 'JsTemplateSyncHookError';
    this.operation = options.operation;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface UseJsTemplateSyncResult {
  get(input: JsTemplateSyncGetInput): Promise<JsTemplateSyncGetResult>;
  configure(input: JsTemplateSyncConfigureInput): Promise<JsTemplateSyncConfigureResult>;
  disconnect(input: JsTemplateSyncDisconnectInput): Promise<JsTemplateSyncDisconnectResult>;
  testConnection(input: JsTemplateSyncTestConnectionInput): Promise<JsTemplateSyncTestConnectionResult>;
  plan(input: JsTemplateSyncPlanInput): Promise<JsTemplateSyncPlanResult>;
  pull(input: JsTemplateSyncPullInput): Promise<JsTemplateSyncPullResult>;
  push(input: JsTemplateSyncPushInput): Promise<JsTemplateSyncPushResult>;
  createFromGit(input: JsTemplateSyncCreateFromGitInput): Promise<JsTemplateSyncCreateFromGitResult>;
}

export function useJsTemplateSync(): UseJsTemplateSyncResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);

  const requestOperation = useCallback(
    async <TAction extends JsTemplateSyncActionName>(
      operation: TAction,
      input: SyncActionInput<TAction>,
    ): Promise<SyncActionResult<TAction>> => {
      try {
        return await requestJsTemplateSync(ctx.api, operation, input);
      } catch (error) {
        throw normalizeJsTemplateSyncError(operation, error, t('JS Template request failed'));
      }
    },
    [ctx.api, t],
  );

  const get = useCallback((input: JsTemplateSyncGetInput) => requestOperation('get', input), [requestOperation]);
  const configure = useCallback(
    (input: JsTemplateSyncConfigureInput) => requestOperation('configure', input),
    [requestOperation],
  );
  const disconnect = useCallback(
    (input: JsTemplateSyncDisconnectInput) => requestOperation('disconnect', input),
    [requestOperation],
  );
  const testConnection = useCallback(
    (input: JsTemplateSyncTestConnectionInput) => requestOperation('testConnection', input),
    [requestOperation],
  );
  const plan = useCallback((input: JsTemplateSyncPlanInput) => requestOperation('plan', input), [requestOperation]);
  const pull = useCallback(
    async (input: JsTemplateSyncPullInput) => {
      const result = await requestOperation('pull', input);
      invalidateJsTemplateSettingsDescriptorCache(ctx.api, input.projectId);
      invalidateJsTemplateRuntimeCache(ctx.api, input.projectId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const push = useCallback((input: JsTemplateSyncPushInput) => requestOperation('push', input), [requestOperation]);
  const createFromGit = useCallback(
    (input: JsTemplateSyncCreateFromGitInput) => requestOperation('createFromGit', input),
    [requestOperation],
  );

  return useMemo(
    () => ({ get, configure, disconnect, testConnection, plan, pull, push, createFromGit }),
    [configure, createFromGit, disconnect, get, plan, pull, push, testConnection],
  );
}

function normalizeJsTemplateSyncError(
  operation: JsTemplateSyncActionName,
  error: unknown,
  fallbackMessage: string,
): JsTemplateSyncHookError {
  if (error instanceof JsTemplateSyncRequestInputError) {
    return new JsTemplateSyncHookError({
      operation,
      code: error.code,
      status: error.status,
      message: error.message,
    });
  }

  const response = getRecordProperty(error, 'response');
  const serverError = getFirstServerError(response?.data) || getFirstServerError(error);
  return new JsTemplateSyncHookError({
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
