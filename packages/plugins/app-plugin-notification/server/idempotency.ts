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
  const canonical = normalizeValue({
    kind: input.kind,
    to: [...input.to].sort(compareCanonicalStrings),
    data: input.data ?? {},
    target: input.target,
    source: input.source,
  });
  return `notify:v1:${createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex')}`;
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
