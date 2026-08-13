/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { ApiClientLike } from '../api/jsTemplatesRequests';
import {
  dismissJsTemplateCreateJob,
  getJsTemplateCreateJob,
  listJsTemplateCreateJobs,
  retryJsTemplateCreateJob,
} from '../api/jsTemplateCreateJobRequests';

describe('js-template create-job requests', () => {
  it('uses only the safe create-job API actions', async () => {
    const request = vi.fn().mockResolvedValue({ data: { data: { jobs: [] } } });
    const api: ApiClientLike = { request };

    await listJsTemplateCreateJobs(api);
    request.mockResolvedValueOnce({ data: { data: { id: 'jtcj_1' } } });
    await getJsTemplateCreateJob(api, 'jtcj_1');
    request.mockResolvedValueOnce({ data: { data: { id: 'jtcj_1' } } });
    await retryJsTemplateCreateJob(api, 'jtcj_1');
    request.mockResolvedValueOnce({ data: { data: { id: 'jtcj_1' } } });
    await dismissJsTemplateCreateJob(api, 'jtcj_1');

    expect(request.mock.calls.map(([options]) => options.url)).toEqual([
      'jsTemplateCreateJobs:list',
      'jsTemplateCreateJobs:get',
      'jsTemplateCreateJobs:retry',
      'jsTemplateCreateJobs:dismiss',
    ]);
    expect(request.mock.calls.slice(1).map(([options]) => options.data)).toEqual([
      { jobId: 'jtcj_1' },
      { jobId: 'jtcj_1' },
      { jobId: 'jtcj_1' },
    ]);
    expect(JSON.stringify(request.mock.calls)).not.toContain('payload');
    expect(JSON.stringify(request.mock.calls)).not.toContain('authRef');
  });

  it('rejects an empty job ID before making a request', async () => {
    const request = vi.fn();
    const api: ApiClientLike = { request };

    await expect(dismissJsTemplateCreateJob(api, '')).rejects.toBeInstanceOf(TypeError);
    expect(request).not.toHaveBeenCalled();
  });
});
