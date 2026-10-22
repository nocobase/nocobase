import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAliyunEcsRamRoleProvider } from '../src/credentials/aliyun-ecs-ram-role.js';

const now = Date.now();
const valid = {
  Code: 'Success',
  AccessKeyId: 'test-key',
  AccessKeySecret: 'test-secret',
  SecurityToken: 'test-session',
  Expiration: new Date(now + 3600000).toISOString(),
};
const rolesPath = '/latest/meta-data/ram/security-credentials/';

function mockMetadata() {
  const fetchMock = vi.fn(async (url: string, options: RequestInit) => {
    expect(url.startsWith('http://100.100.100.200/')).toBe(true);
    expect(options.redirect).toBe('error');
    expect(options.signal).toBeInstanceOf(AbortSignal);
    if (options.method === 'PUT') {
      expect(options.headers).toEqual({
        'X-aliyun-ecs-metadata-token-ttl-seconds': '21600',
      });
      return new Response('metadata-token');
    }
    expect(options.headers).toEqual({
      'X-aliyun-ecs-metadata-token': 'metadata-token',
    });
    return url.endsWith(rolesPath)
      ? new Response('my-role\n')
      : Response.json(valid);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Aliyun ECS instance credentials', () => {
  it('discovers a role, maps credentials and reuses the token', async () => {
    const fetchMock = mockMetadata();
    const provider = createAliyunEcsRamRoleProvider();
    expect(await provider()).toEqual({
      accessKeyId: valid.AccessKeyId,
      secretAccessKey: valid.AccessKeySecret,
      sessionToken: valid.SecurityToken,
      expiration: new Date(valid.Expiration),
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await provider();
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('encodes an explicit role and renews the token before its TTL', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const fetchMock = mockMetadata();
    const provider = createAliyunEcsRamRoleProvider('role/name');
    await provider();
    expect(fetchMock.mock.calls[1][0]).toContain('role%2Fname');
    vi.setSystemTime(now + 21540000);
    fetchMock.mockImplementation(async (_url, options) =>
      options.method === 'PUT'
        ? new Response('metadata-token')
        : Response.json({
            ...valid,
            Expiration: new Date(Date.now() + 3600000).toISOString(),
          }),
    );
    await provider();
    expect(
      fetchMock.mock.calls.filter(([, options]) => options.method === 'PUT'),
    ).toHaveLength(2);
  });

  for (const field of [
    'AccessKeyId',
    'AccessKeySecret',
    'SecurityToken',
    'Expiration',
  ]) {
    it.each([undefined, '', '  ', 123])(
      `rejects invalid ${field}: %s and can recover`,
      async (value) => {
        const fetchMock = mockMetadata();
        fetchMock
          .mockResolvedValueOnce(new Response('metadata-token'))
          .mockResolvedValueOnce(Response.json({ ...valid, [field]: value }));
        const provider = createAliyunEcsRamRoleProvider('my-role');
        await expect(provider()).rejects.toThrow(/invalid|Expiration/);
        await expect(provider()).resolves.toHaveProperty(
          'accessKeyId',
          valid.AccessKeyId,
        );
      },
    );
  }

  it.each(['not-a-date', new Date(now - 1000).toISOString()])(
    'rejects unusable expiration %s',
    async (Expiration) => {
      const fetchMock = mockMetadata();
      fetchMock
        .mockResolvedValueOnce(new Response('metadata-token'))
        .mockResolvedValueOnce(Response.json({ ...valid, Expiration }));
      await expect(createAliyunEcsRamRoleProvider('role')()).rejects.toThrow(
        'Expiration',
      );
    },
  );

  it.each(['null', '{', JSON.stringify({ ...valid, Code: 'Denied' })])(
    'rejects malformed credentials without leaking the body',
    async (body) => {
      const fetchMock = mockMetadata();
      fetchMock
        .mockResolvedValueOnce(new Response('metadata-token'))
        .mockResolvedValueOnce(new Response(body));
      const error = await createAliyunEcsRamRoleProvider('role')().catch(
        (e) => e,
      );
      expect(error).toBeInstanceOf(Error);
      expect(error.message).not.toContain('test-secret');
      expect(error.message).not.toContain('test-session');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it.each(['', 'one\ntwo'])(
    'rejects ambiguous or empty role discovery',
    async (roles) => {
      const fetchMock = mockMetadata();
      fetchMock
        .mockResolvedValueOnce(new Response('metadata-token'))
        .mockResolvedValueOnce(new Response(roles));
      await expect(createAliyunEcsRamRoleProvider()()).rejects.toThrow(
        'single instance role',
      );
    },
  );

  it('rejects an empty metadata token', async () => {
    const fetchMock = mockMetadata();
    fetchMock.mockResolvedValue(new Response(' '));
    await expect(createAliyunEcsRamRoleProvider()()).rejects.toThrow(
      'empty metadata token',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([403, 404])('does not retry HTTP %s', async (status) => {
    const fetchMock = mockMetadata();
    fetchMock.mockResolvedValue(new Response('secret-response', { status }));
    await expect(createAliyunEcsRamRoleProvider()()).rejects.toThrow(
      `HTTP ${status}`,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([429, 500])(
    'bounds retries for HTTP %s and recovers on a later call',
    async (status) => {
      const fetchMock = mockMetadata();
      fetchMock.mockImplementation(
        async () => new Response('secret', { status }),
      );
      const provider = createAliyunEcsRamRoleProvider('role');
      const failed = await expect(provider()).rejects.toThrow(`HTTP ${status}`);
      await failed;
      expect(fetchMock).toHaveBeenCalledTimes(3);
      fetchMock.mockImplementation(async (_url, options) =>
        options.method === 'PUT'
          ? new Response('metadata-token')
          : Response.json(valid),
      );
      await expect(provider()).resolves.toHaveProperty(
        'sessionToken',
        valid.SecurityToken,
      );
    },
  );

  it.each([false, true])(
    'times out while %s reading the body and bounds attempts',
    async (bodyTimeout) => {
      const fetchMock = mockMetadata();
      fetchMock.mockImplementation(async (_url, options) => {
        const failure = new Promise<never>((_resolve, reject) =>
          options.signal!.addEventListener('abort', () =>
            reject(new Error('secret error')),
          ),
        );
        return bodyTimeout
          ? ({ ok: true, text: () => failure } as Response)
          : failure;
      });
      const failed = await expect(
        createAliyunEcsRamRoleProvider()(),
      ).rejects.toThrow('request timed out');
      await failed;
      expect(fetchMock).toHaveBeenCalledTimes(3);
    },
  );

  it('retries network failures without leaking their message', async () => {
    const fetchMock = mockMetadata();
    fetchMock.mockRejectedValue(new Error('secret-token'));
    const failed = await expect(
      createAliyunEcsRamRoleProvider()(),
    ).rejects.toThrow('metadata: request failed');
    await failed;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([undefined, 'role'])(
    'replaces unauthorized tokens on either GET path (role=%s)',
    async (role) => {
      const fetchMock = mockMetadata();
      let tokenNumber = 0;
      fetchMock.mockImplementation(async (url, options) => {
        if (options.method === 'PUT')
          return new Response(`token-${++tokenNumber}`);
        const token = (options.headers as Record<string, string>)[
          'X-aliyun-ecs-metadata-token'
        ];
        if (token === 'token-1') return new Response('', { status: 401 });
        expect(token).toBe('token-2');
        return url.endsWith(rolesPath)
          ? new Response('role')
          : Response.json(valid);
      });
      const result = createAliyunEcsRamRoleProvider(role)();
      await expect(result).resolves.toHaveProperty(
        'sessionToken',
        valid.SecurityToken,
      );
      expect(tokenNumber).toBe(2);
    },
  );

  it('clears a repeatedly unauthorized token and recovers next time', async () => {
    const fetchMock = mockMetadata();
    fetchMock.mockImplementation(async (_url, options) =>
      options.method === 'PUT'
        ? new Response('metadata-token')
        : new Response('', { status: 401 }),
    );
    const provider = createAliyunEcsRamRoleProvider('role');
    const failed = await expect(provider()).rejects.toThrow('HTTP 401');
    await failed;
    expect(fetchMock).toHaveBeenCalledTimes(4);
    fetchMock.mockImplementation(async (_url, options) =>
      options.method === 'PUT'
        ? new Response('metadata-token')
        : Response.json(valid),
    );
    await provider();
    expect(fetchMock.mock.calls[4][1].method).toBe('PUT');
  });
});
