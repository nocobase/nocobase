import { RealtimeProtocolError } from '../protocol.js';

export function positiveLimit(
  value: number | undefined,
  fallback: number,
): number {
  const limit = value ?? fallback;
  if (!Number.isSafeInteger(limit) || limit <= 0)
    throw new TypeError('Realtime limits must be positive integers.');
  return limit;
}

/** Snapshot strict JSON before the first asynchronous boundary. */
export function snapshotPayload(value: unknown): unknown {
  const ancestors = new Set<object>();
  function check(item: unknown): void {
    if (item === null || typeof item === 'string' || typeof item === 'boolean')
      return;
    if (typeof item === 'number' && Number.isFinite(item)) return;
    if (typeof item !== 'object' || item === null || ancestors.has(item)) {
      throw new RealtimeProtocolError(
        'INVALID_PAYLOAD',
        'Realtime payload must contain finite, acyclic JSON data.',
      );
    }
    if (
      !Array.isArray(item) &&
      Object.getPrototypeOf(item) !== Object.prototype &&
      Object.getPrototypeOf(item) !== null
    ) {
      throw new RealtimeProtocolError(
        'INVALID_PAYLOAD',
        'Realtime payload must contain plain JSON objects.',
      );
    }
    ancestors.add(item);
    const descriptors = Object.getOwnPropertyDescriptors(item);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (Array.isArray(item) && key === 'length') continue;
      const descriptor = descriptors[key as string];
      if (typeof key === 'symbol' || descriptor.get || descriptor.set) {
        throw new RealtimeProtocolError(
          'INVALID_PAYLOAD',
          'Realtime payload cannot contain symbols or accessors.',
        );
      }
      if (descriptor.enumerable) check(descriptor.value);
    }
    ancestors.delete(item);
  }
  check(value);
  return JSON.parse(JSON.stringify(value)) as unknown;
}

export async function authorizeWithin(
  authorize: (signal: AbortSignal) => boolean | Promise<boolean>,
  parent: AbortSignal,
  timeoutMs: number,
): Promise<boolean> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: () => void = () => undefined;
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => {
      controller.abort();
      reject(
        new RealtimeProtocolError(
          'SUBSCRIPTION_CANCELLED',
          'Realtime operation was cancelled.',
        ),
      );
    };
    parent.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new RealtimeProtocolError(
          'AUTHORIZATION_TIMEOUT',
          'Realtime authorization timed out.',
        ),
      );
    }, timeoutMs);
  });
  try {
    if (parent.aborted) abort();
    return await Promise.race([
      cancelled,
      Promise.resolve().then(() => {
        controller.signal.throwIfAborted();
        return authorize(controller.signal);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    parent.removeEventListener('abort', abort);
    controller.abort();
  }
}
