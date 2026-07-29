/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { dismissLightExtensionCreateJob, listLightExtensionCreateJobs } from '../api/lightExtensionCreateJobRequests';

describe('light-extension create-job requests', () => {
  it('uses only the safe create-job facade actions', async () => {
    const request = vi.fn().mockResolvedValue({ data: { data: { jobs: [] } } });
    const api: ApiClientLike = { request };

    await listLightExtensionCreateJobs(api);
    request.mockResolvedValueOnce({ data: { data: { id: 'lecj_1' } } });
    await dismissLightExtensionCreateJob(api, 'lecj_1');

    expect(request.mock.calls.map(([options]) => options.url)).toEqual([
      'lightExtensionCreateJobs:list',
      'lightExtensionCreateJobs:dismiss',
    ]);
    expect(request.mock.calls[1][0]).toMatchObject({ data: { jobId: 'lecj_1' }, skipNotify: true });
    expect(JSON.stringify(request.mock.calls)).not.toContain('payload');
    expect(JSON.stringify(request.mock.calls)).not.toContain('authRef');
  });

  it('rejects an empty job ID before making a request', async () => {
    const request = vi.fn();
    const api: ApiClientLike = { request };

    await expect(dismissLightExtensionCreateJob(api, '')).rejects.toBeInstanceOf(TypeError);
    expect(request).not.toHaveBeenCalled();
  });
});
