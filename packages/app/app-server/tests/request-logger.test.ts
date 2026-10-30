import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { createLogger, type DestinationStream } from '@nocobase/logging';

import { requestLogger } from '../src/logging/index.js';
import {
  requestLoggingMiddleware,
  loggingToken,
} from '../src/logging/index.js';
import { ServiceContainer } from '@nocobase/service-provider';
import type { Logging } from '@nocobase/logging';
import type { AppPluginApplication } from '../src/plugins/index.js';

describe('requestLogger', () => {
  it('logs only API requests in the application middleware', async () => {
    const output = createMemoryDestination();
    const router = new Hono();
    const container = new ServiceContainer();
    container.instance(loggingToken, {
      getLogger: () => createLogger({}, output),
    } as unknown as Logging);
    requestLoggingMiddleware.register(router, {
      container,
      appName: 'main',
    } as AppPluginApplication);
    router.get('/api', (context) => context.text('ok'));
    router.get('/api/users', (context) => context.text('ok'));
    router.get('*', (context) => context.text('ok'));
    for (const path of [
      '/hub',
      '/assets/app.js',
      '/apiary',
      '/api/healthz',
      '/api',
      '/api/users',
    ]) {
      await router.request(path);
    }
    expect(output.records().map((record) => record.msg)).toEqual([
      'GET /api 200 completed',
      'GET /api/users 200 completed',
    ]);
  });

  it('logs request input and successful response output', async () => {
    const output = createMemoryDestination();
    const router = new Hono();
    router.use(
      '*',
      requestLogger({
        app: 'main',
        logger: createLogger({ level: 'debug' }, output),
      }),
    );
    router.get('/users/:id', (context) => context.json({ ok: true }));

    await router.request('/users/42?limit=20', {
      headers: {
        authorization: 'secret',
        'user-agent': 'vitest',
        'x-request-source': 'cli',
      },
    });

    expect(output.records()).toEqual([
      expect.objectContaining({
        level: 20,
        app: 'main',
        req: {
          method: 'GET',
          path: '/users/:id',
          query: { limit: '20' },
          caller: 'anonymous',
          headers: {
            'user-agent': 'vitest',
            'x-request-source': 'cli',
          },
        },
        msg: 'GET /users/:id started',
      }),
      expect.objectContaining({
        level: 30,
        app: 'main',
        req: {
          method: 'GET',
          path: '/users/:id',
          params: { id: '42' },
          query: { limit: '20' },
          caller: 'anonymous',
        },
        res: expect.objectContaining({ status: 200 }),
        durationMs: expect.any(Number),
        msg: 'GET /users/:id 200 completed',
      }),
    ]);
  });

  it('uses warning and error levels for unsuccessful responses', async () => {
    const output = createMemoryDestination();
    const router = new Hono();
    router.onError((error, context) =>
      context.json({ error: error.message }, 500),
    );
    router.use('*', requestLogger({ logger: createLogger({}, output) }));
    router.get('/missing', (context) =>
      context.json({ error: 'missing' }, 404),
    );
    router.get('/error', () => {
      throw new Error('failed');
    });

    await router.request('/missing?reason=unknown', {
      headers: { 'user-agent': 'test', authorization: 'secret' },
    });
    await router.request('/error');

    const completed = output
      .records()
      .filter((record) => record.res !== undefined);
    expect(completed).toEqual([
      expect.objectContaining({
        level: 40,
        req: expect.objectContaining({
          query: { reason: 'unknown' },
          headers: { 'user-agent': 'test' },
        }),
        res: expect.objectContaining({ status: 404 }),
        msg: 'GET /missing 404 completed',
      }),
      expect.objectContaining({
        level: 50,
        res: expect.objectContaining({ status: 500 }),
        err: expect.objectContaining({ message: 'failed' }),
        msg: 'GET /error 500 failed',
      }),
    ]);
  });

  it('supports route-level skipping without adding request state', async () => {
    const output = createMemoryDestination();
    const router = new Hono();
    router.use(
      '*',
      requestLogger({
        logger: createLogger({}, output),
        skip: (context) => context.req.path === '/healthz',
      }),
    );
    router.get('/healthz', (context) => context.json({ ok: true }));

    await router.request('/healthz');

    expect(output.records()).toEqual([]);
  });

  it.each([200, 400, 500] as const)(
    'validates query values and omits secrets at every log level (%s)',
    async (status) => {
      const output = createMemoryDestination();
      const router = new Hono();
      router.use(
        '*',
        requestLogger({ logger: createLogger({ level: 'debug' }, output) }),
      );
      router.get('/runs', (context) => context.json({}, status));
      const query = new URLSearchParams({
        subjectId: '394741478850560',
        limit: '20',
        status: 'running',
        token: 'abc',
        access_token: '123',
        apiKey: 'key',
        authorization: 'bearer',
        signature: 'signed',
        password: 'pass',
        code: 'abcdef1234567890abcd',
        state: 'oauthState123',
        session: 'sessionValue',
        ticket: 'ticketValue',
        otp: '123456',
        nonce: 'nonceValue',
        key: 'keyValue',
        sessionId: 'sessionIdValue',
        CoDe: 'mixedCaseCode',
        q: 'private search',
        filter: '{"secret":"private-filter"}',
        cursor: 'opaque+cursor==',
        pass: 'hunter2',
        pwd: 'abc123',
        auth: 'aBcD1234_efGH5678-ijKL',
        share: 'dba9a7e6-79f5-4cd0-bf2a-f24f87184461',
        invite: '2e5bc4f4-76ab-48c8-9ad1-3a38f9ac69f1',
        pin: '1234',
        phone: '13800138000',
      });
      await router.request(`/runs?${query}`, {
        headers: { 'x-nocobase-run-token': 'run-secret' },
      });
      expect(output.records()).toHaveLength(2);
      for (const record of output.records()) {
        expect(record.req).toMatchObject({ caller: 'agentRun' });
        expect((record.req as { query: unknown }).query).toEqual({
          subjectId: '394741478850560',
          limit: '20',
          status: 'running',
        });
      }
      const serialized = JSON.stringify(output.records());
      expect(serialized).not.toMatch(
        /private search|private-filter|opaque\+cursor|run-secret/,
      );
      for (const name of [
        'code',
        'state',
        'session',
        'ticket',
        'otp',
        'nonce',
        'key',
        'sessionId',
        'CoDe',
        'pass',
        'pwd',
        'auth',
        'share',
        'invite',
        'pin',
        'phone',
      ])
        expect(serialized).not.toContain(query.get(name));
    },
  );

  it.each([200, 400, 500] as const)(
    'rejects invalid values on start and completion (%s)',
    async (status) => {
      const output = createMemoryDestination();
      const router = new Hono();
      router.use(
        '*',
        requestLogger({ logger: createLogger({ level: 'debug' }, output) }),
      );
      router.get('/', (context) => context.json({}, status));
      const query = new URLSearchParams({
        limit: 'private-text',
        offset: '-1',
        page: '1.5',
        pageSize: '1001',
        custom: 'free text',
        unicode: '任意正文',
        control: '123\nsecret',
        decimal: '1.5',
        exponent: '1e+3',
        upper: 'Uppercase',
        punctuation: 'a.b',
        empty: '',
        longWord: 'a'.repeat(17),
        longNumber: '1'.repeat(21),
        tooLong: 'a'.repeat(101),
        longPrefix: 'valid' + ' '.repeat(100),
        uuidSuffix: 'dba9a7e6-79f5-4cd0-bf2a-f24f87184461 secret',
        malformedUuid: 'dba9a7e6-79f5-4cd0-bf2a-f24f8718446z',
      });
      await router.request(`/?${query}`);
      expect(output.records()).toHaveLength(2);
      for (const record of output.records())
        expect((record.req as { query: unknown }).query).toEqual({});
      expect(JSON.stringify(output.records())).not.toMatch(
        /free text|任意正文|secret|aaaa/,
      );
    },
  );

  it('accepts generic scalar shapes without application parameter contracts', async () => {
    const output = createMemoryDestination();
    const router = new Hono();
    router.use('*', requestLogger({ logger: createLogger({}, output) }));
    router.get('/', (context) => context.text('ok'));
    const query = {
      limit: '1000',
      offset: '1000000000',
      page: '1000000000',
      pageSize: '1000',
      count: '-42',
      recordId: '394741478850560',
      id: 'dba9a7e6-79f5-4cd0-bf2a-f24f87184461',
      appId: 'DBA9A7E6-79F5-4CD0-BF2A-F24F87184461',
      customKind: 'custom-archived',
      arbitraryFlag: 'false',
      statusKey: 'customState',
      keyboard: 'safe',
      singleLetter: 'a',
      longestWord: 'a'.repeat(16),
      largestId: '1'.repeat(20),
      maximum: '999',
      minimum: '-999',
      constructor: 'safe',
      toString: 'safe',
      ['__proto__']: 'safe',
    };
    await router.request(`/?${new URLSearchParams(query)}`);
    expect((output.records()[0].req as { query: unknown }).query).toEqual(
      query,
    );
  });

  it('bounds query entry counts and names without truncating them', async () => {
    const output = createMemoryDestination();
    const router = new Hono();
    router.use('*', requestLogger({ logger: createLogger({}, output) }));
    router.get('/', (context) => context.text('ok'));
    const query = Object.fromEntries(
      Array.from({ length: 25 }, (_, index) => [`key${index}`, 'valid']),
    );
    await router.request(
      `/?${new URLSearchParams({ ['a'.repeat(65)]: 'valid', ...query })}`,
    );
    expect(output.records()[0].req).toMatchObject({
      query: Object.fromEntries(Object.entries(query).slice(0, 20)),
    });
    expect(
      Object.keys((output.records()[0].req as { query: object }).query),
    ).toHaveLength(20);
  });

  it.each([200, 400, 500, 'throw'] as const)(
    'redacts download and reset tokens in paths, params and messages (%s)',
    async (status) => {
      const output = createMemoryDestination();
      const router = new Hono();
      const middleware = requestLogger({
        logger: createLogger({ level: 'debug' }, output),
      });
      router.use('*', middleware);
      const routes = [
        '/main/api/releaseDownloads/:token',
        '/main/api/auth/reset-password/:token',
        '/main/api/confirm/:sessionId/:issueId',
      ];
      const token = 'aHidden/credential123';
      const issueId = '394741478850560';
      for (const route of routes) {
        router.get(route, async (context) => {
          expect(
            context.req.param('token') ?? context.req.param('sessionId'),
          ).toBe(token);
          if (status === 'throw') {
            await expect(
              middleware(context, async () => {
                throw new Error('failed');
              }),
            ).rejects.toThrow('failed');
            return context.text('ok');
          }
          return context.json({}, status);
        });
      }
      for (const route of routes) {
        const response = await router.request(
          route
            .replace(':token', encodeURIComponent(token))
            .replace(':sessionId', encodeURIComponent(token))
            .replace(':issueId', issueId),
          {
            headers: {
              referer: `http://localhost/reset-password/${encodeURIComponent(token)}?token=${token}`,
            },
          },
        );
        expect(response.status).toBe(status === 'throw' ? 200 : status);
      }
      const records = output.records();
      expect(JSON.stringify(records)).not.toContain(token);
      expect(JSON.stringify(records)).not.toContain(encodeURIComponent(token));
      for (const record of records) {
        const req = record.req as {
          path: string;
          params?: Record<string, string>;
        };
        expect(routes).toContain(req.path);
        if (req.params?.token) expect(req.params.token).toBe('[REDACTED]');
        if (req.params?.sessionId)
          expect(req.params.sessionId).toBe('[REDACTED]');
        if (req.params?.issueId) expect(req.params.issueId).toBe(issueId);
        const headers = (record.req as { headers?: Record<string, string> })
          .headers;
        if (headers) expect(headers.referer).toBe('http://localhost');
      }
      const completed = records.filter((record) => record.res !== undefined);
      expect(completed).toHaveLength(status === 'throw' ? 6 : 3);
      expect(
        completed.find(
          (record) => (record.req as { path: string }).path === routes[2],
        )?.req,
      ).toMatchObject({ params: { issueId, sessionId: '[REDACTED]' } });
      expect(
        completed.some(
          (record) =>
            (record.req as { params?: Record<string, string> }).params
              ?.token === '[REDACTED]',
        ),
      ).toBe(true);
    },
  );

  it.each([200, 500] as const)(
    'hides token suffixes behind wildcard mounts (%s)',
    async (status) => {
      const output = createMemoryDestination();
      const router = new Hono();
      router.use(
        '*',
        requestLogger({ logger: createLogger({ level: 'debug' }, output) }),
      );
      router.all('/main/api/auth/*', (context) => context.json({}, status));
      router.get('*', (context) => context.text('fallback'));
      await router.request(
        '/main/api/auth/reset-password/aHiddenCredential123',
      );
      expect(output.records()).toHaveLength(2);
      expect(JSON.stringify(output.records())).not.toContain(
        'aHiddenCredential123',
      );
      for (const record of output.records())
        expect(record.req).toMatchObject({ path: '/main/api/auth/*' });
    },
  );

  it('applies the same validation when downstream middleware throws', async () => {
    const output = createMemoryDestination();
    const router = new Hono();
    const middleware = requestLogger({
      logger: createLogger({ level: 'debug' }, output),
    });
    router.get('/runs', async (context) => {
      await expect(
        middleware(context, async () => {
          throw new Error('failed');
        }),
      ).rejects.toThrow('failed');
      return context.text('ok');
    });
    await router.request(
      '/runs?limit=private-text&customKind=customRun&token=abc&code=abcdef1234567890abcd&state=oauthState123&subjectId=' +
        '1'.repeat(1000),
    );
    expect(output.records()).toHaveLength(2);
    for (const record of output.records())
      expect((record.req as { query: unknown }).query).toEqual({
        customKind: 'customRun',
      });
    expect(JSON.stringify(output.records())).not.toMatch(
      /private-text|abcdef1234567890abcd|oauthState123/,
    );
  });

  it.each([
    [
      { 'x-nocobase-runner-key': 'hidden', 'x-nocobase-run-token': 'hidden' },
      'runner',
    ],
    [
      { 'x-nocobase-run-token': 'hidden', 'x-nocobase-client': 'cli' },
      'agentRun',
    ],
    [{ 'x-nocobase-client': 'cli', 'x-api-key': 'hidden' }, 'cli'],
    [{ 'x-api-key': 'hidden', cookie: 'hidden' }, 'apiKey'],
    [{ cookie: 'hidden' }, 'browser'],
    [{}, 'anonymous'],
  ])(
    'classifies the caller without logging credentials (%j)',
    async (headers, caller) => {
      const output = createMemoryDestination();
      const router = new Hono();
      router.use('*', requestLogger({ logger: createLogger({}, output) }));
      router.get('/', (context) => context.text('ok'));
      await router.request('/', { headers });
      expect(output.records()[0].req).toMatchObject({ caller });
      expect(JSON.stringify(output.records())).not.toContain('hidden');
    },
  );
});

type MemoryDestination = DestinationStream & {
  records(): Array<Record<string, unknown>>;
};

function createMemoryDestination(): MemoryDestination {
  const lines: string[] = [];
  return {
    write(message: string): void {
      lines.push(message);
    },
    records(): Array<Record<string, unknown>> {
      return lines
        .join('')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
    },
  };
}
