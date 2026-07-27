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
import {
  mergeCreationJobs,
  reconcileCreationJobs,
  useLightExtensionCreateJobs,
} from '../hooks/useLightExtensionCreateJobs';

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

  it('keeps a newer locally accepted summary when an older poll arrives', () => {
    const newer = createJob({ updatedAt: '2026-07-27T00:00:02.000Z', status: 'running' });
    const older = createJob({ updatedAt: '2026-07-27T00:00:01.000Z', status: 'pending' });

    expect(mergeCreationJobs([newer], [older])).toEqual([newer]);
  });

  it('removes an accepted job omitted by the first authoritative request started after acceptance', () => {
    const local = createJob({ updatedAt: '2026-07-27T00:00:02.000Z' });
    const accepted = new Set([local.id]);
    const acceptedAtRequestStart = new Set(accepted);

    expect(reconcileCreationJobs([local], [], accepted, acceptedAtRequestStart)).toEqual([]);
    expect(accepted).toEqual(new Set());
  });

  it('retains a job accepted during an already-running authoritative request', () => {
    const local = createJob({ updatedAt: '2026-07-27T00:00:02.000Z' });
    const accepted = new Set([local.id]);

    expect(reconcileCreationJobs([local], [], accepted, new Set())).toEqual([local]);
    expect(accepted).toEqual(new Set([local.id]));
  });

  it('removes a retained job when a later authoritative request still omits it', () => {
    const local = createJob({ updatedAt: '2026-07-27T00:00:02.000Z' });
    const accepted = new Set([local.id]);

    expect(reconcileCreationJobs([local], [], accepted, new Set())).toEqual([local]);
    expect(reconcileCreationJobs([local], [], accepted, new Set(accepted))).toEqual([]);
    expect(accepted).toEqual(new Set());
  });

  it('reports an initial list failure and retries even without a locally active job', async () => {
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

  it('polls only while active, prevents overlapping list requests, and stops after failure', async () => {
    vi.useFakeTimers();
    let resolvePoll: ((value: unknown) => void) | undefined;
    mocks.api.request.mockResolvedValueOnce({ data: { data: { jobs: [createJob()] } } }).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePoll = resolve;
        }),
    );
    const { result } = renderHook(() => useLightExtensionCreateJobs());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.jobs).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(mocks.api.request).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvePoll?.({
        data: {
          data: {
            jobs: [
              createJob({
                status: 'failed',
                errorCode: 'LIGHT_EXTENSION_CREATE_FAILED',
                errorMessage: 'Safe failure',
                canRetry: true,
                canDismiss: true,
                updatedAt: '2026-07-27T00:00:02.000Z',
              }),
            ],
          },
        },
      });
      await Promise.resolve();
    });
    expect(result.current.jobs[0].status).toBe('failed');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(mocks.api.request).toHaveBeenCalledTimes(2);
  });

  it('retries and dismisses through the facade while updating local rows', async () => {
    const failed = createJob({ status: 'failed', canRetry: true, canDismiss: true });
    const pending = createJob({ status: 'pending', updatedAt: '2026-07-27T00:00:02.000Z' });
    mocks.api.request.mockImplementation((options: { url: string }) => {
      if (options.url.endsWith(':list')) {
        return Promise.resolve({ data: { data: { jobs: [failed] } } });
      }
      if (options.url.endsWith(':retry')) {
        return Promise.resolve({ data: { data: pending } });
      }
      return Promise.resolve({ data: { data: { id: failed.id } } });
    });
    const { result } = renderHook(() => useLightExtensionCreateJobs());
    await waitFor(() => expect(result.current.jobs[0]?.status).toBe('failed'));

    await act(async () => {
      await result.current.retry(failed.id);
    });
    expect(result.current.jobs[0].status).toBe('pending');

    await act(async () => {
      await result.current.dismiss(failed.id);
    });
    expect(result.current.jobs).toEqual([]);
  });

  it('aborts an in-flight poll when unmounted', async () => {
    vi.useFakeTimers();
    let pollSignal: AbortSignal | undefined;
    mocks.api.request
      .mockResolvedValueOnce({ data: { data: { jobs: [createJob()] } } })
      .mockImplementationOnce((options: { signal?: AbortSignal }) => {
        pollSignal = options.signal;
        return new Promise(() => undefined);
      });
    const { result, unmount } = renderHook(() => useLightExtensionCreateJobs());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.jobs).toHaveLength(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(pollSignal?.aborted).toBe(false);

    unmount();

    expect(pollSignal?.aborted).toBe(true);
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
    resultRepoId: null,
    errorCode: null,
    errorMessage: null,
    canRetry: false,
    canDismiss: false,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:01.000Z',
    ...overrides,
  };
}
