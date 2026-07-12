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
  LightExtensionSelectableEntryRecord,
  LightExtensionSelectableEntriesInput,
} from '../../shared/types';

export type ApiRequestOptions = {
  url: string;
  method?: string;
  data?: unknown;
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
): Promise<LightExtensionSelectableEntryRecord[]> {
  const response = await api.request<ResourceResponse<LightExtensionSelectableEntryRecord[]>>({
    url: 'lightExtensionEntries:listSelectable',
    method: 'post',
    data: input,
  });

  return unwrapResourceResponse(response) || [];
}

export async function getLightExtensionEntry(api: ApiClientLike, entryId: string): Promise<LightExtensionEntryRecord> {
  const response = await api.request<ResourceResponse<LightExtensionEntryRecord>>({
    url: 'lightExtensionEntries:get',
    method: 'post',
    data: { entryId },
  });

  return unwrapResourceResponse(response);
}

export async function listLightExtensionRepos(api: ApiClientLike): Promise<LightExtensionRepoRecord[]> {
  const response = await api.request<ResourceResponse<LightExtensionRepoRecord[]>>({
    url: 'lightExtensionRepos:list',
    method: 'post',
  });

  return unwrapResourceResponse(response) || [];
}

export async function moveSourceToLightExtension(
  api: ApiClientLike,
  input: LightExtensionMoveSourceInput,
): Promise<LightExtensionMoveSourceResult> {
  const response = await api.request<ResourceResponse<LightExtensionMoveSourceResult>>({
    url: 'lightExtensions:moveSource',
    method: 'post',
    data: input,
  });

  return unwrapResourceResponse(response);
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
