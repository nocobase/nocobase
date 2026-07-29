/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LightExtensionCreateJobSummary } from '../../shared/types';
import { useLightExtensionCreateJobs } from '../hooks/useLightExtensionCreateJobs';

const mocks = vi.hoisted(() => ({
  api: { request: vi.fn() },
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({ api: mocks.api }),
}));

describe('useLightExtensionCreateJobs', () => {
  beforeEach(() => {
    mocks.api.request.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports an initial list failure and retries', async () => {
    vi.useFakeTimers();
    mocks.api.request
      .mockRejectedValueOnce(new Error('unsafe transport details'))
      .mockResolvedValueOnce({ data: { data: { jobs: [] } } });
    const { result } = renderHook(() => useLightExtensionCreateJobs());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toBe('Light extension creation job request failed');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('polls while a job is active and removes it when the server reports completion', async () => {
    vi.useFakeTimers();
    mocks.api.request
      .mockResolvedValueOnce({ data: { data: { jobs: [createJob()] } } })
      .mockResolvedValueOnce({ data: { data: { jobs: [] } } });
    const { result } = renderHook(() => useLightExtensionCreateJobs());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.jobs).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(result.current.jobs).toEqual([]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
  });

  it('shows an accepted job immediately and dismisses a failed job', async () => {
    mocks.api.request.mockImplementation((options: { url: string }) => {
      if (options.url.endsWith(':list')) {
        return Promise.resolve({ data: { data: { jobs: [] } } });
      }
      return Promise.resolve({ data: { data: { id: 'lecj_1' } } });
    });
    const { result } = renderHook(() => useLightExtensionCreateJobs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addAcceptedJob(createJob({ status: 'failed' }));
    });
    expect(result.current.jobs).toHaveLength(1);

    await act(async () => {
      await result.current.dismiss('lecj_1');
    });
    expect(result.current.jobs).toEqual([]);
  });

  it('aborts an in-flight request when unmounted', async () => {
    let requestSignal: AbortSignal | undefined;
    mocks.api.request.mockImplementation((options: { signal?: AbortSignal }) => {
      requestSignal = options.signal;
      return new Promise(() => undefined);
    });
    const { unmount } = renderHook(() => useLightExtensionCreateJobs());

    await act(async () => {
      await Promise.resolve();
    });
    expect(requestSignal?.aborted).toBe(false);

    unmount();

    expect(requestSignal?.aborted).toBe(true);
  });
});

function createJob(overrides: Partial<LightExtensionCreateJobSummary> = {}): LightExtensionCreateJobSummary {
  return {
    id: 'lecj_1',
    targetRepoId: 'ler_1',
    name: 'demo',
    title: 'Demo',
    description: null,
    sourceType: 'template',
    status: 'pending',
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:01.000Z',
    ...overrides,
  };
}
