import { RealtimeProtocolError } from '../protocol.js';

interface Waiting {
  start(this: void): void;
  cancel(this: void): void;
}

/** A timed-out callback keeps its slot until the underlying work actually stops. */
export function createAuthorizationGate(
  maxActive: number,
  maxWaiting: number,
): {
  readonly active: number;
  readonly waiting: number;
  run(
    callback: () => boolean | Promise<boolean>,
    signal: AbortSignal,
  ): Promise<boolean>;
} {
  let active = 0;
  const queue = new Set<Waiting>();
  function drain(): void {
    while (active < maxActive && queue.size) {
      const next = queue.values().next().value!;
      queue.delete(next);
      next.start();
    }
  }
  return {
    get active() {
      return active;
    },
    get waiting() {
      return queue.size;
    },
    run(callback, signal) {
      if (signal.aborted) return Promise.reject(cancelled());
      if (active >= maxActive && queue.size >= maxWaiting)
        return Promise.reject(
          new RealtimeProtocolError(
            'AUTHORIZATION_BUSY',
            'Realtime authorization capacity is exhausted.',
          ),
        );
      return new Promise<boolean>((resolve, reject) => {
        const item: Waiting = {
          cancel() {
            queue.delete(item);
            signal.removeEventListener('abort', item.cancel);
            reject(cancelled());
          },
          start() {
            signal.removeEventListener('abort', item.cancel);
            if (signal.aborted) {
              reject(cancelled());
              return;
            }
            active += 1;
            void Promise.resolve()
              .then(callback)
              .then(resolve, reject)
              .finally(() => {
                active -= 1;
                drain();
              });
          },
        };
        if (active < maxActive) item.start();
        else {
          queue.add(item);
          signal.addEventListener('abort', item.cancel, { once: true });
        }
      });
    },
  };
}

function cancelled(): RealtimeProtocolError {
  return new RealtimeProtocolError(
    'SUBSCRIPTION_CANCELLED',
    'Realtime authorization was cancelled.',
  );
}
