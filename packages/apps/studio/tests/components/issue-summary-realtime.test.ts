import type { RealtimeClient, RealtimeListener } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { subscribeIssueRefresh } from '../../client/issues/live/realtime-refresh.js';
import { STUDIO_INBOX_TOPIC } from '../../shared/inbox.js';
import { createElement } from 'react';
import { Refine } from '@refinedev/core';
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
  useQueryClient,
} from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { pmKeys } from '@nocobase/app-plugin-projects/client/kit';

describe('live issue summaries', () => {
  it('updates the inner page cache for status, comments and run events with polling disabled', async () => {
    const outer = new QueryClient();
    let inner: QueryClient | undefined;
    function PageCache() {
      inner = useQueryClient();
      return null;
    }
    const view = render(
      createElement(
        QueryClientProvider,
        { client: outer },
        createElement(
          Refine,
          { options: { disableTelemetry: true } },
          createElement(PageCache),
        ),
      ),
    );
    expect(inner).toBeDefined();
    expect(inner).not.toBe(outer);
    const client = inner!;
    const listeners = new Map<string, RealtimeListener<unknown>>();
    const stop = subscribeIssueRefresh(
      {
        onOpen: () => () => {},
        subscribe: (topic, listener) => {
          listeners.set(topic, listener as RealtimeListener<unknown>);
          return () => listeners.delete(topic);
        },
      },
      client,
    );
    let statusKey = 'blocked';
    let content = 'The disk is full.';
    let running = false;
    const observe = (queryKey: readonly unknown[], read: () => unknown) => {
      const observer = new QueryObserver(client, {
        queryKey,
        queryFn: async () => read(),
        staleTime: Infinity,
        refetchInterval: false,
        retry: false,
      });
      const unsubscribe = observer.subscribe(() => {});
      return { observer, unsubscribe };
    };
    // Follow-ups uses the entity id; the standalone route can use the identifier.
    const details = ['issue-331', 'PM-331'].map((id) =>
      observe(pmKeys.issue(id), () => ({ statusKey })),
    );
    const threads = ['issue-331', 'PM-331'].map((id) =>
      observe([...pmKeys.issue(id), 'threads'], () => ({ content })),
    );
    const following = observe(['pm', 'issues', 'followUps'], () => ({
      statusKey,
      running,
    }));
    const progress = observe(['studio', 'issueProgress', 'issue-331'], () => ({
      running,
    }));
    const runs = observe(['studio', 'issue-runs', 'issue-331'], () => ({
      running,
    }));
    const queries = [...details, ...threads, following, progress, runs];
    const emit = () =>
      listeners.get(PM_REALTIME_TOPIC)?.({
        type: 'event',
        topic: PM_REALTIME_TOPIC,
        payload: { kind: 'pm.changed', domain: 'issues' },
        publishedAt: '2026-10-13T12:00:00Z',
      });
    try {
      await waitFor(() => {
        for (const { observer } of queries)
          expect(observer.getCurrentResult().isSuccess).toBe(true);
      });
      statusKey = 'in_progress';
      // The plugin's outer subscription cannot refresh the actual page queries.
      await outer.invalidateQueries({ queryKey: ['pm', 'issue'] });
      expect(details[0]!.observer.getCurrentResult().data).toEqual({
        statusKey: 'blocked',
      });
      emit();
      await waitFor(() => {
        for (const { observer } of details)
          expect(observer.getCurrentResult().data).toEqual({
            statusKey: 'in_progress',
          });
        expect(following.observer.getCurrentResult().data).toEqual({
          statusKey: 'in_progress',
          running: false,
        });
      });
      content = 'A new comment confirms the disk was restored.';
      emit();
      await waitFor(() => {
        for (const { observer } of threads)
          expect(observer.getCurrentResult().data).toEqual({ content });
      });
      for (const active of [true, false]) {
        running = active;
        emit();
        await waitFor(() => {
          for (const { observer } of [progress, runs])
            expect(observer.getCurrentResult().data).toEqual({
              running: active,
            });
          expect(following.observer.getCurrentResult().data).toEqual({
            statusKey: 'in_progress',
            running: active,
          });
        });
      }
    } finally {
      stop();
      for (const { unsubscribe } of queries) unsubscribe();
      view.unmount();
      client.clear();
      outer.clear();
    }
  });
  it('refreshes every projection on issue events, notice settlement and reconnect, and removes subscriptions', () => {
    const listeners = new Map<string, RealtimeListener<unknown>>();
    let opened = () => {};
    const stops = [vi.fn(), vi.fn(), vi.fn()];
    let next = 0;
    const realtime: Pick<RealtimeClient, 'subscribe' | 'onOpen'> = {
      subscribe: (topic, listener) => {
        listeners.set(topic, listener as RealtimeListener<unknown>);
        return stops[next++];
      },
      onOpen: (callback) => {
        opened = callback;
        return stops[next++];
      },
    };
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const stop = subscribeIssueRefresh(realtime, { invalidateQueries });
    const emit = (topic: string, payload: unknown) =>
      listeners.get(topic)?.({
        type: 'event',
        topic,
        payload,
        publishedAt: '2026-10-13T12:00:00Z',
      });
    emit(PM_REALTIME_TOPIC, { kind: 'pm.changed', domain: 'labels' });
    expect(invalidateQueries).not.toHaveBeenCalled();
    emit(PM_REALTIME_TOPIC, { kind: 'pm.changed', domain: 'issues' });
    for (const queryKey of [
      ['pm', 'issue'],
      ['studio', 'issueProgress'],
      ['studio', 'issue-runs'],
      ['studio', 'commentRunLimit'],
      ['studio', 'ownerHandoff'],
      ['pm', 'issues', 'followUps'],
    ])
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    expect(invalidateQueries).toHaveBeenCalledTimes(6);
    emit(STUDIO_INBOX_TOPIC, { kind: 'studio.inbox.changed' });
    opened();
    expect(invalidateQueries).toHaveBeenCalledTimes(18);
    stop();
    for (const unsubscribe of stops) expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
