import { expect, it, vi } from 'vitest';
import { createECDH, randomBytes } from 'node:crypto';
import webPush from 'web-push';
import {
  createWebPushService,
  MAX_WEB_PUSH_PAYLOAD_BYTES,
  pushPayload,
} from '../../server/service.js';
import { createBadgeVersions, nextBadgeVersion } from '../../server/badge.js';

const message = {
  to: [{ id: 'device', userId: 'alice' }],
  title: 'Review',
  url: '/main/tasks',
  dedupeKey: 'task:1',
};
const service = createWebPushService({
  subscriptions: {} as never,
  notifications: () => null as never,
  transport: async () => 201,
  base: '/main',
});
it.each(['汉字', '🙂', '"\\\n'])(
  'counts the final JSON UTF-8 bytes, including %s and escaping',
  (text) => {
    const prefix = text.repeat(100);
    const bytes = Buffer.byteLength(
      JSON.stringify(pushPayload({ ...message, body: prefix }, '/main')),
      'utf8',
    );
    const body = prefix + 'a'.repeat(MAX_WEB_PUSH_PAYLOAD_BYTES - bytes);
    const valid = service.validateMessage({ ...message, body });
    expect(
      Buffer.byteLength(JSON.stringify(pushPayload(valid, '/main')), 'utf8'),
    ).toBe(MAX_WEB_PUSH_PAYLOAD_BYTES);
    expect(() =>
      service.validateMessage({ ...message, body: body + 'a' }),
    ).toThrow();
  },
);
it('rejects multibyte overflow and measures normalized URLs but excludes private queue context', () => {
  expect(() =>
    service.validateMessage({ ...message, body: '汉'.repeat(1400) }),
  ).toThrow();
  const valid = service.validateMessage({
    ...message,
    url: '/main/中文',
    beforeSend: { name: 'policy', context: 'x'.repeat(10_000) },
  });
  expect(valid.url).toBe('/main/%E4%B8%AD%E6%96%87');
  expect(pushPayload(valid, '/main')).not.toHaveProperty('beforeSend');
});
it.each([
  'https://evil.test/main/a',
  'https://web-push.invalid/main/a',
  '//evil.test/a',
  '/main/../outside',
  '/main/%2e%2e/outside',
  '/other/a',
  '/main-other/a',
  '/main/\\evil',
  '/main/a\n',
])('rejects %s before queueing', (url) => {
  expect(() => service.validateMessage({ ...message, url })).toThrow();
});

it('fits the maximum validated JSON into a 4096-byte encrypted aes128gcm request', () => {
  const empty = pushPayload({ ...message, body: '' }, '/main');
  const body = 'a'.repeat(
    MAX_WEB_PUSH_PAYLOAD_BYTES - Buffer.byteLength(JSON.stringify(empty)),
  );
  const payload = pushPayload(
    service.validateMessage({ ...message, body }),
    '/main',
  );
  const pair = createECDH('prime256v1');
  pair.generateKeys();
  const details = webPush.generateRequestDetails(
    {
      endpoint: 'https://fcm.googleapis.com/fcm/send/boundary',
      keys: {
        p256dh: pair.getPublicKey().toString('base64url'),
        auth: randomBytes(16).toString('base64url'),
      },
    },
    JSON.stringify(payload),
    { contentEncoding: 'aes128gcm' },
  );
  expect(details.body?.length).toBe(4096);
});

it('carries the badge version, or a version taken when the payload is built', () => {
  expect(
    pushPayload({ ...message, badge: 2, badgeVersion: 1_234 }, '/main'),
  ).toMatchObject({ badge: 2, badgeVersion: 1_234 });
  const before = nextBadgeVersion();
  const stamped = pushPayload({ ...message, badge: 2 }, '/main');
  expect(stamped.badgeVersion).toBeGreaterThan(before);
  expect(() =>
    service.validateMessage({ ...message, badgeVersion: -1 }),
  ).toThrow();
});

it('gives reads in the same millisecond distinct, increasing badge versions', () => {
  vi.useFakeTimers({ now: 1_800_000_000_000 });
  try {
    const versions = Array.from({ length: 5 }, () => nextBadgeVersion());
    expect(new Set(versions).size).toBe(5);
    expect([...versions].sort((a, b) => a - b)).toEqual(versions);
    vi.setSystemTime(1_799_999_999_000);
    // A clock stepping back never reorders versions within the process.
    expect(nextBadgeVersion()).toBeGreaterThan(versions.at(-1)!);
  } finally {
    vi.useRealTimers();
  }
});

it('orders badge versions taken on instances sharing a counter, also in the same millisecond', async () => {
  vi.useFakeTimers({ now: 1_800_000_000_000 });
  try {
    // The application's caching counter, shared by both instances.
    const values = new Map<string, number>();
    const counter = {
      increment: async (key: string, amount = 1) => {
        values.set(key, (values.get(key) ?? 0) + amount);
        return values.get(key)!;
      },
    };
    const first = createBadgeVersions(counter);
    const second = createBadgeVersions(counter);
    const versions = [
      await first('alice'),
      await second('alice'),
      await first('alice'),
      await second('alice'),
    ];
    expect([...new Set(versions)].sort((a, b) => a - b)).toEqual(versions);
    // The first in a millisecond takes its start; the next millisecond outranks every version of this one.
    expect(versions[0]).toBe(1_800_000_000_000_000);
    expect(await createBadgeVersions(counter)('bob')).toBe(versions[0]);
    vi.setSystemTime(1_800_000_000_001);
    expect(await second('alice')).toBeGreaterThan(versions.at(-1)!);
  } finally {
    vi.useRealTimers();
  }
});

it('takes process-local badge versions without a counter', async () => {
  const versions = createBadgeVersions();
  const a = await versions('alice');
  expect(await versions('alice')).toBeGreaterThan(a);
  expect(nextBadgeVersion()).toBeGreaterThan(a);
});

it('carries the icon badge count to the worker only when it is a non-negative integer', () => {
  expect(pushPayload({ ...message, badge: 3 }, '/main')).toMatchObject({
    badge: 3,
  });
  expect(pushPayload({ ...message, badge: 0 }, '/main')).toMatchObject({
    badge: 0,
  });
  expect(pushPayload(message, '/main')).not.toHaveProperty('badge');
  expect(pushPayload(message, '/main')).not.toHaveProperty('badgeVersion');
  expect(() => service.validateMessage({ ...message, badge: -1 })).toThrow();
  expect(() => service.validateMessage({ ...message, badge: 1.5 })).toThrow();
});
