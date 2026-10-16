import { Readable } from 'node:stream';

import { afterEach, expect, it, vi } from 'vitest';

import { acl, config, disk, mockTransport, reply } from './helpers/oss.js';

afterEach(() => vi.restoreAllMocks());

it.each([undefined, 900000, 1, 2147483647])(
  'passes timeout %s through the SDK for uploads, downloads and derived buckets',
  async (timeout) => {
    const transport = mockTransport(async (_url, options) => {
      if (options.stream) for await (const chunk of options.stream) void chunk;
      return reply('hello');
    });
    const storage = disk({ timeout });
    for (const target of [
      storage.driver,
      storage.driver.bucket('other-bucket'),
    ]) {
      await target.put('file.txt', 'hello');
      await target.putStream('stream.txt', Readable.from(['hello']));
      expect(await target.get('file.txt')).toBe('hello');
      expect(await target.getBytes('file.txt')).toEqual(Buffer.from('hello'));
      for await (const chunk of await target.getStream('file.txt')) void chunk;
    }
    expect(transport).toHaveBeenCalledTimes(10);
    expect(transport.mock.calls.map(([, options]) => options.timeout)).toEqual(
      Array(10).fill(timeout ?? 600000),
    );
    expect(new URL(transport.mock.calls[5][0]).hostname).toBe(
      'other-bucket.oss-cn-hangzhou.aliyuncs.com',
    );
  },
);

it.each([0, -1, 1.5, NaN, Infinity, 2147483648, '600000', null])(
  'rejects invalid timeout %s when creating a disk',
  (timeout) => {
    expect(() => disk({ timeout } as Partial<typeof config>)).toThrow(
      'OSS timeout must be an integer from 1 to 2147483647 milliseconds.',
    );
  },
);

it('streams without a known length and rejects source stream failures', async () => {
  const transport = mockTransport(async (_url, options) => {
    if (options.stream) for await (const chunk of options.stream) void chunk;
    return reply();
  });
  const storage = disk();
  await storage.putStream('stream.txt', Readable.from(['stream']));
  expect(transport.mock.calls[0][1].headers).toHaveProperty(
    'Transfer-Encoding',
    'chunked',
  );
  const source = Readable.from(
    (async function* () {
      yield 'first';
      throw new Error('source failure');
    })(),
  );
  await expect(storage.putStream('broken.txt', source)).rejects.toMatchObject({
    code: 'E_CANNOT_WRITE_FILE',
  });
});

it('continues after an empty listing page and stops on batch deletion failure', async () => {
  const transport = mockTransport((url, options) => {
    if (options.method === 'POST')
      return reply(
        '<Error><Code>AccessDenied</Code><Message>Denied</Message></Error>',
        403,
      );
    return reply(
      url.searchParams.has('continuation-token')
        ? '<ListBucketResult><Contents><Key>dir/file.txt</Key><Size>4</Size></Contents></ListBucketResult>'
        : '<ListBucketResult><NextContinuationToken>next</NextContinuationToken></ListBucketResult>',
    );
  });
  await expect(disk().deleteAll('dir')).rejects.toMatchObject({
    code: 'E_CANNOT_DELETE_DIRECTORY',
  });
  expect(transport.mock.calls.map(([, options]) => options.method)).toEqual([
    'GET',
    'GET',
    'POST',
  ]);
});

it.each(['private', 'public-read', 'public-read-write'])(
  'maps explicit object ACL %s without a bucket request',
  async (value) => {
    const transport = mockTransport(() => acl(value));
    expect(await disk({ supportsACL: true }).getVisibility('file')).toBe(
      value === 'private' ? 'private' : 'public',
    );
    expect(transport).toHaveBeenCalledTimes(1);
  },
);

it('uploads strings, binary and streams with metadata and write options', async () => {
  const transport = mockTransport(async (_url, options) => {
    if (options.stream) {
      const chunks = [];
      for await (const chunk of options.stream) chunks.push(chunk);
      expect(Buffer.concat(chunks).toString()).toBe('stream');
    }
    return reply();
  });
  const storage = disk({ supportsACL: true });
  await storage.put('file.txt', 'hello', {
    contentType: 'text/custom',
    contentLanguage: 'en',
    contentEncoding: 'identity',
    contentDisposition: 'inline',
    cacheControl: 'max-age=60',
    visibility: 'public',
    meta: { source: 'test' },
  });
  expect(transport.mock.calls[0][1].content).toEqual(Buffer.from('hello'));
  expect(transport.mock.calls[0][1].headers).toMatchObject({
    'Content-Type': 'text/custom',
    'Content-Language': 'en',
    'Content-Encoding': 'identity',
    'Content-Disposition': 'inline',
    'Cache-Control': 'max-age=60',
    'x-oss-object-acl': 'public-read',
    'x-oss-meta-source': 'test',
  });
  await storage.put('bytes.bin', new Uint8Array([0, 255]));
  expect(transport.mock.calls[1][1].content).toEqual(Buffer.from([0, 255]));
  await storage.putStream('stream.txt', Readable.from(['stream']), {
    contentLength: 6,
  });
  expect(transport.mock.calls[2][1].headers).toMatchObject({
    'Content-Length': '6',
  });
  expect(transport.mock.calls[2][1].headers).not.toHaveProperty(
    'Transfer-Encoding',
  );
});

it('downloads UTF-8, bytes, streams and metadata through the SDK', async () => {
  mockTransport(() => reply('hello 世界'));
  const storage = disk();
  expect(await storage.get('file.txt')).toBe('hello 世界');
  expect(await storage.getBytes('file.txt')).toEqual(Buffer.from('hello 世界'));
  const stream = await storage.getStream('file.txt');
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString()).toBe('hello 世界');
  expect(await storage.getMetaData('file.txt')).toEqual({
    contentType: 'text/plain',
    contentLength: 12,
    etag: '"test-etag"',
    lastModified: new Date('2026-10-15T10:00:00Z'),
  });
});

it('handles existence and deletion, preserves permission failures and redacts SDK errors', async () => {
  const transport = mockTransport((_url, options) =>
    options.method === 'DELETE'
      ? reply('', 204)
      : reply(
          '<Error><Code>NoSuchKey</Code><Message>test-secret</Message></Error>',
          404,
        ),
  );
  const storage = disk();
  expect(await storage.exists('absent')).toBe(false);
  await expect(storage.get('absent')).rejects.toMatchObject({
    code: 'E_CANNOT_READ_FILE',
  });
  await expect(storage.delete('absent')).resolves.toBeUndefined();
  transport.mockImplementation(async () =>
    reply(
      '<Error><Code>AccessDenied</Code><Message>test-secret test-session</Message></Error>',
      403,
    ),
  );
  await expect(storage.driver.exists('forbidden')).rejects.toThrow('HTTP 403');
  try {
    await storage.get('forbidden');
  } catch (error) {
    const details = JSON.stringify(error, Object.getOwnPropertyNames(error));
    expect(details).not.toContain('test-secret');
    expect(details).not.toContain('test-session');
  }
});

it('copies source visibility, follows bucket ACL inheritance and moves only after copy succeeds', async () => {
  const transport = mockTransport((url, options) => {
    if (url.searchParams.has('acl') && options.method === 'GET')
      return acl(url.pathname === '/' ? 'public-read' : 'default');
    if (options.method === 'PUT' && !url.searchParams.has('acl'))
      return reply(
        '<CopyObjectResult><ETag>"copy-etag"</ETag><LastModified>2026-10-15T10:00:00Z</LastModified></CopyObjectResult>',
      );
    if (options.method === 'DELETE') return reply('', 204);
    return reply();
  });
  const storage = disk({ supportsACL: true });
  expect(await storage.getVisibility('source.txt')).toBe('public');
  await storage.setVisibility('source.txt', 'private');
  expect(transport.mock.calls.at(-1)![1].headers).toHaveProperty(
    'x-oss-object-acl',
    'private',
  );
  transport.mockClear();
  await storage.driver.copy('dir/a b?#.txt', 'copy.txt');
  const put = transport.mock.calls.at(-1)!;
  expect(put[1].headers['x-oss-copy-source']).toBe(
    '/test-bucket/dir%2Fa%20b%3F%23.txt',
  );
  expect(put[1].headers['x-oss-object-acl']).toBe('public-read');
  transport.mockClear();
  await storage.move('source.txt', 'moved.txt', { visibility: 'private' });
  expect(transport.mock.calls.map(([, options]) => options.method)).toEqual([
    'PUT',
    'DELETE',
  ]);
  transport.mockImplementation(async () =>
    reply(
      '<Error><Code>AccessDenied</Code><Message>Denied</Message></Error>',
      403,
    ),
  );
  transport.mockClear();
  await expect(storage.move('source.txt', 'moved.txt')).rejects.toThrow();
  expect(
    transport.mock.calls.some(([, options]) => options.method === 'DELETE'),
  ).toBe(false);
});

it('uses configured visibility without ACL requests when disabled', async () => {
  const transport = mockTransport(() =>
    reply('<CopyObjectResult><ETag>etag</ETag></CopyObjectResult>'),
  );
  const storage = disk({ visibility: 'public' });
  expect(await storage.getVisibility('file')).toBe('public');
  await storage.setVisibility('file', 'private');
  expect(transport).not.toHaveBeenCalled();
  await storage.copy('source', 'destination', { visibility: 'public' });
  expect(transport.mock.calls[0][1].headers).not.toHaveProperty(
    'x-oss-object-acl',
  );
});

it('lists files and directories, forwards continuation tokens and deletes every recursive page', async () => {
  const transport = mockTransport((url, options) => {
    if (options.method === 'POST') return reply('<DeleteResult/>');
    return reply(
      `<ListBucketResult><Contents><Key>dir/file.txt</Key><Size>4</Size><ETag>etag</ETag><LastModified>2026-10-15T10:00:00Z</LastModified></Contents><CommonPrefixes><Prefix>dir/sub/</Prefix></CommonPrefixes>${url.searchParams.has('continuation-token') ? '' : '<NextContinuationToken>next-token</NextContinuationToken>'}</ListBucketResult>`,
    );
  });
  const storage = disk();
  const result = await storage.driver.listAll('dir', { maxResults: 2 });
  const objects = [...result.objects];
  expect(
    objects.map((object) => (object.isDirectory ? object.prefix : object.key)),
  ).toEqual(['dir/sub', 'dir/file.txt']);
  expect(await objects[1].getMetaData()).toMatchObject({
    contentLength: 4,
    etag: 'etag',
  });
  expect(result.paginationToken).toBe('next-token');
  const first = new URL(transport.mock.calls[0][0]);
  expect(first.searchParams.get('prefix')).toBe('dir/');
  expect(first.searchParams.get('delimiter')).toBe('/');
  expect(first.searchParams.get('max-keys')).toBe('2');
  await storage.driver.listAll('dir', {
    recursive: true,
    paginationToken: result.paginationToken,
  });
  const next = new URL(transport.mock.calls[1][0]);
  expect(next.searchParams.get('prefix')).toBe('dir');
  expect(next.searchParams.get('continuation-token')).toBe('next-token');
  transport.mockClear();
  await storage.deleteAll('/');
  expect(transport.mock.calls.map(([, options]) => options.method)).toEqual([
    'GET',
    'POST',
    'GET',
    'POST',
  ]);
  for (const [url, options] of transport.mock.calls) {
    if (options.method === 'GET')
      expect(new URL(url).searchParams.get('delimiter')).toBeNull();
    else expect(options.content).toContain('<Key>dir/file.txt</Key>');
  }
});

it.each([
  [{}, 'test-bucket.oss-cn-hangzhou.aliyuncs.com'],
  [{ internal: true }, 'test-bucket.oss-cn-hangzhou-internal.aliyuncs.com'],
  [
    { internal: true, domain: 'https://files.example.com' },
    'files.example.com',
  ],
])(
  'uses matching operation, public and signed URL hosts (%j)',
  async (overrides, host) => {
    const transport = mockTransport();
    const storage = disk(overrides).driver;
    const key = 'dir/中文 a?#%.txt';
    expect(new URL(await storage.getUrl(key)).host).toBe(host);
    expect(
      decodeURIComponent(new URL(await storage.getUrl(key)).pathname),
    ).toBe(`/${key}`);
    await storage.put(key, 'hello');
    expect(new URL(transport.mock.calls[0][0]).host).toBe(host);
    const url = new URL(await storage.getSignedUrl(key));
    expect(url.host).toBe(host);
    expect(decodeURIComponent(url.pathname)).toBe(`/${key}`);
    const other = storage.bucket('other-bucket');
    expect(new URL(await other.getSignedUrl('file')).host).toBe(
      overrides.domain ? host : host.replace('test-bucket', 'other-bucket'),
    );
  },
);

it.each([
  { credentials: {} },
  { credentials: { ...config.credentials, provider: 'aliyun-ecs-ram-role' } },
  { credentials: { provider: 'unknown' } },
  { credentials: { provider: undefined } },
  { credentials: { provider: 'aliyun-ecs-ram-role', roleName: '' } },
  { domain: 'http://files.example.com' },
  { domain: 'https://files.example.com/path' },
  { region: 'cn-hangzhou' },
])('rejects invalid configuration at disk creation (%j)', (overrides) => {
  expect(() => disk(overrides as Partial<typeof config>)).toThrow();
});
