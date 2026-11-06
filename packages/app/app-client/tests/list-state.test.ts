import { ApiClientError } from '@nocobase/api-client';
import { QueryObserver } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { createAppQueryClient } from '../src/query-client.js';
import { resolveListState } from '../src/list-state.js';

const failure = (status: number) =>
  new ApiClientError('Request failed', { status, method: 'GET', url: '/list' });

describe('list feedback from existing request snapshots', () => {
  it('distinguishes pending, successful empty, filtered empty and content', () => {
    expect(resolveListState({ isPending: true }, 0)).toBe('loading');
    expect(resolveListState({ data: [] }, 0)).toBe('empty');
    expect(resolveListState({ data: [] }, 0, true)).toBe('no-results');
    expect(resolveListState({ data: [1] }, 1)).toBe('ready');
    expect(resolveListState({ data: [1], isFetching: true }, 1)).toBe('ready');
  });

  it.each([new TypeError('Offline'), new Error('Timeout'), failure(500)])(
    'retains only same-query successful results on %s',
    (error) => {
      expect(resolveListState({ error }, 0)).toBe('failed');
      expect(resolveListState({ data: [], error }, 0)).toBe('refresh-failed');
      expect(resolveListState({ data: [1], error }, 1)).toBe('refresh-failed');
      expect(
        resolveListState({ data: [1], error, isPlaceholderData: true }, 1),
      ).toBe('failed');
    },
  );

  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
  ] as const)('hides cached data after HTTP %s', (status, expected) => {
    expect(
      resolveListState({ data: ['private'], error: failure(status) }, 1),
    ).toBe(expected);
  });

  it('uses the real query observer for placeholders, refresh failures, retries and late responses', async () => {
    const client = createAppQueryClient();
    client.setDefaultOptions({
      queries: { ...client.getDefaultOptions().queries, retry: false },
    });
    let error: unknown;
    let late!: (data: string[]) => void;
    const options = (key: string) => ({
      queryKey: ['list', key],
      queryFn: async () => {
        if (key === 'slow')
          return new Promise<string[]>((resolve) => {
            late = resolve;
          });
        if (error) throw error;
        return [key];
      },
    });
    const observer = new QueryObserver(client, options('first'));
    const close = observer.subscribe(() => undefined);
    const state = () =>
      resolveListState(
        observer.getCurrentResult(),
        observer.getCurrentResult().data?.length ?? 0,
      );
    try {
      await observer.refetch();
      expect(state()).toBe('ready');
      error = failure(500);
      await observer.refetch();
      expect(state()).toBe('refresh-failed');
      expect(observer.getCurrentResult().data).toEqual(['first']);
      error = undefined;
      await observer.refetch();
      expect(state()).toBe('ready');
      observer.setOptions(options('slow'));
      expect(observer.getCurrentResult().isPlaceholderData).toBe(true);
      expect(state()).toBe('loading');
      observer.setOptions(options('current'));
      await observer.refetch();
      late(['obsolete']);
      await Promise.resolve();
      expect(observer.getCurrentResult().data).toEqual(['current']);
      error = failure(403);
      await observer.refetch();
      expect(state()).toBe('forbidden');
    } finally {
      close();
      client.clear();
    }
  });
});
