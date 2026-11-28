import type { MessageResult } from './types.js';

/** Settles the message. Returning nothing from a handler does the same. */
export function ack(): MessageResult {
  return { kind: 'ack' };
}

/**
 * Retries the message, using `delay` in milliseconds when given. When `maxAttempts` is reached, the backend
 * settles it as a final failure. Throwing from a handler uses the subscription's retry delay.
 */
export function retry(
  options: { readonly delay?: number } = {},
): MessageResult {
  return options.delay === undefined
    ? { kind: 'retry' }
    : { kind: 'retry', delay: options.delay };
}

/** Marks the message as a final failure with the given reason, skipping retries. */
export function reject(reason: string): MessageResult {
  return { kind: 'reject', reason };
}
