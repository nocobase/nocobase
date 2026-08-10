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
import type { VscCommitDiffResult } from '@nocobase/runjs/workspace/shared';
import type {
  JsTemplateChangeLifecycleInput,
  JsTemplateCommitRecord,
  JsTemplateCreateJobAcceptedResult,
  JsTemplateCreateProjectInput,
  JsTemplateFileChange,
  JsTemplateInspectSourceArchiveInput,
  JsTemplateInspectSourceArchiveResult,
  JsTemplatePullResult,
  JsTemplateProject,
  JsTemplateSaveSourceResult,
  JsTemplateUpdateProjectInput,
  JsTemplateWorkspacePreviewInput,
  JsTemplateWorkspacePreviewResult,
} from '../../shared/types';
import { unwrapResourceResponse } from '../api/jsTemplatesRequests';
import { invalidateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { invalidateJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';

export type JsTemplateProjectOperation = keyof OperationInputMap;

interface JsTemplateHookErrorOptions {
  operation: JsTemplateProjectOperation;
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class JsTemplateHookError extends Error {
  readonly operation: JsTemplateProjectOperation;

  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: JsTemplateHookErrorOptions) {
    super(options.message);
    this.name = 'JsTemplateHookError';
    this.operation = options.operation;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface JsTemplatePullInput {
  projectId: string;
  ref?: string;
  knownTreeHash?: string;
  includeContent?: 'none' | 'selected' | 'all';
  selectedPaths?: string[];
}

export interface JsTemplatePullCommitInput {
  projectId: string;
  commitId: string;
  knownTreeHash?: string;
  includeContent?: 'none' | 'selected' | 'all';
  selectedPaths?: string[];
}

export interface JsTemplateListCommitsInput {
  projectId: string;
  limit?: number;
  beforeSeq?: number;
}

export interface JsTemplateDiffCommitsInput {
  projectId: string;
  fromCommitId: string;
  toCommitId: string;
}

export interface JsTemplateSaveSourceInput {
  projectId: string;
  expectedHeadCommitId: string | null;
  message: string;
  files: JsTemplateFileChange[];
}

export interface UseJsTemplateProjectResult {
  listProjects(): Promise<JsTemplateProject[]>;
  createProject(input: JsTemplateCreateProjectInput): Promise<JsTemplateCreateJobAcceptedResult>;
  getProject(projectId: string): Promise<JsTemplateProject>;
  updateProject(input: JsTemplateUpdateProjectInput): Promise<JsTemplateProject>;
  changeLifecycle(input: JsTemplateChangeLifecycleInput): Promise<JsTemplateProject>;
  deleteProject(projectId: string): Promise<JsTemplateProject>;
  inspectSourceArchive(input: JsTemplateInspectSourceArchiveInput): Promise<JsTemplateInspectSourceArchiveResult>;
  pull(input: JsTemplatePullInput): Promise<JsTemplatePullResult>;
  pullCommit(input: JsTemplatePullCommitInput): Promise<JsTemplatePullResult>;
  saveSource(input: JsTemplateSaveSourceInput): Promise<JsTemplateSaveSourceResult>;
  compileWorkspacePreview(input: JsTemplateWorkspacePreviewInput): Promise<JsTemplateWorkspacePreviewResult>;
  listCommits(input: JsTemplateListCommitsInput): Promise<JsTemplateCommitRecord[]>;
  diffCommits(input: JsTemplateDiffCommitsInput): Promise<VscCommitDiffResult>;
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
  listProjects: undefined;
  createProject: JsTemplateCreateProjectInput;
  getProject: { projectId: string };
  updateProject: JsTemplateUpdateProjectInput;
  changeLifecycle: JsTemplateChangeLifecycleInput;
  deleteProject: { projectId: string };
  inspectSourceArchive: JsTemplateInspectSourceArchiveInput;
  pull: JsTemplatePullInput;
  pullCommit: JsTemplatePullCommitInput;
  saveSource: JsTemplateSaveSourceInput;
  compileWorkspacePreview: JsTemplateWorkspacePreviewInput;
  listCommits: JsTemplateListCommitsInput;
  diffCommits: JsTemplateDiffCommitsInput;
};

type OperationResultMap = {
  listProjects: JsTemplateProject[];
  createProject: JsTemplateCreateJobAcceptedResult;
  getProject: JsTemplateProject;
  updateProject: JsTemplateProject;
  changeLifecycle: JsTemplateProject;
  deleteProject: JsTemplateProject;
  inspectSourceArchive: JsTemplateInspectSourceArchiveResult;
  pull: JsTemplatePullResult;
  pullCommit: JsTemplatePullResult;
  saveSource: JsTemplateSaveSourceResult;
  compileWorkspacePreview: JsTemplateWorkspacePreviewResult;
  listCommits: JsTemplateCommitRecord[];
  diffCommits: VscCommitDiffResult;
};

const operationResourceActions: Record<JsTemplateProjectOperation, string> = {
  listProjects: 'jsTemplateProjects:list',
  createProject: 'jsTemplateProjects:create',
  getProject: 'jsTemplateProjects:get',
  updateProject: 'jsTemplateProjects:updateMetadata',
  changeLifecycle: 'jsTemplateProjects:changeLifecycle',
  deleteProject: 'jsTemplateProjects:delete',
  inspectSourceArchive: 'jsTemplateProjects:inspectSourceArchive',
  pull: 'jsTemplateFiles:pull',
  pullCommit: 'jsTemplateFiles:pullCommit',
  saveSource: 'jsTemplateFiles:saveSource',
  compileWorkspacePreview: 'jsTemplates:compileWorkspacePreview',
  listCommits: 'jsTemplateFiles:listCommits',
  diffCommits: 'jsTemplateFiles:diff',
};

export function useJsTemplateProject(): UseJsTemplateProjectResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);

  const requestOperation = useCallback(
    async <TOperation extends JsTemplateProjectOperation>(
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
        throw normalizeJsTemplateError(operation, error, t('JS Template request failed'));
      }
    },
    [ctx.api, t],
  );

  const listProjects = useCallback(() => requestOperation('listProjects', undefined), [requestOperation]);
  const createProject = useCallback(
    (input: JsTemplateCreateProjectInput) => requestOperation('createProject', input),
    [requestOperation],
  );
  const getProject = useCallback(
    (projectId: string) => requestOperation('getProject', { projectId }),
    [requestOperation],
  );
  const updateProject = useCallback(
    async (input: JsTemplateUpdateProjectInput) => {
      const result = await requestOperation('updateProject', input);
      invalidateJsTemplateRuntimeCache(ctx.api, input.projectId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const changeLifecycle = useCallback(
    async (input: JsTemplateChangeLifecycleInput) => {
      const result = await requestOperation('changeLifecycle', input);
      invalidateJsTemplateSettingsDescriptorCache(ctx.api, input.projectId);
      invalidateJsTemplateRuntimeCache(ctx.api, input.projectId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const deleteProject = useCallback(
    async (projectId: string) => {
      const result = await requestOperation('deleteProject', { projectId });
      invalidateJsTemplateSettingsDescriptorCache(ctx.api, projectId);
      invalidateJsTemplateRuntimeCache(ctx.api, projectId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const inspectSourceArchive = useCallback(
    (input: JsTemplateInspectSourceArchiveInput) => requestOperation('inspectSourceArchive', input),
    [requestOperation],
  );
  const pull = useCallback((input: JsTemplatePullInput) => requestOperation('pull', input), [requestOperation]);
  const pullCommit = useCallback(
    (input: JsTemplatePullCommitInput) => requestOperation('pullCommit', input),
    [requestOperation],
  );
  const saveSource = useCallback(
    async (input: JsTemplateSaveSourceInput) => {
      const result = await requestOperation('saveSource', input);
      invalidateJsTemplateSettingsDescriptorCache(ctx.api, input.projectId);
      invalidateJsTemplateRuntimeCache(ctx.api, input.projectId);
      return result;
    },
    [ctx.api, requestOperation],
  );
  const compileWorkspacePreview = useCallback(
    (input: JsTemplateWorkspacePreviewInput) => requestOperation('compileWorkspacePreview', input),
    [requestOperation],
  );
  const listCommits = useCallback(
    (input: JsTemplateListCommitsInput) => requestOperation('listCommits', input),
    [requestOperation],
  );
  const diffCommits = useCallback(
    (input: JsTemplateDiffCommitsInput) => requestOperation('diffCommits', input),
    [requestOperation],
  );

  return useMemo<UseJsTemplateProjectResult>(
    () => ({
      listProjects,
      createProject,
      getProject,
      updateProject,
      changeLifecycle,
      deleteProject,
      inspectSourceArchive,
      pull,
      pullCommit,
      saveSource,
      compileWorkspacePreview,
      listCommits,
      diffCommits,
    }),
    [
      changeLifecycle,
      compileWorkspacePreview,
      createProject,
      deleteProject,
      getProject,
      inspectSourceArchive,
      listCommits,
      diffCommits,
      listProjects,
      pull,
      pullCommit,
      saveSource,
      updateProject,
    ],
  );
}

function isJsTemplateHookError(error: unknown): error is JsTemplateHookError {
  return error instanceof JsTemplateHookError;
}

function normalizeJsTemplateError(
  operation: JsTemplateProjectOperation,
  error: unknown,
  fallbackMessage: string,
): JsTemplateHookError {
  const response = getRecordProperty(error, 'response');
  const responseData = response ? response.data : undefined;
  const serverError = getFirstServerError(responseData) || getFirstServerError(error);
  const message = toNonEmptyString(serverError?.message) || fallbackMessage;

  return new JsTemplateHookError({
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

export function getJsTemplateErrorDiagnostics(error: unknown) {
  if (!isJsTemplateHookError(error)) {
    return [];
  }

  const diagnostics = error.details?.diagnostics;
  return Array.isArray(diagnostics) ? diagnostics : [];
}
