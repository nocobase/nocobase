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
import type {
  LightExtensionChangeLifecycleInput,
  LightExtensionCommitRecord,
  LightExtensionCreateRepoInput,
  LightExtensionFileChange,
  LightExtensionInspectSourceArchiveInput,
  LightExtensionInspectSourceArchiveResult,
  LightExtensionPullResult,
  LightExtensionRepoRecord,
  LightExtensionSaveSourceResult,
  LightExtensionUpdateRepoInput,
  LightExtensionWorkspacePreviewInput,
  LightExtensionWorkspacePreviewResult,
} from '../../shared/types';
import { unwrapResourceResponse } from '../api/lightExtensionEntriesRequests';
import { invalidateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { invalidateLightExtensionSettingsDescriptorCache } from '../resolvers/LightExtensionSettingsDescriptorCache';

export type LightExtensionRepoOperation = keyof OperationInputMap;

interface LightExtensionHookErrorOptions {
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

export interface LightExtensionListCommitsInput {
  repoId: string;
  limit?: number;
  beforeSeq?: number;
}

export interface LightExtensionSaveSourceInput {
  repoId: string;
  expectedHeadCommitId: string | null;
  message: string;
  files: LightExtensionFileChange[];
}

export interface UseLightExtensionRepoResult {
  listRepos(): Promise<LightExtensionRepoRecord[]>;
  createRepo(input: LightExtensionCreateRepoInput): Promise<LightExtensionRepoRecord>;
  getRepo(repoId: string): Promise<LightExtensionRepoRecord>;
  updateRepo(input: LightExtensionUpdateRepoInput): Promise<LightExtensionRepoRecord>;
  changeLifecycle(input: LightExtensionChangeLifecycleInput): Promise<LightExtensionRepoRecord>;
  deleteRepo(repoId: string): Promise<LightExtensionRepoRecord>;
  inspectSourceArchive(
    input: LightExtensionInspectSourceArchiveInput,
  ): Promise<LightExtensionInspectSourceArchiveResult>;
  pull(input: LightExtensionPullInput): Promise<LightExtensionPullResult>;
  pullCommit(input: LightExtensionPullCommitInput): Promise<LightExtensionPullResult>;
  saveSource(input: LightExtensionSaveSourceInput): Promise<LightExtensionSaveSourceResult>;
  compileWorkspacePreview(input: LightExtensionWorkspacePreviewInput): Promise<LightExtensionWorkspacePreviewResult>;
  listCommits(input: LightExtensionListCommitsInput): Promise<LightExtensionCommitRecord[]>;
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
  updateRepo: LightExtensionUpdateRepoInput;
  changeLifecycle: LightExtensionChangeLifecycleInput;
  deleteRepo: { repoId: string };
  inspectSourceArchive: LightExtensionInspectSourceArchiveInput;
  pull: LightExtensionPullInput;
  pullCommit: LightExtensionPullCommitInput;
  saveSource: LightExtensionSaveSourceInput;
  compileWorkspacePreview: LightExtensionWorkspacePreviewInput;
  listCommits: LightExtensionListCommitsInput;
};

type OperationResultMap = {
  listRepos: LightExtensionRepoRecord[];
  createRepo: LightExtensionRepoRecord;
  getRepo: LightExtensionRepoRecord;
  updateRepo: LightExtensionRepoRecord;
  changeLifecycle: LightExtensionRepoRecord;
  deleteRepo: LightExtensionRepoRecord;
  inspectSourceArchive: LightExtensionInspectSourceArchiveResult;
  pull: LightExtensionPullResult;
  pullCommit: LightExtensionPullResult;
  saveSource: LightExtensionSaveSourceResult;
  compileWorkspacePreview: LightExtensionWorkspacePreviewResult;
  listCommits: LightExtensionCommitRecord[];
};

const operationResourceActions: Record<LightExtensionRepoOperation, string> = {
  listRepos: 'lightExtensionRepos:list',
  createRepo: 'lightExtensionRepos:create',
  getRepo: 'lightExtensionRepos:get',
  updateRepo: 'lightExtensionRepos:updateMetadata',
  changeLifecycle: 'lightExtensionRepos:changeLifecycle',
  deleteRepo: 'lightExtensionRepos:delete',
  inspectSourceArchive: 'lightExtensionRepos:inspectSourceArchive',
  pull: 'lightExtensionFiles:pull',
  pullCommit: 'lightExtensionFiles:pullCommit',
  saveSource: 'lightExtensionFiles:saveSource',
  compileWorkspacePreview: 'lightExtensions:compileWorkspacePreview',
  listCommits: 'lightExtensionFiles:listCommits',
};

export function useLightExtensionRepo(): UseLightExtensionRepoResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);

  const requestOperation = useCallback(
    async <TOperation extends LightExtensionRepoOperation>(
      operation: TOperation,
      input: OperationInputMap[TOperation],
    ): Promise<OperationResultMap[TOperation]> => {
      try {
        const response = await ctx.api.request<ResourceResponse<OperationResultMap[TOperation]>>({
          url: operationResourceActions[operation],
          method: 'post',
          data: input,
        });

        return unwrapResourceResponse(response);
      } catch (error) {
        throw normalizeLightExtensionError(operation, error, t('Light extension request failed'));
      }
    },
    [ctx.api, t],
  );

  const listRepos = useCallback(() => requestOperation('listRepos', undefined), [requestOperation]);
  const createRepo = useCallback(
    (input: LightExtensionCreateRepoInput) => requestOperation('createRepo', input),
    [requestOperation],
  );
  const getRepo = useCallback((repoId: string) => requestOperation('getRepo', { repoId }), [requestOperation]);
  const updateRepo = useCallback(
    (input: LightExtensionUpdateRepoInput) => requestOperation('updateRepo', input),
    [requestOperation],
  );
  const changeLifecycle = useCallback(
    async (input: LightExtensionChangeLifecycleInput) => {
      const result = await requestOperation('changeLifecycle', input);
      invalidateLightExtensionSettingsDescriptorCache(ctx.api, input.repoId);
      invalidateLightExtensionRuntimeCache(ctx.api, input.repoId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const deleteRepo = useCallback(
    async (repoId: string) => {
      const result = await requestOperation('deleteRepo', { repoId });
      invalidateLightExtensionSettingsDescriptorCache(ctx.api, repoId);
      invalidateLightExtensionRuntimeCache(ctx.api, repoId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const inspectSourceArchive = useCallback(
    (input: LightExtensionInspectSourceArchiveInput) => requestOperation('inspectSourceArchive', input),
    [requestOperation],
  );
  const pull = useCallback((input: LightExtensionPullInput) => requestOperation('pull', input), [requestOperation]);
  const pullCommit = useCallback(
    (input: LightExtensionPullCommitInput) => requestOperation('pullCommit', input),
    [requestOperation],
  );
  const saveSource = useCallback(
    async (input: LightExtensionSaveSourceInput) => {
      const result = await requestOperation('saveSource', input);
      invalidateLightExtensionSettingsDescriptorCache(ctx.api, input.repoId);
      invalidateLightExtensionRuntimeCache(ctx.api, input.repoId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const compileWorkspacePreview = useCallback(
    (input: LightExtensionWorkspacePreviewInput) => requestOperation('compileWorkspacePreview', input),
    [requestOperation],
  );
  const listCommits = useCallback(
    (input: LightExtensionListCommitsInput) => requestOperation('listCommits', input),
    [requestOperation],
  );

  return useMemo<UseLightExtensionRepoResult>(
    () => ({
      listRepos,
      createRepo,
      getRepo,
      updateRepo,
      changeLifecycle,
      deleteRepo,
      inspectSourceArchive,
      pull,
      pullCommit,
      saveSource,
      compileWorkspacePreview,
      listCommits,
    }),
    [
      changeLifecycle,
      compileWorkspacePreview,
      createRepo,
      deleteRepo,
      getRepo,
      inspectSourceArchive,
      listCommits,
      listRepos,
      pull,
      pullCommit,
      saveSource,
      updateRepo,
    ],
  );
}

function isLightExtensionHookError(error: unknown): error is LightExtensionHookError {
  return error instanceof LightExtensionHookError;
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

export function getLightExtensionErrorProblems(error: unknown) {
  if (!isLightExtensionHookError(error)) {
    return [];
  }

  const problems = error.details?.problems;
  return Array.isArray(problems) ? problems : [];
}
