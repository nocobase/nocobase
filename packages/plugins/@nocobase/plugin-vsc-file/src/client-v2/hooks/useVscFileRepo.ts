/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useCallback, useMemo, useRef, useState } from 'react';

import type {
  VscCommitRecord,
  VscFileChange,
  VscNormalizedTreeEntry,
  VscRefRecord,
  VscRefName,
  VscRepositoryRecord,
  VscStoredTree,
} from '../../shared/types';
import { useT } from '../locale';

export const vscFileRepoOperations = [
  'pull',
  'getFile',
  'push',
  'listCommits',
  'diff',
  'diffFile',
  'restoreFile',
  'restoreCommit',
  'listRefs',
  'updateRef',
] as const;

export type VscFileRepoOperation = (typeof vscFileRepoOperations)[number];

export type VscFileRepoOperationState<T> = Partial<Record<VscFileRepoOperation, T>>;

export type IncludeContentMode = 'none' | 'selected' | 'all';

export interface VscFileRepoRepositoryInput {
  repoId: string;
}

export interface VscFileRepoPullInput extends VscFileRepoRepositoryInput {
  ref?: VscRefName;
  knownTreeHash?: string;
  includeContent?: IncludeContentMode;
  selectedPaths?: string[];
}

export interface VscFileRepoPulledFile extends VscNormalizedTreeEntry {
  content?: string;
}

export interface VscFileRepoPullResult {
  repository: VscRepositoryRecord;
  commit: VscCommitRecord | null;
  tree: VscStoredTree | null;
  unchanged: boolean;
  files?: VscFileRepoPulledFile[];
}

export interface VscFileRepoGetFileInput extends VscFileRepoRepositoryInput {
  ref?: VscRefName;
  path: string;
}

export interface VscFileRepoGetFileResult extends VscNormalizedTreeEntry {
  content: string;
}

export interface VscFileRepoPushInput extends VscFileRepoRepositoryInput {
  baseCommitId: string | null;
  message: string;
  files: VscFileChange[];
  allowEmptyCommit?: boolean;
  metadata?: Record<string, unknown>;
}

export interface VscFileRepoPushResult {
  repository: VscRepositoryRecord;
  commit: VscCommitRecord;
  tree: VscStoredTree;
}

export interface VscFileRepoListCommitsInput extends VscFileRepoRepositoryInput {
  limit?: number;
  beforeSeq?: number;
}

export interface VscFileRepoDiffInput extends VscFileRepoRepositoryInput {
  fromCommitId: string;
  toCommitId: string;
}

export type VscFileRepoDiffFileEndpoint = {
  type: 'commit';
  commitId: string;
  path: string;
};

export interface VscFileRepoDiffFileInput extends VscFileRepoRepositoryInput {
  from?: VscFileRepoDiffFileEndpoint | null;
  to?: VscFileRepoDiffFileEndpoint | null;
}

export type VscFileRepoFileDiffStatus = 'added' | 'modified' | 'deleted' | 'unchanged' | 'renamed';

export interface VscFileRepoFileDiffEntry {
  status: VscFileRepoFileDiffStatus;
  path: string;
  pathHash: string;
  oldPath?: string;
  oldPathHash?: string;
  blobHash?: string;
  oldBlobHash?: string;
  language?: string;
  oldLanguage?: string;
  mode?: string;
  oldMode?: string;
  size?: number;
  oldSize?: number;
  additions?: number;
  deletions?: number;
  tooLarge: boolean;
}

export interface VscFileRepoFileDiffSummary {
  added: number;
  modified: number;
  deleted: number;
  unchanged: number;
  renamed: number;
}

export interface VscFileRepoFileDiffResult {
  files: VscFileRepoFileDiffEntry[];
  summary: VscFileRepoFileDiffSummary;
}

export type VscFileRepoLineDiffType = 'context' | 'delete' | 'insert';

export interface VscFileRepoLineDiffLine {
  type: VscFileRepoLineDiffType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface VscFileRepoLineDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: VscFileRepoLineDiffLine[];
}

export interface VscFileRepoDiffFileResult {
  tooLarge: boolean;
  additions?: number;
  deletions?: number;
  hunks: VscFileRepoLineDiffHunk[];
}

export interface VscFileRepoRestoreFileInput extends VscFileRepoRepositoryInput {
  sourceCommitId: string;
  path: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface VscFileRepoRestoreCommitInput extends VscFileRepoRepositoryInput {
  sourceCommitId: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export type VscFileRepoRestoreResult = VscFileRepoPushResult;

export type VscFileRepoListRefsInput = VscFileRepoRepositoryInput;

export type VscFileRepoUpdatableRefName = 'head' | 'published';

export interface VscFileRepoUpdateRefInput extends VscFileRepoRepositoryInput {
  name: VscFileRepoUpdatableRefName;
  targetCommitId: string;
  basePublishedCommitId?: string | null;
}

export interface VscFileRepoUpdateRefResult {
  repository: VscRepositoryRecord;
  ref: VscRefRecord;
  commit: VscCommitRecord;
}

export interface VscFileRepoRequestMap {
  pull: {
    input: VscFileRepoPullInput;
    result: VscFileRepoPullResult;
  };
  getFile: {
    input: VscFileRepoGetFileInput;
    result: VscFileRepoGetFileResult;
  };
  push: {
    input: VscFileRepoPushInput;
    result: VscFileRepoPushResult;
  };
  listCommits: {
    input: VscFileRepoListCommitsInput;
    result: VscCommitRecord[];
  };
  diff: {
    input: VscFileRepoDiffInput;
    result: VscFileRepoFileDiffResult;
  };
  diffFile: {
    input: VscFileRepoDiffFileInput;
    result: VscFileRepoDiffFileResult;
  };
  restoreFile: {
    input: VscFileRepoRestoreFileInput;
    result: VscFileRepoRestoreResult;
  };
  restoreCommit: {
    input: VscFileRepoRestoreCommitInput;
    result: VscFileRepoRestoreResult;
  };
  listRefs: {
    input: VscFileRepoListRefsInput;
    result: VscRefRecord[];
  };
  updateRef: {
    input: VscFileRepoUpdateRefInput;
    result: VscFileRepoUpdateRefResult;
  };
}

export type VscFileRepoOperationInput<TOperation extends VscFileRepoOperation> =
  VscFileRepoRequestMap[TOperation]['input'];

export type VscFileRepoOperationResult<TOperation extends VscFileRepoOperation> =
  VscFileRepoRequestMap[TOperation]['result'];

export interface VscFileRepoHookErrorOptions {
  operation: VscFileRepoOperation;
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class VscFileRepoHookError extends Error {
  readonly operation: VscFileRepoOperation;

  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: VscFileRepoHookErrorOptions) {
    super(options.message);
    this.name = 'VscFileRepoHookError';
    this.operation = options.operation;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface UseVscFileRepoResult {
  loading: VscFileRepoOperationState<boolean>;
  errors: VscFileRepoOperationState<VscFileRepoHookError>;
  pull(input: VscFileRepoPullInput): Promise<VscFileRepoPullResult>;
  getFile(input: VscFileRepoGetFileInput): Promise<VscFileRepoGetFileResult>;
  push(input: VscFileRepoPushInput): Promise<VscFileRepoPushResult>;
  listCommits(input: VscFileRepoListCommitsInput): Promise<VscCommitRecord[]>;
  diff(input: VscFileRepoDiffInput): Promise<VscFileRepoFileDiffResult>;
  diffFile(input: VscFileRepoDiffFileInput): Promise<VscFileRepoDiffFileResult>;
  restoreFile(input: VscFileRepoRestoreFileInput): Promise<VscFileRepoRestoreResult>;
  restoreCommit(input: VscFileRepoRestoreCommitInput): Promise<VscFileRepoRestoreResult>;
  listRefs(input: VscFileRepoListRefsInput): Promise<VscRefRecord[]>;
  updateRef(input: VscFileRepoUpdateRefInput): Promise<VscFileRepoUpdateRefResult>;
  isLoading(operation: VscFileRepoOperation): boolean;
  getError(operation: VscFileRepoOperation): VscFileRepoHookError | null;
  clearError(operation?: VscFileRepoOperation): void;
}

interface ResourceResponse<T> {
  data: T;
}

export function useVscFileRepo(): UseVscFileRepoResult {
  const ctx = useFlowContext();
  const t = useT();
  const requestIdsRef = useRef<VscFileRepoOperationState<number>>({});
  const [loadingCounts, setLoadingCounts] = useState<VscFileRepoOperationState<number>>({});
  const [errors, setErrors] = useState<VscFileRepoOperationState<VscFileRepoHookError>>({});

  const loading = useMemo<VscFileRepoOperationState<boolean>>(() => {
    return Object.fromEntries(
      vscFileRepoOperations.map((operation) => [operation, Boolean(loadingCounts[operation])]),
    ) as VscFileRepoOperationState<boolean>;
  }, [loadingCounts]);

  const clearError = useCallback((operation?: VscFileRepoOperation) => {
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
    async <TOperation extends VscFileRepoOperation>(
      operation: TOperation,
      input: VscFileRepoOperationInput<TOperation>,
    ): Promise<VscFileRepoOperationResult<TOperation>> => {
      const requestId = (requestIdsRef.current[operation] || 0) + 1;
      requestIdsRef.current[operation] = requestId;

      setLoadingCounts((current) => ({
        ...current,
        [operation]: (current[operation] || 0) + 1,
      }));
      clearError(operation);

      try {
        const response = await ctx.api.request<ResourceResponse<VscFileRepoOperationResult<TOperation>>>({
          url: `vscFile:${operation}`,
          method: 'post',
          data: input,
        });

        return response.data.data;
      } catch (error) {
        const hookError = normalizeRepoError(operation, error, t('VSC file request failed'));
        if (requestIdsRef.current[operation] === requestId) {
          setErrors((current) => ({
            ...current,
            [operation]: hookError,
          }));
        }
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

  return useMemo<UseVscFileRepoResult>(
    () => ({
      loading,
      errors,
      pull: (input) => requestOperation('pull', input),
      getFile: (input) => requestOperation('getFile', input),
      push: (input) => requestOperation('push', input),
      listCommits: (input) => requestOperation('listCommits', input),
      diff: (input) => requestOperation('diff', input),
      diffFile: (input) => requestOperation('diffFile', input),
      restoreFile: (input) => requestOperation('restoreFile', input),
      restoreCommit: (input) => requestOperation('restoreCommit', input),
      listRefs: (input) => requestOperation('listRefs', input),
      updateRef: (input) => requestOperation('updateRef', input),
      isLoading: (operation) => Boolean(loading[operation]),
      getError: (operation) => errors[operation] || null,
      clearError,
    }),
    [clearError, errors, loading, requestOperation],
  );
}

function normalizeRepoError(
  operation: VscFileRepoOperation,
  error: unknown,
  fallbackMessage: string,
): VscFileRepoHookError {
  const response = getRecordProperty(error, 'response');
  const responseData = response ? response.data : undefined;
  const serverError = getFirstServerError(responseData) || getFirstServerError(error);
  const message = toNonEmptyString(serverError?.message) || fallbackMessage;

  return new VscFileRepoHookError({
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
