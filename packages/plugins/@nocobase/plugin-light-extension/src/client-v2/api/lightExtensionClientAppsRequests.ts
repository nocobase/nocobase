/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ApiClientLike } from './lightExtensionEntriesRequests';
import { unwrapResourceResponse } from './lightExtensionEntriesRequests';

export interface LightExtensionClientAppDescriptor {
  entryId: string;
  repoId: string;
  key: string;
  kind: 'client-app';
  title: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[];
  sort: number | null;
  entryHtml: string;
  staticRoot: string;
  contentHash: string;
  fileCount: number;
  byteSize: number;
  updatedAt: string | null;
  healthStatus?: string;
  available: boolean;
  enabled: boolean;
  ready: boolean;
}

export interface LightExtensionClientAppReference {
  id?: string;
  repoId?: string;
  entryId?: string;
  ownerKind?: string;
  ownerId?: string;
  label?: string;
  title?: string;
  ownerLocator?: Record<string, unknown>;
}

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export async function listLightExtensionClientApps(
  api: ApiClientLike,
  repoId: string,
): Promise<LightExtensionClientAppDescriptor[]> {
  const response = await api.request<ResourceResponse<LightExtensionClientAppDescriptor[]>>({
    url: 'lightExtensionClientApps:list',
    method: 'post',
    data: { repoId },
    skipNotify: true,
  });

  return unwrapResourceResponse(response) || [];
}

export async function uploadLightExtensionClientApp(
  api: ApiClientLike,
  repoId: string,
  file: File,
  expected?: { entryId: string; contentHash: string },
): Promise<LightExtensionClientAppDescriptor> {
  const formData = new FormData();
  formData.append('repoId', repoId);
  if (expected) {
    formData.append('expectedEntryId', expected.entryId);
    formData.append('expectedContentHash', expected.contentHash);
  }
  formData.append('file', file, file.name);
  const response = await api.request<ResourceResponse<LightExtensionClientAppDescriptor>>({
    url: 'lightExtensionClientApps:upload',
    method: 'post',
    data: formData,
    skipNotify: true,
  });

  return unwrapResourceResponse(response);
}

export async function deleteLightExtensionClientApp(api: ApiClientLike, entryId: string): Promise<void> {
  await api.request({
    url: 'lightExtensionClientApps:delete',
    method: 'post',
    data: { entryId },
    skipNotify: true,
  });
}

export async function listLightExtensionClientAppReferences(
  api: ApiClientLike,
  entryId: string,
): Promise<LightExtensionClientAppReference[]> {
  const response = await api.request<ResourceResponse<LightExtensionClientAppReference[]>>({
    url: 'lightExtensionClientApps:listReferences',
    method: 'post',
    data: { entryId },
    skipNotify: true,
  });

  return unwrapResourceResponse(response) || [];
}
