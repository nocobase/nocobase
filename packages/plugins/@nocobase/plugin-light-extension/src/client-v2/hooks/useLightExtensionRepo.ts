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
  LightExtensionChangeLifecycleInput,
  LightExtensionCommitRecord,
  LightExtensionCompilePreviewResult,
  LightExtensionCreateRepoInput,
  LightExtensionEntryRecord,
  LightExtensionFileChange,
  LightExtensionFileResult,
  LightExtensionPullResult,
  LightExtensionPushResult,
  LightExtensionRepoLifecycleStatus,
  LightExtensionRepoRecord,
  LightExtensionScanResult,
} from '../../shared/types';

export const lightExtensionRepoOperations = [
  'listRepos',
  'createRepo',
  'getRepo',
  'changeLifecycle',
  'archiveRepo',
  'deleteRepo',
  'pull',
  'pullCommit',
  'getFile',
  'push',
  'compilePreview',
  'scanEntries',
  'listEntries',
  'listCommits',
] as const;

export type LightExtensionRepoOperation = (typeof lightExtensionRepoOperations)[number];

export type LightExtensionOperationState<T> = Partial<Record<LightExtensionRepoOperation, T>>;

export interface LightExtensionHookErrorOptions {
  operation: LightExtensionRepoOperation;
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class LightExtensionHookError extends Error {
  readonly operation: LightExtensionRepoOperation;

  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: LightExtensionHookErrorOptions) {
    super(options.message);
    this.name = 'LightExtensionHookError';
    this.operation = options.operation;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface LightExtensionPullInput {
  repoId: string;
  ref?: string;
  knownTreeHash?: string;
  includeContent?: 'none' | 'selected' | 'all';
  selectedPaths?: string[];
}

export interface LightExtensionPullCommitInput {
  repoId: string;
  commitId: string;
  knownTreeHash?: string;
  includeContent?: 'none' | 'selected' | 'all';
  selectedPaths?: string[];
}

export interface LightExtensionGetFileInput {
  repoId: string;
  ref?: string;
  path: string;
}

export interface LightExtensionListCommitsInput {
  repoId: string;
  limit?: number;
  beforeSeq?: number;
}

export interface LightExtensionPushInput {
  repoId: string;
  baseCommitId: string | null;
  message: string;
  files: LightExtensionFileChange[];
  allowEmptyCommit?: boolean;
}

export interface UseLightExtensionRepoResult {
  loading: LightExtensionOperationState<boolean>;
  errors: LightExtensionOperationState<LightExtensionHookError>;
  listRepos(): Promise<LightExtensionRepoRecord[]>;
  createRepo(input: LightExtensionCreateRepoInput): Promise<LightExtensionRepoRecord>;
  getRepo(repoId: string): Promise<LightExtensionRepoRecord>;
  changeLifecycle(input: LightExtensionChangeLifecycleInput): Promise<LightExtensionRepoRecord>;
  archiveRepo(input: { repoId: string; expectedVersion?: number }): Promise<LightExtensionRepoRecord>;
  deleteRepo(repoId: string): Promise<{ deleted: boolean; repoId: string }>;
  pull(input: LightExtensionPullInput): Promise<LightExtensionPullResult>;
  pullCommit(input: LightExtensionPullCommitInput): Promise<LightExtensionPullResult>;
  getFile(input: LightExtensionGetFileInput): Promise<LightExtensionFileResult>;
  push(input: LightExtensionPushInput): Promise<LightExtensionPushResult>;
  compilePreview(input: { repoId: string; entryIds?: string[] }): Promise<LightExtensionCompilePreviewResult>;
  scanEntries(repoId: string): Promise<LightExtensionScanResult>;
  listEntries(repoId: string): Promise<LightExtensionEntryRecord[]>;
  listCommits(input: LightExtensionListCommitsInput): Promise<LightExtensionCommitRecord[]>;
  isLoading(operation: LightExtensionRepoOperation): boolean;
  getError(operation: LightExtensionRepoOperation): LightExtensionHookError | null;
  clearError(operation?: LightExtensionRepoOperation): void;
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
  listRepos: undefined;
  createRepo: LightExtensionCreateRepoInput;
  getRepo: { repoId: string };
  changeLifecycle: LightExtensionChangeLifecycleInput;
  archiveRepo: { repoId: string; expectedVersion?: number };
  deleteRepo: { repoId: string };
  pull: LightExtensionPullInput;
  pullCommit: LightExtensionPullCommitInput;
  getFile: LightExtensionGetFileInput;
  push: LightExtensionPushInput;
  compilePreview: { repoId: string; entryIds?: string[] };
  scanEntries: { repoId: string };
  listEntries: { repoId: string };
  listCommits: LightExtensionListCommitsInput;
};

type OperationResultMap = {
  listRepos: LightExtensionRepoRecord[];
  createRepo: LightExtensionRepoRecord;
  getRepo: LightExtensionRepoRecord;
  changeLifecycle: LightExtensionRepoRecord;
  archiveRepo: LightExtensionRepoRecord;
  deleteRepo: { deleted: boolean; repoId: string };
  pull: LightExtensionPullResult;
  pullCommit: LightExtensionPullResult;
  getFile: LightExtensionFileResult;
  push: LightExtensionPushResult;
  compilePreview: LightExtensionCompilePreviewResult;
  scanEntries: LightExtensionScanResult;
  listEntries: LightExtensionEntryRecord[];
  listCommits: LightExtensionCommitRecord[];
};

const operationResourceActions: Record<LightExtensionRepoOperation, string> = {
  listRepos: 'lightExtensionRepos:list',
  createRepo: 'lightExtensionRepos:create',
  getRepo: 'lightExtensionRepos:get',
  changeLifecycle: 'lightExtensionRepos:changeLifecycle',
  archiveRepo: 'lightExtensionRepos:archive',
  deleteRepo: 'lightExtensionRepos:delete',
  pull: 'lightExtensionFiles:pull',
  pullCommit: 'lightExtensionFiles:pullCommit',
  getFile: 'lightExtensionFiles:getFile',
  push: 'lightExtensionFiles:push',
  compilePreview: 'lightExtensions:compilePreview',
  scanEntries: 'lightExtensionEntries:scan',
  listEntries: 'lightExtensionEntries:list',
  listCommits: 'lightExtensionFiles:listCommits',
};

export function useLightExtensionRepo(): UseLightExtensionRepoResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);
  const [loadingCounts, setLoadingCounts] = useState<LightExtensionOperationState<number>>({});
  const [errors, setErrors] = useState<LightExtensionOperationState<LightExtensionHookError>>({});

  const loading = useMemo<LightExtensionOperationState<boolean>>(() => {
    return Object.fromEntries(
      lightExtensionRepoOperations.map((operation) => [operation, Boolean(loadingCounts[operation])]),
    ) as LightExtensionOperationState<boolean>;
  }, [loadingCounts]);

  const clearError = useCallback((operation?: LightExtensionRepoOperation) => {
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
    async <TOperation extends LightExtensionRepoOperation>(
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
        const hookError = normalizeLightExtensionError(operation, error, t('Light extension request failed'));
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

  const listRepos = useCallback(() => requestOperation('listRepos', undefined), [requestOperation]);
  const createRepo = useCallback(
    (input: LightExtensionCreateRepoInput) => requestOperation('createRepo', input),
    [requestOperation],
  );
  const getRepo = useCallback((repoId: string) => requestOperation('getRepo', { repoId }), [requestOperation]);
  const changeLifecycle = useCallback(
    (input: LightExtensionChangeLifecycleInput) => requestOperation('changeLifecycle', input),
    [requestOperation],
  );
  const archiveRepo = useCallback(
    (input: { repoId: string; expectedVersion?: number }) => requestOperation('archiveRepo', input),
    [requestOperation],
  );
  const deleteRepo = useCallback((repoId: string) => requestOperation('deleteRepo', { repoId }), [requestOperation]);
  const pull = useCallback((input: LightExtensionPullInput) => requestOperation('pull', input), [requestOperation]);
  const pullCommit = useCallback(
    (input: LightExtensionPullCommitInput) => requestOperation('pullCommit', input),
    [requestOperation],
  );
  const getFile = useCallback(
    (input: LightExtensionGetFileInput) => requestOperation('getFile', input),
    [requestOperation],
  );
  const push = useCallback((input: LightExtensionPushInput) => requestOperation('push', input), [requestOperation]);
  const compilePreview = useCallback(
    (input: { repoId: string; entryIds?: string[] }) => requestOperation('compilePreview', input),
    [requestOperation],
  );
  const scanEntries = useCallback((repoId: string) => requestOperation('scanEntries', { repoId }), [requestOperation]);
  const listEntries = useCallback((repoId: string) => requestOperation('listEntries', { repoId }), [requestOperation]);
  const listCommits = useCallback(
    (input: LightExtensionListCommitsInput) => requestOperation('listCommits', input),
    [requestOperation],
  );
  const isLoading = useCallback((operation: LightExtensionRepoOperation) => Boolean(loading[operation]), [loading]);
  const getError = useCallback((operation: LightExtensionRepoOperation) => errors[operation] || null, [errors]);

  return useMemo<UseLightExtensionRepoResult>(
    () => ({
      loading,
      errors,
      listRepos,
      createRepo,
      getRepo,
      changeLifecycle,
      archiveRepo,
      deleteRepo,
      pull,
      pullCommit,
      getFile,
      push,
      compilePreview,
      scanEntries,
      listEntries,
      listCommits,
      isLoading,
      getError,
      clearError,
    }),
    [
      archiveRepo,
      changeLifecycle,
      clearError,
      compilePreview,
      createRepo,
      deleteRepo,
      errors,
      getError,
      getFile,
      getRepo,
      isLoading,
      listEntries,
      listCommits,
      listRepos,
      loading,
      pull,
      pullCommit,
      push,
      scanEntries,
    ],
  );
}

export function isLightExtensionHookError(error: unknown): error is LightExtensionHookError {
  return error instanceof LightExtensionHookError;
}

function unwrapResourceResponse<T>(response: ResourceResponse<T>): T {
  if (isRecord(response.data) && 'data' in response.data) {
    return response.data.data as T;
  }

  return response.data as T;
}

function normalizeLightExtensionError(
  operation: LightExtensionRepoOperation,
  error: unknown,
  fallbackMessage: string,
): LightExtensionHookError {
  const response = getRecordProperty(error, 'response');
  const responseData = response ? response.data : undefined;
  const serverError = getFirstServerError(responseData) || getFirstServerError(error);
  const message = toNonEmptyString(serverError?.message) || fallbackMessage;

  return new LightExtensionHookError({
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

export function toLifecycleInput(
  repo: LightExtensionRepoRecord,
  lifecycleStatus: LightExtensionRepoLifecycleStatus,
): LightExtensionChangeLifecycleInput {
  return {
    repoId: repo.id,
    lifecycleStatus,
    expectedLifecycleStatus: repo.lifecycleStatus,
    expectedVersion: repo.version,
  };
}

export function getLightExtensionErrorDiagnostics(error: unknown) {
  if (!isLightExtensionHookError(error)) {
    return [];
  }

  const diagnostics = error.details?.diagnostics;
  return Array.isArray(diagnostics) ? diagnostics : [];
}
