import { expect, it } from 'vitest';
import { createECDH, randomBytes } from 'node:crypto';
import webPush from 'web-push';
import {
  createWebPushService,
  MAX_WEB_PUSH_PAYLOAD_BYTES,
  pushPayload,
} from '../../server/service.js';

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
