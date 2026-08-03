/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LightExtensionEntryRecord,
  LightExtensionRepoRecord,
  LightExtensionMoveSourceInput,
  LightExtensionMoveSourceResult,
  LightExtensionMoveToInlineInput,
  LightExtensionMoveToInlineResult,
  LightExtensionSelectableEntrySummary,
  LightExtensionSelectableEntriesInput,
} from '../../shared/types';
import {
  getOrLoadLightExtensionSelectableCatalog,
  invalidateLightExtensionRuntimeCache,
} from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { invalidateLightExtensionSettingsDescriptorCache } from '../resolvers/LightExtensionSettingsDescriptorCache';
import { JS_TEMPLATE_RUNJS_HTTP_ALIASES } from '../jsTemplateRunJSIntegrationContract';

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

export async function listSelectableLightExtensionEntries(
  api: ApiClientLike,
  input?: LightExtensionSelectableEntriesInput,
): Promise<LightExtensionSelectableEntrySummary[]> {
  return listSelectableEntries(api, 'lightExtensionEntries:listSelectable', input);
}

export async function listSelectableJsTemplateEntries(
  api: ApiClientLike,
  input?: LightExtensionSelectableEntriesInput,
): Promise<LightExtensionSelectableEntrySummary[]> {
  return listSelectableEntries(api, JS_TEMPLATE_RUNJS_HTTP_ALIASES.listSelectableEntries, input);
}

export async function getLightExtensionEntry(api: ApiClientLike, entryId: string): Promise<LightExtensionEntryRecord> {
  return getEntry(api, 'lightExtensionEntries:get', entryId);
}

export async function getJsTemplateEntry(api: ApiClientLike, entryId: string): Promise<LightExtensionEntryRecord> {
  return getEntry(api, JS_TEMPLATE_RUNJS_HTTP_ALIASES.getEntry, entryId);
}

export async function listLightExtensionRepos(api: ApiClientLike): Promise<LightExtensionRepoRecord[]> {
  return listRepos(api, 'lightExtensionRepos:list');
}

export async function listJsTemplateRepos(api: ApiClientLike): Promise<LightExtensionRepoRecord[]> {
  return listRepos(api, JS_TEMPLATE_RUNJS_HTTP_ALIASES.listRepos);
}

export async function moveSourceToLightExtension(
  api: ApiClientLike,
  input: LightExtensionMoveSourceInput,
): Promise<LightExtensionMoveSourceResult> {
  return moveSource(api, 'lightExtensions:moveSource', input);
}

export async function moveSourceToJsTemplate(
  api: ApiClientLike,
  input: LightExtensionMoveSourceInput,
): Promise<LightExtensionMoveSourceResult> {
  return moveSource(api, JS_TEMPLATE_RUNJS_HTTP_ALIASES.moveSource, input);
}

export async function moveLightExtensionToInline(
  api: ApiClientLike,
  input: LightExtensionMoveToInlineInput,
): Promise<LightExtensionMoveToInlineResult> {
  return moveToInline(api, 'lightExtensions:moveToInline', input);
}

export async function moveJsTemplateToInline(
  api: ApiClientLike,
  input: LightExtensionMoveToInlineInput,
): Promise<LightExtensionMoveToInlineResult> {
  return moveToInline(api, JS_TEMPLATE_RUNJS_HTTP_ALIASES.moveToInline, input);
}

async function listSelectableEntries(
  api: ApiClientLike,
  url: string,
  input?: LightExtensionSelectableEntriesInput,
): Promise<LightExtensionSelectableEntrySummary[]> {
  const entries = await getOrLoadLightExtensionSelectableCatalog(api, async () => {
    const response = await api.request<ResourceResponse<LightExtensionSelectableEntrySummary[]>>({
      url,
      method: 'post',
    });
    return unwrapResourceResponse(response) || [];
  });
  return entries.filter(
    (entry) => (!input?.repoId || entry.repoId === input.repoId) && (!input?.kind || entry.kind === input.kind),
  );
}

async function getEntry(api: ApiClientLike, url: string, entryId: string): Promise<LightExtensionEntryRecord> {
  const response = await api.request<ResourceResponse<LightExtensionEntryRecord>>({
    url,
    method: 'post',
    data: { entryId },
  });
  return unwrapResourceResponse(response);
}

async function listRepos(api: ApiClientLike, url: string): Promise<LightExtensionRepoRecord[]> {
  const response = await api.request<ResourceResponse<LightExtensionRepoRecord[]>>({
    url,
    method: 'post',
  });
  return unwrapResourceResponse(response) || [];
}

async function moveSource(
  api: ApiClientLike,
  url: string,
  input: LightExtensionMoveSourceInput,
): Promise<LightExtensionMoveSourceResult> {
  const response = await api.request<ResourceResponse<LightExtensionMoveSourceResult>>({
    url,
    method: 'post',
    data: input,
  });
  const result = unwrapResourceResponse(response);
  invalidateLightExtensionSettingsDescriptorCache(api, result.repo.id);
  invalidateLightExtensionRuntimeCache(api, result.repo.id);
  return result;
}

async function moveToInline(
  api: ApiClientLike,
  url: string,
  input: LightExtensionMoveToInlineInput,
): Promise<LightExtensionMoveToInlineResult> {
  const response = await api.request<ResourceResponse<LightExtensionMoveToInlineResult>>({
    url,
    method: 'post',
    data: input,
  });

  const result = unwrapResourceResponse(response);
  invalidateLightExtensionSettingsDescriptorCache(api, input.repoId);
  invalidateLightExtensionRuntimeCache(api, input.repoId);
  return result;
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
