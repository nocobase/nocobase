import { describe, expect, it } from 'vitest';
import {
  notificationRequestFingerprint,
  notifyRequestFingerprint,
  validateNotificationIdempotencyKey,
} from '../server/idempotency.js';

describe('notification idempotency', () => {
  it('normalizes Channel and object key order', () => {
    const first = {
      idempotencyKey: 'approval:42',
      messages: {
        email: { to: 'a@example.com', subject: 'Approved', text: 'Hello' },
        hook: { text: 'Hello' },
      },
    };
    const reordered = {
      idempotencyKey: 'approval:42',
      messages: {
        hook: { text: 'Hello' },
        email: { text: 'Hello', subject: 'Approved', to: 'a@example.com' },
      },
    };
    expect(notificationRequestFingerprint(first)).toBe(
      notificationRequestFingerprint(reordered),
    );
    expect(notificationRequestFingerprint(first)).not.toBe(
      notificationRequestFingerprint({
        ...first,
        messages: { hook: { text: 'Changed' } },
      }),
    );
    expect(notificationRequestFingerprint(first)).toBe(
      notificationRequestFingerprint({
        ...first,
        source: { type: 'application' },
      }),
    );
  });
  it('requires a trimmed key with a bounded length', () => {
    expect(() =>
      validateNotificationIdempotencyKey('order:42:user:7'),
    ).not.toThrow();
    for (const key of ['', ' padded ', 'x'.repeat(192)])
      expect(() => validateNotificationIdempotencyKey(key)).toThrow();
  });
  it('tells notify() requests apart by every data value, dates included', () => {
    const request = (data: Record<string, unknown>) =>
      notifyRequestFingerprint({ kind: 'reminder', to: ['b', 'a'], data });
    const due = new Date('2026-11-22T09:00:00.000Z');
    expect(request({ due, title: 'Plan' })).toBe(
      request({ title: 'Plan', due: new Date(due.getTime()) }),
    );
    expect(request({ due })).not.toBe(
      request({ due: new Date('2026-11-23T09:00:00.000Z') }),
    );
    // A date never reads like an object that only looks like one.
    expect(request({ due })).not.toBe(
      request({ due: { $date: due.toISOString() } }),
    );
    expect(request({ due: { $object: due } })).not.toBe(
      request({ due: { $date: due.toISOString() } }),
    );
    expect(request({ items: [1, 2] })).not.toBe(request({ items: [2, 1] }));
    expect(request({ note: undefined })).toBe(request({}));
  });

  it('refuses notify() data it cannot compare', () => {
    for (const value of [
      new Map([['a', 1]]),
      new Set([1]),
      new Date(Number.NaN),
      Number.NaN,
      Number.POSITIVE_INFINITY,
      10n,
      () => 1,
      Symbol('x'),
      new (class Due {
        at = 1;
      })(),
      [undefined],
    ])
      expect(() =>
        notifyRequestFingerprint({
          kind: 'reminder',
          to: ['a'],
          data: { value },
        }),
      ).toThrow(/notify\.data\.value/);
  });
});
