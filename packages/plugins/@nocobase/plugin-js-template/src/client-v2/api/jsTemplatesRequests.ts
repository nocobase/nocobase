/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  JsTemplate,
  JsTemplateCatalogEntry,
  JsTemplateProject,
  SaveAsJsTemplateInput,
  SaveAsJsTemplateResult,
  DetachJsTemplateToInlineInput,
  DetachJsTemplateToInlineResult,
  JsTemplateSelectableTemplateSummary,
  JsTemplateSelectableTemplatesInput,
  JsTemplateUsageListInput,
  JsTemplateUsageListResult,
  DeleteJsTemplateResult,
} from '../../shared/types';
import {
  getOrLoadJsTemplateSelectableCatalog,
  invalidateJsTemplateRuntimeCache,
} from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { invalidateJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';

export type ApiRequestOptions = {
  url: string;
  method?: string;
  data?: unknown;
  skipNotify?: boolean;
  signal?: AbortSignal;
};

export type ApiClientLike = {
  request: <TResponse>(options: ApiRequestOptions) => Promise<TResponse>;
};

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export async function listSelectableJsTemplates(
  api: ApiClientLike,
  input?: JsTemplateSelectableTemplatesInput,
): Promise<JsTemplateSelectableTemplateSummary[]> {
  return listSelectableTemplates(api, input);
}

export async function getJsTemplate(api: ApiClientLike, templateId: string): Promise<JsTemplate> {
  const response = await api.request<ResourceResponse<JsTemplate>>({
    url: 'jsTemplates:get',
    method: 'post',
    data: { templateId },
  });
  return unwrapResourceResponse(response);
}

export async function listJsTemplateCatalog(api: ApiClientLike): Promise<JsTemplateCatalogEntry[]> {
  const response = await api.request<ResourceResponse<JsTemplateCatalogEntry[]>>({
    url: 'jsTemplates:listCatalog',
    method: 'post',
  });
  return unwrapResourceResponse(response) || [];
}

export async function listJsTemplateProjects(api: ApiClientLike): Promise<JsTemplateProject[]> {
  const response = await api.request<ResourceResponse<JsTemplateProject[]>>({
    url: 'jsTemplateProjects:list',
    method: 'post',
  });
  return unwrapResourceResponse(response) || [];
}

export async function listJsTemplateUsageLocations(
  api: ApiClientLike,
  input: JsTemplateUsageListInput,
): Promise<JsTemplateUsageListResult> {
  const response = await api.request<ResourceResponse<JsTemplateUsageListResult>>({
    url: 'jsTemplateUsages:listUsages',
    method: 'post',
    data: input,
  });
  return unwrapResourceResponse(response);
}

export async function deleteJsTemplate(api: ApiClientLike, templateId: string): Promise<DeleteJsTemplateResult> {
  const response = await api.request<ResourceResponse<DeleteJsTemplateResult>>({
    url: 'jsTemplates:delete',
    method: 'post',
    data: { templateId },
  });
  const result = unwrapResourceResponse(response);
  invalidateJsTemplateSettingsDescriptorCache(api, result.project.id);
  invalidateJsTemplateRuntimeCache(api, result.project.id);
  return result;
}

export async function saveAsJsTemplate(
  api: ApiClientLike,
  input: SaveAsJsTemplateInput,
): Promise<SaveAsJsTemplateResult> {
  const response = await api.request<ResourceResponse<SaveAsJsTemplateResult>>({
    url: 'jsTemplates:saveAsJsTemplate',
    method: 'post',
    data: input,
  });
  const result = unwrapResourceResponse(response);
  invalidateJsTemplateSettingsDescriptorCache(api, result.project.id);
  invalidateJsTemplateRuntimeCache(api, result.project.id);
  return result;
}

export async function detachJsTemplateToInline(
  api: ApiClientLike,
  input: DetachJsTemplateToInlineInput,
): Promise<DetachJsTemplateToInlineResult> {
  const response = await api.request<ResourceResponse<DetachJsTemplateToInlineResult>>({
    url: 'jsTemplates:detachToInline',
    method: 'post',
    data: {
      idempotencyKey: input.idempotencyKey,
      locator: input.locator,
      projectId: input.projectId,
      templateId: input.templateId,
      expectedProjectHeadCommitId: input.expectedProjectHeadCommitId,
    },
  });
  const result = unwrapResourceResponse(response);
  invalidateJsTemplateSettingsDescriptorCache(api, input.projectId);
  invalidateJsTemplateRuntimeCache(api, input.projectId);
  return result;
}

async function listSelectableTemplates(
  api: ApiClientLike,
  input?: JsTemplateSelectableTemplatesInput,
): Promise<JsTemplateSelectableTemplateSummary[]> {
  const templates = await getOrLoadJsTemplateSelectableCatalog(api, async () => {
    const response = await api.request<ResourceResponse<JsTemplateSelectableTemplateSummary[]>>({
      url: 'jsTemplates:listSelectable',
      method: 'post',
    });
    return unwrapResourceResponse(response) || [];
  });
  return templates.filter(
    (template) =>
      (!input?.projectId || template.projectId === input.projectId) && (!input?.kind || template.kind === input.kind),
  );
}

export function unwrapResourceResponse<T>(response: ResourceResponse<T>): T {
  if (isRecord(response.data) && 'data' in response.data) {
    return response.data.data as T;
  }

  return response.data as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
