import type { RunEvent } from '@nocobase/agent-protocol';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { AgentsApi } from '../api/client.js';

export interface RunEventsState {
  readonly events: readonly RunEvent[];
  readonly loaded: boolean;
  readonly error: unknown;
}

/** How many events one request asks for; a full page means there may be more. */
export const EVENT_PAGE = 500;
/** How often an open run's transcript is fetched when no realtime announcement comes (other instances, lost signals). */
export const EVENT_POLL_MS = 5000;

/** Merges a batch into the list by `seq`; a repeated delivery is ignored. */
export function mergeRunEvents(
  current: readonly RunEvent[],
  batch: readonly RunEvent[],
): readonly RunEvent[] {
  if (batch.length === 0) return current;
  const bySeq = new Map(current.map((event) => [event.seq, event]));
  for (const event of batch) bySeq.set(event.seq, event);
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq);
}

/**
 * A run's transcript, fetched incrementally after the last `seq` seen (`GET /runs/:id/events?after=`).
 *
 * `fetchMore` is safe to call from anywhere (a realtime announcement, the poll, a button): concurrent calls collapse
 * into one request followed by one catch-up request, so nothing is fetched twice and nothing that arrives mid-request
 * is missed. While `polling`, the hook also fetches every `EVENT_POLL_MS`.
 */
export function useRunEvents(
  api: AgentsApi,
  runId: string,
  polling: boolean,
): RunEventsState & { readonly fetchMore: () => void } {
  const [state, setState] = useState<RunEventsState>({
    events: [],
    loaded: false,
    error: undefined,
  });
  const lastRef = useRef(0);
  const inflightRef = useRef(false);
  const againRef = useRef(false);
  const aliveRef = useRef(true);

  const fetchMore = useCallback((): void => {
    if (inflightRef.current) {
      againRef.current = true;
      return;
    }
    inflightRef.current = true;
    const run = async (): Promise<void> => {
      try {
        let full = false;
        do {
          againRef.current = false;
          const page = await api.runEvents(runId, lastRef.current, EVENT_PAGE);
          if (!aliveRef.current) return;
          lastRef.current = Math.max(lastRef.current, page.lastSeq);
          full = page.events.length >= EVENT_PAGE;
          setState((previous) => ({
            events: mergeRunEvents(previous.events, page.events),
            loaded: true,
            error: undefined,
          }));
        } while (againRef.current || full);
      } catch (error: unknown) {
        if (aliveRef.current)
          setState((previous) => ({ ...previous, loaded: true, error }));
      } finally {
        inflightRef.current = false;
      }
    };
    void run();
  }, [api, runId]);

  useEffect(() => {
    aliveRef.current = true;
    fetchMore();
    return () => {
      aliveRef.current = false;
    };
  }, [fetchMore]);

  useEffect(() => {
    if (!polling) return undefined;
    const timer = window.setInterval(fetchMore, EVENT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [polling, fetchMore]);

  return { ...state, fetchMore };
}
