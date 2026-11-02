import { createHash, createHmac } from 'node:crypto';
import { Readable } from 'node:stream';

import { afterEach, expect, it, vi } from 'vitest';

import { disk, mockTransport, reply } from './helpers/oss.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it.each([undefined, 'test-role'])(
  'merges initial credentials across concurrent operations and signatures (role=%s)',
  async (roleName) => {
    const response = Promise.withResolvers<Response>();
    const started = Promise.withResolvers<void>();
    const metadata = vi.fn(async (url: string, options: RequestInit) => {
      if (options.method === 'PUT') {
        started.resolve();
        return response.promise;
      }
      return url.endsWith('/security-credentials/')
        ? new Response('test-role')
        : Response.json({
            Code: 'Success',
            AccessKeyId: 'test-key',
            AccessKeySecret: 'test-secret',
            SecurityToken: 'test-token',
            Expiration: new Date(Date.now() + 3600000).toISOString(),
          });
    });
    vi.stubGlobal('fetch', metadata);
    const transport = mockTransport();
    const storage = disk({
      credentials: { provider: 'aliyun-ecs-ram-role', roleName },
    });
    const operations = Promise.all([
      storage.put('file', 'hello'),
      storage.getSignedUrl('file'),
      storage.getSignedUploadUrl('file'),
    ]);
    await started.promise;
    expect(metadata).toHaveBeenCalledTimes(1);
    response.resolve(new Response('metadata-token'));
    await operations;
    expect(metadata).toHaveBeenCalledTimes(roleName ? 2 : 3);
    expect(transport).toHaveBeenCalledTimes(1);
    await storage.getSignedUrl('file');
    expect(metadata).toHaveBeenCalledTimes(roleName ? 2 : 3);
  },
);

it.each([undefined, 900000])(
  'preserves timeout %s while refreshing SDK requests and signatures, merging concurrent refreshes and recovering',
  async (timeout) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const started = Date.now();
    let generation = 1;
    let invalid = false;
    let reads = 0;
    const metadata = vi.fn(async (_url: string, options: RequestInit) => {
      if (options.method === 'PUT') return new Response('test-metadata-token');
      reads++;
      return Response.json({
        Code: 'Success',
        AccessKeyId: `test-key-${generation}`,
        AccessKeySecret: `test-secret-${generation}`,
        SecurityToken: `test-token-${generation}`,
        Expiration: invalid
          ? 'invalid'
          : new Date(Date.now() + 3600000).toISOString(),
      });
    });
    vi.stubGlobal('fetch', metadata);
    const transport = mockTransport(async (_url, options) => {
      if (options.stream) for await (const chunk of options.stream) void chunk;
      return reply(options.method === 'GET' ? 'hello' : '');
    });
    const storage = disk({
      timeout,
      credentials: { provider: 'aliyun-ecs-ram-role', roleName: 'test-role' },
    });
    async function check(expected: number) {
      await Promise.all([
        storage.put('file.txt', 'hello'),
        storage.putStream('stream.txt', Readable.from(['hello'])),
        storage.get('file.txt'),
        storage.getBytes('file.txt'),
      ]);
      for (const [value, options] of transport.mock.calls.splice(0)) {
        expect(options.timeout).toBe(timeout ?? 600000);
        const headers = Object.fromEntries(
          Object.entries(options.headers).map(([key, value]) => [
            key.toLowerCase(),
            String(value),
          ]),
        );
        expect(headers.authorization).toContain(
          `Credential=test-key-${expected}/`,
        );
        expect(headers['x-oss-security-token']).toBe(`test-token-${expected}`);
        const signature = headers.authorization.split('Signature=')[1];
        verifySignature(
          new URL(value),
          options.method,
          headers,
          signature,
          `test-secret-${expected}`,
        );
      }
      for (const method of ['GET', 'PUT'] as const) {
        const url = new URL(
          method === 'GET'
            ? await storage.getSignedUrl('file.txt', {
                contentDisposition: 'attachment; filename="hello.txt"',
              })
            : await storage.getSignedUploadUrl('file.txt', {
                contentType: 'text/plain',
              }),
        );
        expect(url.searchParams.get('x-oss-credential')).toContain(
          `test-key-${expected}/`,
        );
        expect(url.searchParams.get('x-oss-security-token')).toBe(
          `test-token-${expected}`,
        );
        const signature = url.searchParams.get('x-oss-signature')!;
        url.searchParams.delete('x-oss-signature');
        verifySignature(
          url,
          method,
          method === 'PUT' ? { 'content-type': 'text/plain' } : {},
          signature,
          `test-secret-${expected}`,
        );
      }
    }
    await check(1);
    expect(reads).toBe(1);
    await check(1);
    expect(reads).toBe(1);
    vi.setSystemTime(started + 56 * 60000);
    invalid = true;
    await Promise.all([
      expect(storage.driver.get('file.txt')).rejects.toThrow('Expiration'),
      expect(storage.driver.getSignedUploadUrl('file.txt')).rejects.toThrow(
        'Expiration',
      ),
    ]);
    expect(transport).not.toHaveBeenCalled();
    invalid = false;
    generation = 2;
    await check(2);
    expect(reads).toBe(3);
    vi.setSystemTime(started + 112 * 60000);
    generation = 3;
    await check(3);
    expect(reads).toBe(4);
  },
);

it('caps signed lifetimes at STS expiration and seven days and rejects invalid lifetimes', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, options: RequestInit) =>
      options.method === 'PUT'
        ? new Response('metadata-token')
        : Response.json({
            Code: 'Success',
            AccessKeyId: 'test-key',
            AccessKeySecret: 'test-secret',
            SecurityToken: 'test-token',
            Expiration: new Date(Date.now() + 600000).toISOString(),
          }),
    ),
  );
  const storage = disk({
    credentials: { provider: 'aliyun-ecs-ram-role', roleName: 'test-role' },
  });
  const url = new URL(
    await storage.getSignedUrl('file', { expiresIn: '2 hours' }),
  );
  expect(Number(url.searchParams.get('x-oss-expires'))).toBeLessThanOrEqual(
    600,
  );
  expect(Number(url.searchParams.get('x-oss-expires'))).toBeGreaterThan(590);
  expect(
    new URL(
      await disk().getSignedUploadUrl('file', { expiresIn: '8 days' }),
    ).searchParams.get('x-oss-expires'),
  ).toBe('604800');
  for (const expiresIn of [0, -1, NaN, Infinity, 'bad'])
    await expect(storage.getSignedUrl('file', { expiresIn })).rejects.toThrow();
});

function verifySignature(
  url: URL,
  method: string,
  headers: Record<string, string>,
  signature: string,
  secret: string,
) {
  const encode = (value: string) =>
    encodeURIComponent(value).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  const canonicalHeaders = Object.entries(headers)
    .filter(
      ([name]) =>
        name === 'content-type' ||
        name === 'content-md5' ||
        name.startsWith('x-oss-'),
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}:${value.trim()}\n`)
    .join('');
  const canonicalQuery = [...url.searchParams]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${encode(name)}=${encode(value)}`)
    .join('&');
  const path = `/test-bucket${decodeURIComponent(url.pathname)}`
    .split('/')
    .map(encode)
    .join('/');
  const canonical = [
    method,
    path,
    canonicalQuery,
    canonicalHeaders,
    '',
    headers['x-oss-content-sha256'] || 'UNSIGNED-PAYLOAD',
  ].join('\n');
  const date = headers['x-oss-date'] || url.searchParams.get('x-oss-date')!;
  const scope = `${date.slice(0, 8)}/cn-hangzhou/oss/aliyun_v4_request`;
  const stringToSign = [
    'OSS4-HMAC-SHA256',
    date,
    scope,
    createHash('sha256').update(canonical).digest('hex'),
  ].join('\n');
  let key: Buffer = Buffer.from(`aliyun_v4${secret}`);
  for (const part of scope.split('/'))
    key = createHmac('sha256', key).update(part).digest();
  expect(signature).toBe(
    createHmac('sha256', key).update(stringToSign).digest('hex'),
  );
}
