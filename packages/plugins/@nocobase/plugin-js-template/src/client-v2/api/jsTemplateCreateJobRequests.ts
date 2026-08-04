/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplateCreateJobDismissResult, JsTemplateCreateJobListResult } from '../../shared/types';
import type { ApiClientLike } from './jsTemplatesRequests';
import { unwrapResourceResponse } from './jsTemplatesRequests';

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export async function listJsTemplateCreateJobs(
  api: ApiClientLike,
  signal?: AbortSignal,
): Promise<JsTemplateCreateJobListResult> {
  const response = await api.request<ResourceResponse<JsTemplateCreateJobListResult>>({
    url: 'jsTemplateCreateJobs:list',
    method: 'post',
    signal,
    skipNotify: true,
  });
  return unwrapResourceResponse(response);
}

export async function dismissJsTemplateCreateJob(
  api: ApiClientLike,
  jobId: string,
): Promise<JsTemplateCreateJobDismissResult> {
  const response = await api.request<ResourceResponse<JsTemplateCreateJobDismissResult>>({
    url: 'jsTemplateCreateJobs:dismiss',
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
