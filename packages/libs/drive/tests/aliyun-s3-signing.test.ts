import { createHash, createHmac } from 'node:crypto';
import { createServer, type IncomingHttpHeaders } from 'node:http';
import { once } from 'node:events';

import { afterEach, expect, it, vi } from 'vitest';

import { createDriveManager, type S3DriveDiskConfig } from '../src/index.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const config: S3DriveDiskConfig = {
  driver: 's3',
  bucket: 'test-bucket',
  region: 'cn-hangzhou',
  forcePathStyle: true,
  supportsACL: false,
  visibility: 'private',
  credentials: {
    provider: 'aliyun-ecs-ram-role',
    roleName: 'test-role',
    ...{
      accessKeyId: 'unused-static-key',
      secretAccessKey: 'unused-static-secret',
    },
  },
};

it.each(['', 'unknown', undefined])(
  'rejects an explicitly unsupported provider %s at driver creation',
  (provider) => {
    const manager = createDriveManager({
      default: 'oss',
      disks: {
        oss: {
          ...config,
          credentials: {
            provider,
          } as unknown as S3DriveDiskConfig['credentials'],
        },
      },
    });
    expect(() => manager.use()).toThrow('Unsupported S3 credentials provider');
  },
);

it('switches actual request and presigned URL signatures after refresh and recovers from failure', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const started = Date.now();
  let generation = 1;
  let invalid = false;
  let credentialReads = 0;
  const metadata = vi.fn(async (_url: string, options: RequestInit) => {
    if (options.method === 'PUT') return new Response('test-metadata-token');
    credentialReads++;
    return Response.json({
      Code: 'Success',
      AccessKeyId: `test-key-${generation}`,
      AccessKeySecret: `test-secret-${generation}`,
      SecurityToken: `test-session-${generation}`,
      Expiration: invalid
        ? 'invalid'
        : new Date(Date.now() + 3600000).toISOString(),
    });
  });
  vi.stubGlobal('fetch', metadata);
  const requests: IncomingHttpHeaders[] = [];
  const server = createServer(async (req, res) => {
    for await (const chunk of req) {
      void chunk;
    }
    requests.push(req.headers);
    res.end(req.method === 'GET' ? 'test-content' : '');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing test server address');
  const disk = createDriveManager({
    default: 'oss',
    disks: { oss: { ...config, endpoint: `http://127.0.0.1:${address.port}` } },
  }).use();

  async function checkSignatures(expectedGeneration: number) {
    await disk.put('file.txt', 'test-content');
    expect(await disk.get('file.txt')).toBe('test-content');
    for (const headers of requests.splice(0)) {
      expect(headers.authorization).toContain(
        `Credential=test-key-${expectedGeneration}/`,
      );
      expect(headers['x-amz-security-token']).toBe(
        `test-session-${expectedGeneration}`,
      );
    }
    verifyUrl(await disk.getSignedUrl('file.txt'), 'GET', expectedGeneration);
    verifyUrl(
      await disk.getSignedUploadUrl('file.txt'),
      'PUT',
      expectedGeneration,
    );
  }

  try {
    await checkSignatures(1);
    expect(credentialReads).toBe(1);
    await checkSignatures(1);
    expect(credentialReads).toBe(1);
    vi.setSystemTime(started + 56 * 60000);
    invalid = true;
    await expect(disk.get('file.txt')).rejects.toThrow();
    expect(requests).toHaveLength(0);
    invalid = false;
    generation = 2;
    await checkSignatures(2);
    expect(credentialReads).toBe(3);
    vi.setSystemTime(started + 112 * 60000);
    generation = 3;
    await checkSignatures(3);
    expect(credentialReads).toBe(4);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

function verifyUrl(value: string, method: string, generation: number) {
  const url = new URL(value);
  expect(url.searchParams.get('X-Amz-Credential')).toContain(
    `test-key-${generation}/`,
  );
  expect(url.searchParams.get('X-Amz-Security-Token')).toBe(
    `test-session-${generation}`,
  );
  expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('host');
  const signature = url.searchParams.get('X-Amz-Signature');
  url.searchParams.delete('X-Amz-Signature');
  const encode = (value: string) =>
    encodeURIComponent(value).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  const query = [...url.searchParams]
    .map(([key, value]) => [encode(key), encode(value)])
    .sort(([a, av], [b, bv]) =>
      a < b ? -1 : a > b ? 1 : av < bv ? -1 : av > bv ? 1 : 0,
    )
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const canonical = [
    method,
    url.pathname,
    query,
    `host:${url.host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  const scope = url.searchParams
    .get('X-Amz-Credential')!
    .split('/')
    .slice(1)
    .join('/');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    url.searchParams.get('X-Amz-Date'),
    scope,
    createHash('sha256').update(canonical).digest('hex'),
  ].join('\n');
  let key: Buffer = Buffer.from(`AWS4test-secret-${generation}`);
  for (const part of scope.split('/'))
    key = createHmac('sha256', key).update(part).digest();
  expect(signature).toBe(
    createHmac('sha256', key).update(stringToSign).digest('hex'),
  );
}
