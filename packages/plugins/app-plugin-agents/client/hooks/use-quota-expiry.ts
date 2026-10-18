import { agentsKeys } from '../api/keys.js';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { agentsQueryClient } from '../query.js';

interface Subscription {
  readonly times: readonly number[];
  now: number;
  readonly update: (now: number) => void;
}
const subscriptions = new Set<Subscription>();
let timer: ReturnType<typeof setTimeout> | undefined;
function schedule(): void {
  if (timer) clearTimeout(timer);
  timer = undefined;
  const now = Date.now();
  // Replanning after a delayed timer must settle every overdue subscription first.
  const due = [...subscriptions].filter((s) =>
    s.times.some((time) => time > s.now && time <= now),
  );
  for (const subscriber of due) subscriber.now = now;
  const next = Math.min(
    ...[...subscriptions].flatMap((s) => s.times.filter((at) => at > now)),
  );
  if (Number.isFinite(next))
    timer = setTimeout(
      schedule,
      Math.min(2147483647, Math.max(0, next - now + 25)),
    );
  if (due.length) {
    // Quota eligibility affects these views, never transcripts, usage reports or skills.
    const cache = agentsQueryClient();
    void cache.invalidateQueries({
      predicate: ({ queryKey }) => {
        const prefixes = [
          agentsKeys.agents,
          agentsKeys.agent('').slice(0, -1),
          agentsKeys.available,
          agentsKeys.chatAgents,
          agentsKeys.runner('').slice(0, -1),
        ];
        return (
          (queryKey.length === agentsKeys.runners.length &&
            agentsKeys.runners.every((key, i) => queryKey[i] === key)) ||
          prefixes.some((prefix) =>
            prefix.every((key, i) => queryKey[i] === key),
          )
        );
      },
    });
    for (const subscriber of due)
      if (subscriptions.has(subscriber)) subscriber.update(now);
  }
}

/** A hook-local external snapshot, refreshed only by subscription changes or expiry. */
function createClock(signature: string): {
  readonly snapshot: () => number;
  readonly observe: (signature: string) => number;
  readonly advance: (now: number) => void;
} {
  let now = Date.now();
  let observed = signature;
  return {
    snapshot: () => now,
    observe: (signature) => {
      if (observed !== signature) {
        observed = signature;
        const at = Date.now();
        // A new future deadline needs no extra render; only missed boundaries advance the snapshot.
        if (
          signature
            .split(',')
            .some((time) => Number(time) > now && Number(time) <= at)
        )
          now = at;
      }
      return now;
    },
    advance: (at) => {
      now = at;
    },
  };
}

export function useQuotaClock(
  resets: readonly (string | null | undefined)[],
): number {
  const signature = [
    ...new Set(
      resets.flatMap((value) =>
        value && Number.isFinite(Date.parse(value)) ? [Date.parse(value)] : [],
      ),
    ),
  ]
    .sort((a, b) => a - b)
    .join(',');
  const [clock] = useState(() => createClock(signature));
  const subscribe = useCallback(
    (changed: () => void) => {
      const subscription = {
        times: signature ? signature.split(',').map(Number) : [],
        now: clock.observe(signature),
        update: (now: number) => {
          clock.advance(now);
          changed();
        },
      };
      subscriptions.add(subscription);
      schedule();
      return () => {
        subscriptions.delete(subscription);
        schedule();
      };
    },
    [clock, signature],
  );
  const snapshot = clock.snapshot;
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useQuotaExpiry(
  items: readonly {
    readonly quota?: readonly { readonly resetsAt: string | null }[];
  }[],
): void {
  useQuotaClock(
    items.flatMap((item) => (item.quota ?? []).map((q) => q.resetsAt)),
  );
}
