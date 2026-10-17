import { useEffect, useState } from 'react';
import { agentsQueryClient } from '../query.js';
import { agentsKeys } from '../api/keys.js';

/** Recompute visible quota state at a known reset, without a periodic request. */
export function useQuotaClock(
  resets: readonly (string | null | undefined)[],
): number {
  const [now, setNow] = useState(() => Date.now());
  const next = resets
    .flatMap((reset) =>
      reset && Date.parse(reset) > now ? [Date.parse(reset)] : [],
    )
    .sort((a, b) => a - b)[0];
  useEffect(() => {
    if (!next) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(2147483647, Math.max(0, next - Date.now() + 100)),
    );
    return () => clearTimeout(timer);
  }, [next, now]);
  return now;
}

// A page may render several pickers over the same cache. One reset invalidates it once.
const scheduled = new Map<
  number,
  { users: number; timer: ReturnType<typeof setTimeout> }
>();
function subscribeReset(at: number): () => void {
  let entry = scheduled.get(at);
  if (!entry) {
    const refresh = (): void => {
      const remaining = at - Date.now();
      const pending = scheduled.get(at);
      if (!pending) return;
      if (remaining > 0) {
        pending.timer = setTimeout(
          refresh,
          Math.min(2147483647, remaining + 100),
        );
        return;
      }
      scheduled.delete(at);
      void agentsQueryClient().invalidateQueries({ queryKey: agentsKeys.all });
    };
    entry = {
      users: 0,
      timer: setTimeout(
        refresh,
        Math.min(2147483647, Math.max(0, at - Date.now() + 100)),
      ),
    };
    scheduled.set(at, entry);
  }
  entry.users++;
  const subscription = entry;
  return () => {
    subscription.users--;
    if (subscription.users === 0 && scheduled.get(at) === subscription) {
      clearTimeout(subscription.timer);
      scheduled.delete(at);
    }
  };
}

export function useQuotaExpiry(
  items: readonly {
    readonly quota?: readonly { readonly resetsAt: string | null }[];
  }[],
): void {
  useEffect(() => {
    const now = Date.now();
    const next = items
      .flatMap((item) => item.quota ?? [])
      .flatMap((q) =>
        q.resetsAt && Date.parse(q.resetsAt) > now
          ? [Date.parse(q.resetsAt)]
          : [],
      )
      .sort((a, b) => a - b)[0];
    return next ? subscribeReset(next) : undefined;
  }, [items]);
}
