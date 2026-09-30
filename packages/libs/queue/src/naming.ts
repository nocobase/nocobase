import { createHash } from 'node:crypto';

const MAX_NAME_BYTES = 256;
// eslint-disable-next-line no-control-regex -- control characters are exactly what is rejected
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;

/**
 * Namespaces and logical queue names are used as given: never trimmed or
 * case-folded, and encoded before they reach a key or a file name.
 */
export function assertQueueName(
  label: 'namespace' | 'queue name',
  value: unknown,
): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    CONTROL_CHARACTERS.test(value) ||
    Buffer.byteLength(value, 'utf8') > MAX_NAME_BYTES
  ) {
    throw new TypeError(
      `Invalid queue ${label} ${JSON.stringify(value)}: use a non-blank string without control characters, at most ${MAX_NAME_BYTES} UTF-8 bytes long.`,
    );
  }
}

/** The input every persistent backend derives a queue's physical identity from. */
export function queueIdentity(namespace: string, queue: string): string {
  return JSON.stringify([namespace, queue]);
}

export interface RedisQueueIdentity {
  /** BullMQ `prefix`: a hash tag keeps every key of the queue in one Cluster slot. */
  readonly prefix: string;
  /** BullMQ queue name. */
  readonly name: string;
}

export function redisQueueIdentity(
  namespace: string,
  queue: string,
): RedisQueueIdentity {
  const digest = createHash('sha256')
    .update(queueIdentity(namespace, queue))
    .digest('hex');
  return {
    prefix: `nbq:{${digest}}`,
    name: `q-${Buffer.from(queue, 'utf8').toString('base64url')}`,
  };
}
