/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionEntryPublicationsSelectorResult,
  LightExtensionSelectableEntryRecord,
  LightExtensionSelectableEntriesInput,
} from '../../shared/types';

export const lightExtensionEntrySelectorOperations = ['listSelectableEntries', 'listEntryPublications'] as const;

export type LightExtensionEntrySelectorOperation = (typeof lightExtensionEntrySelectorOperations)[number];

export type LightExtensionEntrySelectorOperationState<T> = Partial<Record<LightExtensionEntrySelectorOperation, T>>;

export interface LightExtensionEntriesHookErrorOptions {
  operation: LightExtensionEntrySelectorOperation;
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class LightExtensionEntriesHookError extends Error {
  readonly operation: LightExtensionEntrySelectorOperation;

  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: LightExtensionEntriesHookErrorOptions) {
    super(options.message);
    this.name = 'LightExtensionEntriesHookError';
    this.operation = options.operation;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface UseLightExtensionEntriesResult {
  loading: LightExtensionEntrySelectorOperationState<boolean>;
  errors: LightExtensionEntrySelectorOperationState<LightExtensionEntriesHookError>;
  listSelectableEntries(input?: LightExtensionSelectableEntriesInput): Promise<LightExtensionSelectableEntryRecord[]>;
  listEntryPublications(entryId: string): Promise<LightExtensionEntryPublicationsSelectorResult>;
  isLoading(operation: LightExtensionEntrySelectorOperation): boolean;
  getError(operation: LightExtensionEntrySelectorOperation): LightExtensionEntriesHookError | null;
  clearError(operation?: LightExtensionEntrySelectorOperation): void;
}

type ApiRequestOptions = {
  url: string;
  method?: string;
  data?: unknown;
};

type ApiClientLike = {
  request: <TResponse>(options: ApiRequestOptions) => Promise<TResponse>;
};

type FlowContextWithApi = {
  api: ApiClientLike;
};

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

type OperationInputMap = {
  listSelectableEntries: LightExtensionSelectableEntriesInput | undefined;
  listEntryPublications: { entryId: string };
};

type OperationResultMap = {
  listSelectableEntries: LightExtensionSelectableEntryRecord[];
  listEntryPublications: LightExtensionEntryPublicationsSelectorResult;
};

export function useLightExtensionEntries(): UseLightExtensionEntriesResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);
  const [loadingCounts, setLoadingCounts] = useState<LightExtensionEntrySelectorOperationState<number>>({});
  const [errors, setErrors] = useState<LightExtensionEntrySelectorOperationState<LightExtensionEntriesHookError>>({});

  const loading = useMemo<LightExtensionEntrySelectorOperationState<boolean>>(() => {
    return Object.fromEntries(
      lightExtensionEntrySelectorOperations.map((operation) => [operation, Boolean(loadingCounts[operation])]),
    ) as LightExtensionEntrySelectorOperationState<boolean>;
  }, [loadingCounts]);

  const clearError = useCallback((operation?: LightExtensionEntrySelectorOperation) => {
    setErrors((current) => {
      if (!operation) {
        return {};
      }

      const next = { ...current };
      delete next[operation];
      return next;
    });
  }, []);

  const requestOperation = useCallback(
    async <TOperation extends LightExtensionEntrySelectorOperation>(
      operation: TOperation,
      input: OperationInputMap[TOperation],
    ): Promise<OperationResultMap[TOperation]> => {
      setLoadingCounts((current) => ({
        ...current,
        [operation]: (current[operation] || 0) + 1,
      }));
      clearError(operation);

      try {
        const response = await ctx.api.request<ResourceResponse<OperationResultMap[TOperation]>>(
          getRequestOptions(operation, input),
        );

        return unwrapResourceResponse(response);
      } catch (error) {
        const hookError = normalizeEntriesError(operation, error, t('Light extension request failed'));
        setErrors((current) => ({
          ...current,
          [operation]: hookError,
        }));
        throw hookError;
      } finally {
        setLoadingCounts((current) => {
          const nextCount = Math.max((current[operation] || 0) - 1, 0);
          const next = { ...current };

          if (nextCount) {
            next[operation] = nextCount;
          } else {
            delete next[operation];
          }

          return next;
        });
      }
    },
    [clearError, ctx.api, t],
  );

  return useMemo<UseLightExtensionEntriesResult>(
    () => ({
      loading,
      errors,
      listSelectableEntries: (input) => requestOperation('listSelectableEntries', input),
      listEntryPublications: (entryId) => requestOperation('listEntryPublications', { entryId }),
      isLoading: (operation) => Boolean(loading[operation]),
      getError: (operation) => errors[operation] || null,
      clearError,
    }),
    [clearError, errors, loading, requestOperation],
  );
}

export function isLightExtensionEntriesHookError(error: unknown): error is LightExtensionEntriesHookError {
  return error instanceof LightExtensionEntriesHookError;
}

function getRequestOptions<TOperation extends LightExtensionEntrySelectorOperation>(
  operation: TOperation,
  input: OperationInputMap[TOperation],
): ApiRequestOptions {
  if (operation === 'listEntryPublications') {
    const entryId = (input as OperationInputMap['listEntryPublications']).entryId;
    return {
      url: `/light-extension-entries/${encodeURIComponent(entryId)}/publications`,
      method: 'get',
    };
  }

  return {
    url: 'lightExtensionEntries:listSelectable',
    method: 'post',
    data: input,
  };
}

function unwrapResourceResponse<T>(response: ResourceResponse<T>): T {
  if (isRecord(response.data) && 'data' in response.data) {
    return response.data.data as T;
  }

  return response.data as T;
}

function normalizeEntriesError(
  operation: LightExtensionEntrySelectorOperation,
  error: unknown,
  fallbackMessage: string,
): LightExtensionEntriesHookError {
  const response = getRecordProperty(error, 'response');
  const responseData = response ? response.data : undefined;
  const serverError = getFirstServerError(responseData) || getFirstServerError(error);
  const message = toNonEmptyString(serverError?.message) || fallbackMessage;

  return new LightExtensionEntriesHookError({
    operation,
    code: toNonEmptyString(serverError?.code),
    status: toNumber(serverError?.status) ?? toNumber(response?.status),
    message,
    details: toRecord(serverError?.details),
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

  return null;
}

function getRecordProperty(value: unknown, key: string): Record<string, unknown> | null {
  const record = toRecord(value);
  return toRecord(record?.[key]);
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) {
    return null;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
