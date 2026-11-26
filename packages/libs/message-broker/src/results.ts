import type { MessageResult } from './types.js';

/** Settles the message. Returning nothing from a handler does the same. */
export function ack(): MessageResult {
  return { kind: 'ack' };
}

/**
 * Redelivers the message, after `delay` milliseconds when given; after `maxAttempts` deliveries it goes to the dead
 * letter instead. Throwing from a handler retries without a delay.
 */
export function retry(
  options: { readonly delay?: number } = {},
): MessageResult {
  return options.delay === undefined
    ? { kind: 'retry' }
    : { kind: 'retry', delay: options.delay };
}

/** Moves the message to the dead letter at once. */
export function reject(reason: string): MessageResult {
  return { kind: 'reject', reason };
}
