import { createECDH, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { parsePushProxy } from '../../server/config.js';
import { sendPush } from '../../server/transport.js';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('node:https', () => ({ request: mocks.request }));

const config = {
  privateKey: 'a'.repeat(64),
  contact: 'mailto:test@example.com',
};

function subscription() {
  const browser = createECDH('prime256v1');
  browser.generateKeys();
  return {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
    keys: {
      p256dh: browser.getPublicKey().toString('base64url'),
      auth: randomBytes(16).toString('base64url'),
    },
  };
}
it('creates an encrypted VAPID request and binds the actual HTTPS socket to the delivery signal', async () => {
  const device = subscription();
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
    await sendPush(device, { title: 'Private reminder text' }, config, signal, {
      ttl: 3_600,
      urgency: 'high',
    }),
  ).toBe(201);
  const [url, options] = mocks.request.mock.calls[0]!;
  expect(url.href).toBe(device.endpoint);
  expect(options).toMatchObject({ method: 'POST', signal, agent: false });
  expect(options.headers).toMatchObject({ TTL: 3_600, Urgency: 'high' });
  expect(options.headers['Content-Encoding']).toBe('aes128gcm');
  expect(options.headers.Authorization).toMatch(/^vapid t=/u);
  expect(ciphertext?.length).toBeGreaterThan(100);
  expect(ciphertext?.toString()).not.toContain('Private reminder text');
});

it.each(['http', 'https', 'socks5'])(
  'accepts a configured %s proxy URL',
  (protocol) => {
    expect(
      parsePushProxy(
        `${protocol}://operator:percent%40encoded@proxy.example.com:3000`,
      ).hostname,
    ).toBe('proxy.example.com');
  },
);

it('rejects invalid proxy configuration without echoing it', () => {
  for (const url of [
    'ftp://proxy.example.com:9000',
    'https://name:do-not-echo@proxy.example.com/path',
    'socks5://name:invalid%escape@proxy.example.com:1080',
  ]) {
    expect(() => parsePushProxy(url)).toThrow(
      'Must be an HTTP, HTTPS or SOCKS5 proxy URL without a path, query or fragment.',
    );
  }
});

it.each(['http', 'socks5'])(
  'uses the configured %s tunnel without falling back to a direct send',
  async (protocol) => {
    const seen: string[] = [];
    const sockets = new Set<import('node:net').Socket>();
    const proxy = createServer((socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      socket.on('error', () => {});
      if (protocol === 'http') {
        socket.once('data', (bytes) => {
          seen.push(bytes.toString().split('\r\n')[0]!);
          // A tunnel rejection must be treated as a connection failure, never an expired gateway subscription.
          socket.end('HTTP/1.1 410 Gone\r\nContent-Length: 0\r\n\r\n');
        });
      } else {
        socket.once('data', () => {
          socket.write(Buffer.from([5, 0]));
          socket.once('data', (bytes) => {
            seen.push(bytes.subarray(5, 5 + bytes[4]!).toString());
            socket.end(Buffer.from([5, 2, 0, 1, 0, 0, 0, 0, 0, 0]));
          });
        });
      }
    });
    proxy.listen(0, '127.0.0.1');
    await once(proxy, 'listening');
    const address = proxy.address();
    if (!address || typeof address === 'string')
      throw new Error('No proxy port.');
    mocks.request.mockClear();
    try {
      await expect(
        sendPush(
          subscription(),
          { title: 'Private reminder text' },
          { ...config, proxyUrl: `${protocol}://127.0.0.1:${address.port}` },
          AbortSignal.timeout(3_000),
        ),
      ).rejects.toThrow('Web Push proxy transport failed.');
      expect(seen).toEqual([
        protocol === 'http'
          ? 'CONNECT fcm.googleapis.com:443 HTTP/1.1'
          : 'fcm.googleapis.com',
      ]);
      expect(mocks.request).not.toHaveBeenCalled();
    } finally {
      for (const socket of sockets) socket.destroy();
      proxy.close();
      await once(proxy, 'close');
    }
  },
);
