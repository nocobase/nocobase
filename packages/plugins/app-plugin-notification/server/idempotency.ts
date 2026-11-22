import { createHash } from 'node:crypto';

import type { NotificationChannelMap, NotificationSendInput } from './types.js';

const IDEMPOTENCY_KEY_MAX_LENGTH = 191;

export function validateNotificationIdempotencyKey(value: string): void {
  if (typeof value !== 'string' || !value || value !== value.trim()) {
    throw new Error(
      'Notification idempotencyKey must be a non-empty trimmed string.',
    );
  }
  if (value.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new Error(
      `Notification idempotencyKey must not exceed ${IDEMPOTENCY_KEY_MAX_LENGTH} characters.`,
    );
  }
}

export function notificationRequestFingerprint<
  TChannels extends NotificationChannelMap,
>(input: NotificationSendInput<TChannels>): string {
  const canonical = normalizeValue({
    source: {
      type: input.source?.type ?? 'application',
      referenceId: input.source?.referenceId,
    },
    messages: input.messages,
  });
  return `v2:${createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex')}`;
}

/**
 * What makes two `notify()` calls the same request: the kind, the people, the data, the target and the source. The
 * messages are left out on purpose, because they follow each person's preferences and language at the time of the
 * first call: a repeat after a preference changed is still the same request and returns the first send.
 */
export function notifyRequestFingerprint(input: {
  readonly kind: string;
  readonly to: readonly string[];
  readonly data?: unknown;
  readonly target?: unknown;
  readonly source?: { readonly type: string; readonly referenceId?: string };
}): string {
  const canonical = fingerprintValue(
    {
      kind: input.kind,
      to: [...input.to].sort(compareCanonicalStrings),
      data: input.data ?? {},
      target: input.target,
      source: input.source,
    },
    'notify',
  );
  return `notify:v1:${createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex')}`;
}

/**
 * The canonical form of a `notify()` input, so that two inputs fingerprint alike only when they hold the same values.
 * Supported: plain objects and arrays of them, strings, finite numbers, booleans, null, `undefined` object members
 * (left out, as JSON leaves them out) and valid `Date`s, which keep their instant. Anything else, such as a `Map`, a
 * class instance, a function, `NaN` or an invalid date, would lose its value in JSON and is refused rather than letting
 * different requests look the same.
 */
function fingerprintValue(value: unknown, path: string): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value;
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value;
  } else if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) return { $date: value.toISOString() };
  } else if (Array.isArray(value)) {
    return value.map((item, index) => {
      if (item === undefined) unsupportedNotifyValue(`${path}[${index}]`);
      return fingerprintValue(item, `${path}[${index}]`);
    });
  } else if (typeof value === 'object') {
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      const record = value as Record<string, unknown>;
      // A date encodes as `{ $date }`, so an object with a `$` key is wrapped in `{ $object }` to stay distinct from one.
      const entries = Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort(compareCanonicalStrings)
        .map((key): [string, unknown] => [
          key,
          fingerprintValue(record[key], `${path}.${key}`),
        ]);
      const normalized: Record<string, unknown> = Object.fromEntries(entries);
      return Object.keys(normalized).some((key) => key.startsWith('$'))
        ? { $object: normalized }
        : normalized;
    }
  }
  return unsupportedNotifyValue(path);
}

function unsupportedNotifyValue(path: string): never {
  throw new TypeError(
    `Notification ${path} holds a value notify() cannot compare for idempotency: use JSON values or valid Dates.`,
  );
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => compareCanonicalStrings(left, right))
      .map(([key, item]) => [key, normalizeValue(item)]),
  );
}

function compareCanonicalStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
