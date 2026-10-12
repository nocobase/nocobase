import { useEffect, useEffectEvent } from 'react';

import type { EffectRun, RecordView } from './api.js';

/** How soon a running attempt is looked at again. */
const RUNNING_MS = 1_000;

/** How long to wait before looking at a pending run again. */
function delayFor(run: EffectRun, now: number): number {
  // A retry waits out its backoff: look again when it is due, not before.
  if (run.status === 'queued' && run.runAfter)
    return Math.max(Date.parse(run.runAfter) - now, 0) + 300;
  return RUNNING_MS;
}

/**
 * Reads the record again once while one of its effect runs is still queued
 * or running, when it is due, until none is. The runtime tells listeners
 * about transitions, not about an effect that finished without one — a
 * notification sent, an attempt that failed and will retry — so a page
 * that shows effect runs looks once more for exactly that, and stops as
 * soon as everything has settled.
 */
export function useFollowUp(
  view: RecordView | undefined,
  reload: () => Promise<void>,
): void {
  const pending = (view?.history.effectRuns ?? []).filter(
    (run) => run.status === 'queued' || run.status === 'running',
  );
  // What is pending, as a value an effect can depend on.
  const key = pending
    .map((run) => `${run.id}:${run.status}:${run.attempts}:${run.runAfter}`)
    .join(',');
  const lookAgain = useEffectEvent(() => void reload());
  useEffect(() => {
    if (!pending.length) return undefined;
    const now = Date.now();
    const delay = Math.min(...pending.map((run) => delayFor(run, now)));
    const timer = setTimeout(lookAgain, Math.max(delay, 300));
    return () => clearTimeout(timer);
    // `key` stands for `pending`.
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps
  }, [key]);
}
