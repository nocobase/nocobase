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
  details?: VscErrorDetails;
}

export class RunJSSourceRequestError extends Error {
  readonly action: RunJSSourceActionName;

  readonly code?: VscErrorCode;

  readonly status?: number;

  readonly details?: VscErrorDetails;

  constructor(options: RunJSSourceRequestErrorOptions) {
    super(options.message);
    this.name = 'RunJSSourceRequestError';
    this.action = options.action;
    this.code = options.code;
    this.status = options.status;
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
        const requestError = normalizeRunJSSourceError(action, error, tRef.current('RunJS source request failed'));
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
  fallbackMessage: string,
): RunJSSourceRequestError {
  const response = getRecordProperty(error, 'response');
  const responseData = response ? response.data : undefined;
  const serverError = getFirstServerError(responseData) || getFirstServerError(error);
  const message = toNonEmptyString(serverError?.message) || fallbackMessage;
  const code = toVscErrorCode(serverError?.code);

  return new RunJSSourceRequestError({
    action,
    code,
    status: toNumber(serverError?.status) ?? toNumber(response?.status),
    message,
    details: toRecord(serverError?.details) || undefined,
  });
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
