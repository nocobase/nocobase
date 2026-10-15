import { RUNNERS_TOPIC } from '@nocobase/app-plugin-agents/shared/realtime';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AGENT_BOARD_COALESCE_MS,
  agentBoardKeys,
  subscribeAgentBoardRefresh,
} from '../../client/agents/board/api.js';
import {
  coalescedRefresh,
  type PageVisibility,
} from '../../client/agents/board/coalesce.js';

/** A page whose visibility the test turns. */
function page(): PageVisibility & { show(visible: boolean): void } {
  const listeners = new Set<() => void>();
  const state = { value: 'visible' as DocumentVisibilityState };
  return {
    get visibilityState() {
      return state.value;
    },
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
    show(visible) {
      state.value = visible ? 'visible' : 'hidden';
      for (const listener of listeners) listener();
    },
  };
}

/** A query client whose reads stay in flight until `finish`. */
function client() {
  let fetching = 0;
  const pending: (() => void)[] = [];
  const invalidateQueries = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        fetching += 1;
        pending.push(() => {
          fetching -= 1;
          resolve();
        });
      }),
  );
  return {
    invalidateQueries,
    isFetching: () => fetching,
    async finish() {
      for (const done of pending.splice(0)) done();
      await vi.advanceTimersByTimeAsync(0);
    },
  };
}

function realtime() {
  const topics = new Map<string, () => void>();
  let open: (() => void) | undefined;
  return {
    subscribe: (topic: string, callback: () => void) => {
      topics.set(topic, callback);
      return () => topics.delete(topic);
    },
    onOpen: (callback: () => void) => {
      open = callback;
      return () => (open = undefined);
    },
    emit: (topic: string) => topics.get(topic)?.(),
    reopen: () => open?.(),
    topics,
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the Agent queue refresh', () => {
  it('reads once for a burst of announcements, never cancelling a read', async () => {
    const queries = client();
    const live = realtime();
    const stop = subscribeAgentBoardRefresh(
      live,
      coalescedRefresh(
        queries,
        agentBoardKeys.all,
        AGENT_BOARD_COALESCE_MS,
        page(),
      ),
    );
    for (let i = 0; i < 5; i += 1) {
      live.emit(PM_REALTIME_TOPIC);
      live.emit(RUNNERS_TOPIC);
    }
    live.reopen();
    await vi.advanceTimersByTimeAsync(AGENT_BOARD_COALESCE_MS);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queries.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: agentBoardKeys.all },
      { cancelRefetch: false },
    );

    // Announcements during the read make one more read, after it.
    live.emit(PM_REALTIME_TOPIC);
    live.emit(RUNNERS_TOPIC);
    await vi.advanceTimersByTimeAsync(AGENT_BOARD_COALESCE_MS * 3);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(1);
    await queries.finish();
    await vi.advanceTimersByTimeAsync(AGENT_BOARD_COALESCE_MS);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(2);
    await queries.finish();
    await vi.advanceTimersByTimeAsync(AGENT_BOARD_COALESCE_MS * 3);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(2);

    stop();
    expect(live.topics.size).toBe(0);
    live.emit(PM_REALTIME_TOPIC);
    await vi.advanceTimersByTimeAsync(AGENT_BOARD_COALESCE_MS * 3);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(2);
  });

  it('waits for a read already under way, then reads once more', async () => {
    const queries = client();
    const refresh = coalescedRefresh(queries, ['k'], 100, page());
    // A poll is under way when the announcement is read.
    void queries.invalidateQueries();
    queries.invalidateQueries.mockClear();
    refresh.request();
    await vi.advanceTimersByTimeAsync(100);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(1);
    await queries.finish();
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(2);
    await queries.finish();
    refresh.stop();
  });

  it('reads nothing while the page is hidden, and once when it shows again', async () => {
    const queries = client();
    const visibility = page();
    const refresh = coalescedRefresh(queries, ['k'], 100, visibility);
    visibility.show(false);
    refresh.request();
    refresh.request();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(queries.invalidateQueries).not.toHaveBeenCalled();
    visibility.show(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(1);
    await queries.finish();
    // Hidden during the gathering: the read waits for the page too.
    refresh.request();
    visibility.show(false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(1);
    visibility.show(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(queries.invalidateQueries).toHaveBeenCalledTimes(2);
    refresh.stop();
  });
});
