import { agentsKeys } from '../api/keys.js';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { agentsQueryClient } from '../query.js';

interface Subscription {
  readonly times: readonly number[];
  readonly update: (now: number) => void;
}
const subscriptions = new Set<Subscription>();
let currentTime = Date.now();
let timer: ReturnType<typeof setTimeout> | undefined;
function schedule(): void {
  if (timer) clearTimeout(timer);
  timer = undefined;
  const now = Date.now();
  const next = Math.min(
    ...[...subscriptions].flatMap((s) => s.times.filter((at) => at > now)),
  );
  if (!Number.isFinite(next)) return;
  timer = setTimeout(
    () => {
      const at = Date.now();
      currentTime = at;
      const due = [...subscriptions].filter((s) =>
        s.times.some((time) => time > now && time <= at),
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
        for (const subscriber of due) subscriber.update(at);
      }
      schedule();
    },
    Math.min(2147483647, Math.max(0, next - now + 25)),
  );
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
  const subscribe = useCallback(
    (changed: () => void) => {
      const subscription = {
        times: signature ? signature.split(',').map(Number) : [],
        update: changed,
      };
      subscriptions.add(subscription);
      schedule();
      return () => {
        subscriptions.delete(subscription);
        schedule();
      };
    },
    [signature],
  );
  const [mountedAt] = useState(() => Date.now());
  const snapshot = useCallback(
    () => Math.max(mountedAt, currentTime),
    [mountedAt],
  );
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
