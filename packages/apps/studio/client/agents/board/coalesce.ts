/**
 * Turns bursts of realtime announcements into few reads of one query: announcements within `delay` make one refetch,
 * at most one read is in flight (an announcement during a read makes one more after it), a read already in flight is
 * never cancelled (`cancelRefetch: false`), and nothing is read while the page is hidden: what was announced then is
 * read once the page shows again.
 */
import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** What the refresher reads of the page's visibility; `document` in the browser. */
export interface PageVisibility {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
}

export interface CoalescedRefresh {
  /** Something changed: read again, once for the burst. */
  readonly request: () => void;
  readonly stop: () => void;
}

export function coalescedRefresh(
  client: Pick<QueryClient, 'invalidateQueries' | 'isFetching'>,
  queryKey: QueryKey,
  delay: number,
  page: PageVisibility = document,
): CoalescedRefresh {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = false;
  let running = false;
  let stopped = false;
  const hidden = () => page.visibilityState === 'hidden';
  const read = () =>
    client.invalidateQueries({ queryKey }, { cancelRefetch: false });

  const schedule = () => {
    if (stopped || timer !== undefined || running) return;
    timer = setTimeout(() => {
      timer = undefined;
      void flush();
    }, delay);
  };

  async function flush(): Promise<void> {
    if (stopped) return;
    if (hidden()) return;
    pending = false;
    running = true;
    try {
      // A read under way may have started before the change: let it finish, then read once more.
      const busy = client.isFetching({ queryKey }) > 0;
      await read();
      if (busy && !stopped) await read();
    } catch {
      // The query reports its own failure.
    } finally {
      running = false;
    }
    if (pending) schedule();
  }

  const visibility = () => {
    if (!hidden() && pending) schedule();
  };
  page.addEventListener('visibilitychange', visibility);

  return {
    request() {
      pending = true;
      if (!hidden()) schedule();
    },
    stop() {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      page.removeEventListener('visibilitychange', visibility);
    },
  };
}
