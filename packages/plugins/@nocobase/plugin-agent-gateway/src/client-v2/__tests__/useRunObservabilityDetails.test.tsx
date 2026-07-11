/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useRunObservabilityDetails } from '../hooks/useRunObservabilityDetails';
import { AgentGatewayApi, AgentGatewayApiResponse } from '../pages/AgentGatewayPageUtils';

type ApiRequestConfig = Parameters<AgentGatewayApi['request']>[0];

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: Error): void;
}

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => undefined;
  let rejectPromise: (error: Error) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
}

function createApi(request: (config: ApiRequestConfig) => Promise<AgentGatewayApiResponse<unknown>>): AgentGatewayApi {
  return {
    async request<T>(config: ApiRequestConfig) {
      return (await request(config)) as AgentGatewayApiResponse<T>;
    },
  };
}

const t = (key: string) => key;

describe('useRunObservabilityDetails', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not attach failed artifact requests to a newly selected run', async () => {
    const artifactsRequest = createDeferred<AgentGatewayApiResponse<unknown>>();
    const snapshotsRequest = createDeferred<AgentGatewayApiResponse<unknown>>();
    const request = vi.fn((config: ApiRequestConfig) => {
      if (config.url.endsWith('/artifacts:list')) {
        return artifactsRequest.promise;
      }
      if (config.url.endsWith('/snapshots:list')) {
        return snapshotsRequest.promise;
      }
      return Promise.resolve({ data: { data: [] } });
    });
    const api = createApi(request);
    const { result, rerender } = renderHook(
      ({ selectedRunId, run }) =>
        useRunObservabilityDetails({
          api,
          t,
          selectedRunId,
          run,
          enabled: true,
          activeTab: 'artifacts',
          conversationEnabled: true,
        }),
      {
        initialProps: {
          selectedRunId: 'run-a' as string | undefined,
          run: { id: 'run-a' } as { id: string } | undefined,
        },
      },
    );

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(2);
    });

    rerender({ selectedRunId: 'run-b', run: undefined });
    await act(async () => {
      artifactsRequest.reject(new Error('old artifacts failed'));
      snapshotsRequest.reject(new Error('old snapshots failed'));
      await Promise.resolve();
    });

    expect(result.current.artifacts.state).toBeNull();
  });

  it('does not expose a conversation error after the selected run changes', async () => {
    const conversationRequest = createDeferred<AgentGatewayApiResponse<unknown>>();
    const request = vi.fn((config: ApiRequestConfig) => {
      if (config.url.endsWith('/conversation-events:list')) {
        return conversationRequest.promise;
      }
      return Promise.resolve({ data: { data: [] } });
    });
    const api = createApi(request);
    const { result, rerender } = renderHook(
      ({ selectedRunId, run }) =>
        useRunObservabilityDetails({
          api,
          t,
          selectedRunId,
          run,
          enabled: true,
          activeTab: 'summary',
          conversationEnabled: true,
        }),
      {
        initialProps: {
          selectedRunId: 'run-a' as string | undefined,
          run: { id: 'run-a' } as { id: string } | undefined,
        },
      },
    );

    act(() => {
      result.current.conversation.refresh();
    });
    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(1);
    });

    rerender({ selectedRunId: 'run-b', run: undefined });
    await act(async () => {
      conversationRequest.reject(new Error('old conversation failed'));
      await Promise.resolve();
    });

    expect(result.current.conversation.state).toBeNull();
    expect(result.current.conversation.warning).toBeUndefined();
  });

  it('keeps the newest conversation response when requests overlap', async () => {
    const firstConversationRequest = createDeferred<AgentGatewayApiResponse<unknown>>();
    let conversationRequestCount = 0;
    const request = vi.fn((config: ApiRequestConfig) => {
      if (config.url.endsWith('/conversation-events:list')) {
        conversationRequestCount += 1;
        if (conversationRequestCount === 1) {
          return firstConversationRequest.promise;
        }
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'event-current',
                eventType: 'agent.message',
                contentText: 'current response',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
    const api = createApi(request);
    const { result } = renderHook(() =>
      useRunObservabilityDetails({
        api,
        t,
        selectedRunId: 'run-a',
        run: { id: 'run-a' },
        enabled: true,
        activeTab: 'summary',
        conversationEnabled: true,
      }),
    );

    act(() => {
      result.current.conversation.refresh();
    });
    await waitFor(() => {
      expect(conversationRequestCount).toBe(1);
    });
    act(() => {
      result.current.conversation.refresh();
    });
    await waitFor(() => {
      expect(result.current.conversation.state?.events).toEqual([
        expect.objectContaining({ id: 'event-current', contentText: 'current response' }),
      ]);
    });

    await act(async () => {
      firstConversationRequest.reject(new Error('superseded request failed'));
      await Promise.resolve();
    });
    expect(result.current.conversation.warning).toBeUndefined();
    expect(result.current.conversation.state?.events[0].id).toBe('event-current');
  });

  it('reports a request failure for the current run generation', async () => {
    const request = vi.fn((config: ApiRequestConfig) => {
      if (config.url.endsWith('/events:list')) {
        return Promise.reject(new Error('current events failed'));
      }
      return Promise.resolve({ data: { data: [] } });
    });
    const api = createApi(request);
    const { result } = renderHook(() =>
      useRunObservabilityDetails({
        api,
        t,
        selectedRunId: 'run-a',
        run: { id: 'run-a' },
        enabled: true,
        activeTab: 'logs',
        conversationEnabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.events.state?.warning).toBe('Events unavailable: current events failed');
    });
  });

  it('ignores artifact content failures from an earlier generation of the same run', async () => {
    const artifactContentRequest = createDeferred<AgentGatewayApiResponse<unknown>>();
    const request = vi.fn((config: ApiRequestConfig) => {
      if (config.url.endsWith('/artifacts/artifact-1:content')) {
        return artifactContentRequest.promise;
      }
      return Promise.resolve({ data: { data: [] } });
    });
    const api = createApi(request);
    const { result, rerender } = renderHook(
      ({ selectedRunId, run }) =>
        useRunObservabilityDetails({
          api,
          t,
          selectedRunId,
          run,
          enabled: true,
          activeTab: 'summary',
          conversationEnabled: true,
        }),
      {
        initialProps: {
          selectedRunId: 'run-a' as string | undefined,
          run: { id: 'run-a' } as { id: string } | undefined,
        },
      },
    );

    let loadPromise: Promise<void> | undefined;
    act(() => {
      loadPromise = result.current.artifacts.loadContent({ id: 'artifact-1' });
    });
    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(1);
    });

    rerender({ selectedRunId: 'run-b', run: undefined });
    rerender({ selectedRunId: 'run-a', run: { id: 'run-a' } });
    await act(async () => {
      artifactContentRequest.reject(new Error('old artifact content failed'));
      await loadPromise;
    });

    expect(result.current.artifacts.contentEntries).toEqual({});
  });

  it('does not continuously retry a failed artifact page', async () => {
    let artifactRequestCount = 0;
    const request = vi.fn((config: ApiRequestConfig) => {
      if (config.url.endsWith('/artifacts:list')) {
        artifactRequestCount += 1;
        if ((config.params as { page?: number } | undefined)?.page === 2) {
          return Promise.reject(new Error('page unavailable'));
        }
      }
      return Promise.resolve({
        data: {
          data: [],
          meta: {
            count: 40,
            page: 1,
            pageSize: 20,
            totalPage: 2,
          },
        },
      });
    });
    const api = createApi(request);
    const { result } = renderHook(() =>
      useRunObservabilityDetails({
        api,
        t,
        selectedRunId: 'run-a',
        run: { id: 'run-a' },
        enabled: true,
        activeTab: 'artifacts',
        conversationEnabled: true,
      }),
    );

    await waitFor(() => {
      expect(artifactRequestCount).toBe(1);
    });
    act(() => {
      result.current.artifacts.changeArtifactPage(2, 20);
    });
    await waitFor(() => {
      expect(result.current.artifacts.state?.warnings.artifacts).toBe('Artifacts unavailable: page unavailable');
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(artifactRequestCount).toBe(2);
  });

  it('preserves server cursor order when prepending older conversation events', async () => {
    const request = vi.fn((config: ApiRequestConfig) => {
      const params = config.params as { beforeCursor?: string } | undefined;
      return Promise.resolve({
        data: {
          data: params?.beforeCursor
            ? [
                { id: 'z-older', contentText: 'first', createdAt: '2026-01-01T00:00:00.000Z' },
                { id: 'a-older', contentText: 'second', createdAt: '2026-01-01T00:00:00.000Z' },
              ]
            : [
                { id: 'z-newer', contentText: 'third', createdAt: '2026-01-01T00:00:00.000Z' },
                { id: 'a-newer', contentText: 'fourth', createdAt: '2026-01-01T00:00:00.000Z' },
              ],
          meta: {
            pageSize: 2,
            beforeCursor: params?.beforeCursor ? 'before-older' : 'before-newer',
            afterCursor: 'after-newer',
            hasMoreBefore: false,
            hasMoreAfter: Boolean(params?.beforeCursor),
          },
        },
      });
    });
    const api = createApi(request);
    const { result } = renderHook(() =>
      useRunObservabilityDetails({
        api,
        t,
        selectedRunId: 'run-a',
        run: { id: 'run-a' },
        enabled: true,
        activeTab: 'summary',
        conversationEnabled: true,
      }),
    );

    act(() => {
      result.current.conversation.refresh();
    });
    await waitFor(() => {
      expect(result.current.conversation.state?.events).toHaveLength(2);
    });
    act(() => {
      result.current.conversation.loadOlder();
    });
    await waitFor(() => {
      expect(result.current.conversation.state?.events.map((event) => event.id)).toEqual([
        'z-older',
        'a-older',
        'z-newer',
        'a-newer',
      ]);
    });
  });
});
