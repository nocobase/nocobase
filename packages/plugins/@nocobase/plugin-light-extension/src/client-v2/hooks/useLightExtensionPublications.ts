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
import type { LightExtensionPublicationMetadataRecord, LightExtensionPublishResult } from '../../shared/types';

export const lightExtensionPublicationOperations = [
  'listPublications',
  'publish',
  'activatePublication',
  'emergencyRollback',
] as const;

export type LightExtensionPublicationOperation = (typeof lightExtensionPublicationOperations)[number];

export type LightExtensionPublicationOperationState<T> = Partial<Record<LightExtensionPublicationOperation, T>>;

export interface LightExtensionPublicationHookErrorOptions {
  operation: LightExtensionPublicationOperation;
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class LightExtensionPublicationHookError extends Error {
  readonly operation: LightExtensionPublicationOperation;

  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: LightExtensionPublicationHookErrorOptions) {
    super(options.message);
    this.name = 'LightExtensionPublicationHookError';
    this.operation = options.operation;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface LightExtensionPublishInput {
  repoId: string;
  entryIds: string[];
  commitId: string;
  clientRequestId: string;
  activate?: boolean;
  expectedCurrentPublicationIdByEntry?: Record<string, string | null>;
}

export interface LightExtensionActivatePublicationInput {
  entryId: string;
  toPublicationId: string;
  expectedCurrentPublicationId: string | null;
}

export interface LightExtensionEmergencyRollbackInput extends LightExtensionActivatePublicationInput {
  reason: string;
}

export interface LightExtensionActivationResult {
  entryId: string;
  repoId: string;
  oldPublicationId: string | null;
  activePublicationId: string;
  publication: LightExtensionPublicationMetadataRecord;
  emergency: boolean;
}

export interface UseLightExtensionPublicationsResult {
  loading: LightExtensionPublicationOperationState<boolean>;
  errors: LightExtensionPublicationOperationState<LightExtensionPublicationHookError>;
  listPublications(repoId: string): Promise<LightExtensionPublicationMetadataRecord[]>;
  publish(input: LightExtensionPublishInput): Promise<LightExtensionPublishResult>;
  activatePublication(input: LightExtensionActivatePublicationInput): Promise<LightExtensionActivationResult>;
  emergencyRollback(input: LightExtensionEmergencyRollbackInput): Promise<LightExtensionActivationResult>;
  isLoading(operation: LightExtensionPublicationOperation): boolean;
  getError(operation: LightExtensionPublicationOperation): LightExtensionPublicationHookError | null;
  clearError(operation?: LightExtensionPublicationOperation): void;
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
  listPublications: { repoId: string };
  publish: LightExtensionPublishInput;
  activatePublication: LightExtensionActivatePublicationInput;
  emergencyRollback: LightExtensionEmergencyRollbackInput;
};

type OperationResultMap = {
  listPublications: LightExtensionPublicationMetadataRecord[];
  publish: LightExtensionPublishResult;
  activatePublication: LightExtensionActivationResult;
  emergencyRollback: LightExtensionActivationResult;
};

const operationResourceActions: Record<LightExtensionPublicationOperation, string> = {
  listPublications: 'lightExtensionPublications:list',
  publish: 'lightExtensions:publish',
  activatePublication: 'lightExtensionEntries:activatePublication',
  emergencyRollback: 'lightExtensionEntries:emergencyRollback',
};

export function useLightExtensionPublications(): UseLightExtensionPublicationsResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);
  const [loadingCounts, setLoadingCounts] = useState<LightExtensionPublicationOperationState<number>>({});
  const [errors, setErrors] = useState<LightExtensionPublicationOperationState<LightExtensionPublicationHookError>>({});

  const loading = useMemo<LightExtensionPublicationOperationState<boolean>>(() => {
    return Object.fromEntries(
      lightExtensionPublicationOperations.map((operation) => [operation, Boolean(loadingCounts[operation])]),
    ) as LightExtensionPublicationOperationState<boolean>;
  }, [loadingCounts]);

  const clearError = useCallback((operation?: LightExtensionPublicationOperation) => {
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
    async <TOperation extends LightExtensionPublicationOperation>(
      operation: TOperation,
      input: OperationInputMap[TOperation],
    ): Promise<OperationResultMap[TOperation]> => {
      setLoadingCounts((current) => ({
        ...current,
        [operation]: (current[operation] || 0) + 1,
      }));
      clearError(operation);

      try {
        const response = await ctx.api.request<ResourceResponse<OperationResultMap[TOperation]>>({
          url: operationResourceActions[operation],
          method: 'post',
          data: input,
        });

        return unwrapResourceResponse(response);
      } catch (error) {
        const hookError = normalizePublicationError(operation, error, t('Light extension request failed'));
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

  const listPublications = useCallback(
    (repoId: string) => requestOperation('listPublications', { repoId }),
    [requestOperation],
  );
  const publish = useCallback(
    (input: LightExtensionPublishInput) => requestOperation('publish', input),
    [requestOperation],
  );
  const activatePublication = useCallback(
    (input: LightExtensionActivatePublicationInput) => requestOperation('activatePublication', input),
    [requestOperation],
  );
  const emergencyRollback = useCallback(
    (input: LightExtensionEmergencyRollbackInput) => requestOperation('emergencyRollback', input),
    [requestOperation],
  );
  const isLoading = useCallback(
    (operation: LightExtensionPublicationOperation) => Boolean(loading[operation]),
    [loading],
  );
  const getError = useCallback((operation: LightExtensionPublicationOperation) => errors[operation] || null, [errors]);

  return useMemo<UseLightExtensionPublicationsResult>(
    () => ({
      loading,
      errors,
      listPublications,
      publish,
      activatePublication,
      emergencyRollback,
      isLoading,
      getError,
      clearError,
    }),
    [
      activatePublication,
      clearError,
      emergencyRollback,
      errors,
      getError,
      isLoading,
      listPublications,
      loading,
      publish,
    ],
  );
}

function unwrapResourceResponse<T>(response: ResourceResponse<T>): T {
  if (isRecord(response.data) && 'data' in response.data) {
    return response.data.data as T;
  }

  return response.data as T;
}

function normalizePublicationError(
  operation: LightExtensionPublicationOperation,
  error: unknown,
  fallbackMessage: string,
): LightExtensionPublicationHookError {
  const response = getRecordProperty(error, 'response');
  const responseData = response ? response.data : undefined;
  const serverError = getFirstServerError(responseData) || getFirstServerError(error);
  const message = toNonEmptyString(serverError?.message) || fallbackMessage;

  return new LightExtensionPublicationHookError({
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
