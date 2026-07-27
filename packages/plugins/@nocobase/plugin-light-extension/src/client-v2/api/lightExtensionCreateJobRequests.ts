/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LightExtensionCreateJobDismissResult,
  LightExtensionCreateJobListResult,
  LightExtensionCreateJobRetryResult,
} from '../../shared/types';
import type { ApiClientLike } from './lightExtensionEntriesRequests';
import { unwrapResourceResponse } from './lightExtensionEntriesRequests';

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export async function listLightExtensionCreateJobs(
  api: ApiClientLike,
  signal?: AbortSignal,
): Promise<LightExtensionCreateJobListResult> {
  const response = await api.request<ResourceResponse<LightExtensionCreateJobListResult>>({
    url: 'lightExtensionCreateJobs:list',
    method: 'post',
    signal,
    skipNotify: true,
  });
  return unwrapResourceResponse(response);
}

export async function retryLightExtensionCreateJob(
  api: ApiClientLike,
  jobId: string,
): Promise<LightExtensionCreateJobRetryResult> {
  const response = await api.request<ResourceResponse<LightExtensionCreateJobRetryResult>>({
    url: 'lightExtensionCreateJobs:retry',
    method: 'post',
    data: { jobId: requireJobId(jobId) },
    skipNotify: true,
  });
  return unwrapResourceResponse(response);
}

export async function dismissLightExtensionCreateJob(
  api: ApiClientLike,
  jobId: string,
): Promise<LightExtensionCreateJobDismissResult> {
  const response = await api.request<ResourceResponse<LightExtensionCreateJobDismissResult>>({
    url: 'lightExtensionCreateJobs:dismiss',
    method: 'post',
    data: { jobId: requireJobId(jobId) },
    skipNotify: true,
  });
  return unwrapResourceResponse(response);
}

function requireJobId(jobId: string): string {
  const normalized = jobId.trim();
  if (!normalized) {
    throw new TypeError('Creation job ID is required');
  }
  return normalized;
}
