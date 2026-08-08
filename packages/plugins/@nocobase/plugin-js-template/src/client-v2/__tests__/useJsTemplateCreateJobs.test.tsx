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

import type { JsTemplateCreateJobSummary } from '../../shared/types';
import { useJsTemplateCreateJobs } from '../hooks/useJsTemplateCreateJobs';

const mocks = vi.hoisted(() => ({
  api: { request: vi.fn() },
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({ api: mocks.api }),
}));

describe('useJsTemplateCreateJobs', () => {
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
    const { result } = renderHook(() => useJsTemplateCreateJobs());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toBe('JS Template creation job request failed');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('continues polling a terminal job until another tab dismisses it', async () => {
    vi.useFakeTimers();
    mocks.api.request
      .mockResolvedValueOnce({
        data: { data: { jobs: [createJob({ status: 'succeeded', resultProjectId: 'jtp_1' })] } },
      })
      .mockResolvedValueOnce({ data: { data: { jobs: [] } } });
    const { result } = renderHook(() => useJsTemplateCreateJobs());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.jobs).toEqual([expect.objectContaining({ status: 'succeeded', resultProjectId: 'jtp_1' })]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(result.current.jobs).toEqual([]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
  });

  it('synchronizes an explicit terminal dismissal across two hook instances', async () => {
    vi.useFakeTimers();
    let visibleJobs = [createJob({ status: 'failed', errorMessage: 'Safe failure' })];
    mocks.api.request.mockImplementation((options: { url: string }) => {
      if (options.url.endsWith(':dismiss')) {
        visibleJobs = [];
        return Promise.resolve({ data: { data: { id: 'jtcj_1' } } });
      }
      return Promise.resolve({ data: { data: { jobs: visibleJobs } } });
    });
    const first = renderHook(() => useJsTemplateCreateJobs());
    const second = renderHook(() => useJsTemplateCreateJobs());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(first.result.current.jobs).toHaveLength(1);
    expect(second.result.current.jobs).toHaveLength(1);

    await act(async () => {
      await first.result.current.dismiss('jtcj_1');
    });
    expect(first.result.current.jobs).toEqual([]);
    expect(second.result.current.jobs).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(second.result.current.jobs).toEqual([]);
  });

  it('shows an accepted job immediately and dismisses a failed job', async () => {
    mocks.api.request.mockImplementation((options: { url: string }) => {
      if (options.url.endsWith(':list')) {
        return Promise.resolve({ data: { data: { jobs: [] } } });
      }
      return Promise.resolve({ data: { data: { id: 'jtcj_1' } } });
    });
    const { result } = renderHook(() => useJsTemplateCreateJobs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addAcceptedJob(createJob({ status: 'failed' }));
    });
    expect(result.current.jobs).toHaveLength(1);

    await act(async () => {
      await result.current.dismiss('jtcj_1');
    });
    expect(result.current.jobs).toEqual([]);
  });

  it('aborts an in-flight request when unmounted', async () => {
    let requestSignal: AbortSignal | undefined;
    mocks.api.request.mockImplementation((options: { signal?: AbortSignal }) => {
      requestSignal = options.signal;
      return new Promise(() => undefined);
    });
    const { unmount } = renderHook(() => useJsTemplateCreateJobs());

    await act(async () => {
      await Promise.resolve();
    });
    expect(requestSignal?.aborted).toBe(false);

    unmount();

    expect(requestSignal?.aborted).toBe(true);
  });
});

function createJob(overrides: Partial<JsTemplateCreateJobSummary> = {}): JsTemplateCreateJobSummary {
  return {
    id: 'jtcj_1',
    targetProjectId: 'jtp_1',
    name: 'demo',
    title: 'Demo',
    description: null,
    sourceType: 'starter',
    status: 'pending',
    resultProjectId: null,
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:01.000Z',
    ...overrides,
  };
}
