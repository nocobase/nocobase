import type { RealtimeClient, RealtimeListener } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { subscribeIssueRefresh } from '../../client/issues/live/realtime-refresh.js';
import { STUDIO_INBOX_TOPIC } from '../../shared/inbox.js';

describe('live issue summaries', () => {
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
      ['studio', 'issueProgress'],
      ['studio', 'issue-runs'],
      ['studio', 'commentRunLimit'],
      ['studio', 'ownerHandoff'],
      ['pm', 'issues', 'followUps'],
    ])
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    expect(invalidateQueries).toHaveBeenCalledTimes(5);
    emit(STUDIO_INBOX_TOPIC, { kind: 'studio.inbox.changed' });
    opened();
    expect(invalidateQueries).toHaveBeenCalledTimes(15);
    stop();
    for (const unsubscribe of stops) expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
