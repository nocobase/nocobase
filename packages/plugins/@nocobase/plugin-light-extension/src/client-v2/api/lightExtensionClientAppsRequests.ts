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
  entryHtml: string;
  fileCount: number;
  byteSize: number;
  updatedAt: string | null;
}

export interface LightExtensionClientAppReference {
  entryId: string;
  ownerKind: string;
  ownerId: string;
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
  expectedEntryId?: string,
): Promise<LightExtensionClientAppDescriptor> {
  const formData = new FormData();
  formData.append('repoId', repoId);
  if (expectedEntryId) {
    formData.append('expectedEntryId', expectedEntryId);
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
