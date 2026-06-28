/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { VscErrorCode, VscErrorDetails } from '../../shared/errors';
import { useT } from '../locale';
import type { RunJSSourceActionInput, RunJSSourceActionName, RunJSSourceActionResult } from './types';

export const runJSSourceActionNames = [
  'open',
  'saveDraft',
  'rebaseDraft',
  'discardDraft',
  'diffDraft',
  'compilePreview',
  'publish',
  'listHistory',
  'getVersion',
  'diffVersion',
  'restoreAsDraft',
] as const;

export type RunJSSourceLoadingState = Partial<Record<RunJSSourceActionName, boolean>>;

export type RunJSSourceErrorState = Partial<Record<RunJSSourceActionName, RunJSSourceRequestError>>;

export interface RunJSSourceRequestErrorOptions {
  action: RunJSSourceActionName;
  code?: VscErrorCode;
  status?: number;
  message: string;
  rawMessage?: string;
  details?: VscErrorDetails;
}

export class RunJSSourceRequestError extends Error {
  readonly action: RunJSSourceActionName;

  readonly code?: VscErrorCode;

  readonly status?: number;

  readonly rawMessage?: string;

  readonly details?: VscErrorDetails;

  constructor(options: RunJSSourceRequestErrorOptions) {
    super(options.message);
    this.name = 'RunJSSourceRequestError';
    this.action = options.action;
    this.code = options.code;
    this.status = options.status;
    this.rawMessage = options.rawMessage;
    this.details = options.details;
  }
}

export interface UseRunJSSourceResourceResult {
  loading: RunJSSourceLoadingState;
  errors: RunJSSourceErrorState;
  request<TAction extends RunJSSourceActionName>(
    action: TAction,
    input: RunJSSourceActionInput<TAction>,
  ): Promise<RunJSSourceActionResult<TAction>>;
  isLoading(action: RunJSSourceActionName): boolean;
  getError(action: RunJSSourceActionName): RunJSSourceRequestError | null;
  clearError(action?: RunJSSourceActionName): void;
}

type TFunction = (key: string) => string;

interface ResourceResponse<T> {
  data: T;
}

export function useRunJSSourceResource(): UseRunJSSourceResourceResult {
  const ctx = useFlowContext();
  const t = useT();
  const api = ctx?.api;
  const tRef = useRef(t);
  const requestIdsRef = useRef<Partial<Record<RunJSSourceActionName, number>>>({});
  const [loadingCounts, setLoadingCounts] = useState<Partial<Record<RunJSSourceActionName, number>>>({});
  const [errors, setErrors] = useState<RunJSSourceErrorState>({});

  const loading = useMemo<RunJSSourceLoadingState>(() => {
    return Object.fromEntries(
      runJSSourceActionNames.map((action) => [action, Boolean(loadingCounts[action])]),
    ) as RunJSSourceLoadingState;
  }, [loadingCounts]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const clearError = useCallback((action?: RunJSSourceActionName) => {
    setErrors((current) => {
      if (!action) {
        return {};
      }

      const next = { ...current };
      delete next[action];
      return next;
    });
  }, []);

  const request = useCallback(
    async <TAction extends RunJSSourceActionName>(
      action: TAction,
      input: RunJSSourceActionInput<TAction>,
    ): Promise<RunJSSourceActionResult<TAction>> => {
      const requestId = (requestIdsRef.current[action] || 0) + 1;
      requestIdsRef.current[action] = requestId;

      setLoadingCounts((current) => ({
        ...current,
        [action]: (current[action] || 0) + 1,
      }));
      clearError(action);

      try {
        if (!api) {
          throw new RunJSSourceRequestError({
            action,
            message: tRef.current('RunJS source request failed'),
          });
        }

        const response = await api.request<ResourceResponse<RunJSSourceActionResult<TAction>>>({
          url: `runJSSources:${action}`,
          method: 'post',
          data: input,
        });

        return response.data.data;
      } catch (error) {
        const requestError = normalizeRunJSSourceError(action, error, tRef.current);
        if (requestIdsRef.current[action] === requestId) {
          setErrors((current) => ({
            ...current,
            [action]: requestError,
          }));
        }
        throw requestError;
      } finally {
        setLoadingCounts((current) => {
          const nextCount = Math.max((current[action] || 0) - 1, 0);
          const next = { ...current };

          if (nextCount) {
            next[action] = nextCount;
          } else {
            delete next[action];
          }

          return next;
        });
      }
    },
    [api, clearError],
  );

  return useMemo<UseRunJSSourceResourceResult>(
    () => ({
      loading,
      errors,
      request,
      isLoading: (action) => Boolean(loading[action]),
      getError: (action) => errors[action] || null,
      clearError,
    }),
    [clearError, errors, loading, request],
  );
}

function normalizeRunJSSourceError(
  action: RunJSSourceActionName,
  error: unknown,
  t: TFunction,
): RunJSSourceRequestError {
  const response = getRecordProperty(error, 'response');
  const responseData = response ? response.data : undefined;
  const serverError = getFirstServerError(responseData) || getFirstServerError(error);
  const code = toVscErrorCode(serverError?.code);
  const rawMessage = toNonEmptyString(serverError?.message);
  const message = formatRunJSSourceRequestErrorMessage(code, rawMessage || t('RunJS source request failed'), t);

  return new RunJSSourceRequestError({
    action,
    code,
    status: toNumber(serverError?.status) ?? toNumber(response?.status),
    message,
    rawMessage,
    details: toRecord(serverError?.details) || undefined,
  });
}

export function formatRunJSSourceRequestErrorMessage(
  code: VscErrorCode | undefined,
  fallbackMessage: string,
  t: TFunction,
): string {
  switch (code) {
    case 'BASE_COMMIT_OUTDATED':
      return t('A newer version was published while you were editing.');
    case 'DRAFT_BASE_OUTDATED':
      return t('Your draft is based on an older version.');
    case 'RUNJS_IMPORT_NOT_ALLOWED':
      return t('Only relative imports inside this workspace are supported.');
    case 'RUNJS_IMPORT_NOT_FOUND':
      return t('Imported file was not found in this workspace.');
    case 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED':
      return t('Dynamic imports are not supported in RunJS sources.');
    case 'RUNJS_ENTRY_NOT_FOUND':
      return t('The entry file was not found in this workspace.');
    case 'RUNJS_SOURCE_KIND_UNSUPPORTED':
      return t('This JavaScript source type is not supported in Studio.');
    case 'RUNJS_SOURCE_LOCATOR_INVALID':
      return t('This JavaScript source could not be located.');
    case 'RUNJS_SOURCE_NOT_FOUND':
      return t('This JavaScript source no longer exists');
    case 'PERMISSION_DENIED':
      return t('You do not have permission to access this JavaScript source.');
    case 'RUNJS_SOURCE_READONLY':
      return t('You can view this JavaScript source, but you do not have permission to edit it');
    case 'RUNJS_COMPILE_FAILED':
      return t('Compile failed');
    case 'RUNJS_PUBLISH_NO_CHANGES':
      return t('No changes to publish');
    case 'RUNJS_COMMIT_MESSAGE_INVALID':
      return t('Commit message must be between 3 and 200 characters.');
    default:
      return fallbackMessage;
  }
}

export function formatRunJSSourceRequestTechnicalDetails(error: unknown, fallbackMessage: string): string {
  if (error instanceof RunJSSourceRequestError) {
    const lines = [`message: ${error.rawMessage || error.message}`];

    if (error.code) {
      lines.push(`code: ${error.code}`);
    }
    if (typeof error.status === 'number') {
      lines.push(`status: ${error.status}`);
    }
    if (error.details) {
      lines.push(`details: ${JSON.stringify(error.details, null, 2)}`);
    }

    return lines.join('\n');
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function getFirstServerError(value: unknown): Record<string, unknown> | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  const errors = record.errors;
  if (Array.isArray(errors)) {
    const firstError = errors.find((item) => Boolean(toRecord(item)));
    return toRecord(firstError);
  }

  const error = toRecord(record.error);
  if (error) {
    return error;
  }

  const messages = record.messages;
  if (Array.isArray(messages)) {
    const firstMessage = messages.find((item) => Boolean(toRecord(item)));
    return toRecord(firstMessage);
  }

  return null;
}

function getRecordProperty(value: unknown, key: string): Record<string, unknown> | null {
  const record = toRecord(value);
  return toRecord(record?.[key]);
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toVscErrorCode(value: unknown): VscErrorCode | undefined {
  return typeof value === 'string' ? (value as VscErrorCode) : undefined;
}
