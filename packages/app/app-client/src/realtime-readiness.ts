import type { RealtimeClient, RealtimeEvent } from '@nocobase/realtime/client';

export interface ReadinessOptions {
  readonly onOpen?: () => void;
  readonly onRecovery?: () => void;
  readonly onPending?: () => void;
  readonly onEvent?: (topic: string, event: RealtimeEvent) => void;
}
export interface RealtimeReadiness {
  wait(this: void): Promise<void>;
  close(this: void): void;
}

/** One acknowledgement barrier; transport opening never authorizes a snapshot by itself. */
export function watchReadiness(
  realtime: Pick<RealtimeClient, 'watch'> &
    Partial<Pick<RealtimeClient, 'state' | 'onStateChange'>>,
  topics: readonly string[],
  options: ReadinessOptions = {},
): RealtimeReadiness {
  const names = [...new Set(topics)];
  const acknowledged = new Set<string>();
  let prepared = false;
  let synchronized = false;
  let fallback = false;
  let closed = false;
  let resolve = () => {};
  let gate = new Promise<void>((done) => {
    resolve = done;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const open = (offline: boolean, refused = false) => {
    if (closed || synchronized || (offline && fallback)) return;
    clearTimeout(timer);
    const recovery = prepared && (!offline || refused);
    fallback = offline;
    synchronized = !offline;
    // Recovery may invalidate a cached permission read before releasing new readers.
    if (recovery) options.onRecovery?.();
    resolve();
    if (!prepared) {
      prepared = true;
      options.onOpen?.();
    }
  };
  const arm = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => open(true), ms);
  };
  const pending = (topic: string) => {
    acknowledged.delete(topic);
    if (!synchronized && !fallback) return;
    synchronized = false;
    fallback = false;
    gate = new Promise<void>((done) => {
      resolve = done;
    });
    options.onPending?.();
    arm(1000);
  };
  const stopState = realtime.onStateChange?.((state) => {
    if (synchronized || closed) return;
    // Allow a slow first connection to finish before starting the acknowledgement timeout.
    // An unavailable connection still has a bounded HTTP escape hatch.
    arm(state === 'connecting' ? 10_000 : 1000);
  });
  arm(realtime.state === 'connecting' ? 10_000 : 1000);
  const subscriptions = names.map((topic) =>
    realtime.watch(topic, {
      onReady: () => {
        acknowledged.add(topic);
        if (acknowledged.size === names.length) open(false);
      },
      onStateChange: (state) => {
        if (state !== 'subscribed') pending(topic);
      },
      onError: () => open(true, true),
      onEvent: (event) => options.onEvent?.(topic, event),
    }),
  );
  if (!names.length) open(false);
  return {
    wait: () => gate,
    close: () => {
      closed = true;
      clearTimeout(timer);
      resolve();
      stopState?.();
      subscriptions.forEach((item) => item.close());
    },
  };
}
