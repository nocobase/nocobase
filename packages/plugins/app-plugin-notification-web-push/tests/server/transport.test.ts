import { createECDH, randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { sendPush } from '../../server/transport.js';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('node:https', () => ({ request: mocks.request }));

it('creates an encrypted VAPID request and binds the actual HTTPS socket to the delivery signal', async () => {
  const browser = createECDH('prime256v1');
  browser.generateKeys();
  const subscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
    keys: {
      p256dh: browser.getPublicKey().toString('base64url'),
      auth: randomBytes(16).toString('base64url'),
    },
  };
  let ciphertext: Buffer | undefined;
  mocks.request.mockImplementation((_url, _options, callback) => {
    const req = new EventEmitter() as EventEmitter & {
      end: (body: Buffer) => void;
    };
    req.end = (body) => {
      ciphertext = body;
      callback({ statusCode: 201, destroy: vi.fn() });
    };
    return req;
  });
  const signal = new AbortController().signal;
  expect(
    await sendPush(
      subscription,
      { title: 'Private reminder text' },
      { privateKey: 'a'.repeat(64), contact: 'mailto:test@example.com' },
      signal,
    ),
  ).toBe(201);
  const [url, options] = mocks.request.mock.calls[0]!;
  expect(url.href).toBe(subscription.endpoint);
  expect(options).toMatchObject({ method: 'POST', signal });
  expect(options.headers['Content-Encoding']).toBe('aes128gcm');
  expect(options.headers.Authorization).toMatch(/^vapid t=/u);
  expect(ciphertext?.length).toBeGreaterThan(100);
  expect(ciphertext?.toString()).not.toContain('Private reminder text');
});
