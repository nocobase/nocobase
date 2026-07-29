/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIClient } from '@nocobase/client-v2';
import type { Attachment, UploadAIFileOptions } from '../types';
import { normalizeAIFileUploadAttachment } from './utils';

type AIFileUploadRequestOptions = UploadAIFileOptions & {
  action?: string;
  data?: Record<string, string | Blob>;
  fieldName?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
};

type AIFileUploadResponse = {
  data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function readUploadedAttachment(response: unknown): Attachment | null {
  if (!isRecord(response)) {
    return null;
  }
  const body = response as AIFileUploadResponse;
  return isRecord(body.data) ? (body.data as Attachment) : null;
}

export async function uploadAIFile(
  apiClient: Pick<APIClient, 'request'>,
  file: Blob,
  options: AIFileUploadRequestOptions = {},
): Promise<Attachment> {
  const { action = 'aiFiles:create', data, fieldName = 'file', headers, onProgress, signal, withCredentials } = options;
  const formData = new FormData();
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  formData.append(fieldName, file);

  const response = await apiClient.request({
    url: action,
    method: 'post',
    data: formData,
    headers,
    signal,
    withCredentials,
    onUploadProgress: ({ loaded, total }) => {
      if (!onProgress || typeof total !== 'number' || total <= 0) {
        return;
      }
      onProgress(Math.min(100, Math.round((loaded / total) * 100)));
    },
  });
  const attachment = readUploadedAttachment(response.data);
  if (!attachment) {
    throw new Error('AI file upload response did not contain attachment data.');
  }
  return normalizeAIFileUploadAttachment(attachment, 'done');
}
