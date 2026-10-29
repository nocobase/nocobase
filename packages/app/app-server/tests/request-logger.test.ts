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
          path: '/users/42',
          query: { limit: '20' },
          caller: 'anonymous',
          headers: {
            'user-agent': 'vitest',
            'x-request-source': 'cli',
          },
        },
        msg: 'GET /users/42 started',
      }),
      expect.objectContaining({
        level: 30,
        app: 'main',
        req: {
          method: 'GET',
          path: '/users/42',
          route: '/users/:id',
          params: { id: '42' },
          query: { limit: '20' },
          caller: 'anonymous',
        },
        res: expect.objectContaining({ status: 200 }),
        durationMs: expect.any(Number),
        msg: 'GET /users/42 200 completed',
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
          query: {},
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
        token: 'token-value',
        password: 'password-value',
        q: 'private-search',
        filter: '{"secret":"private-filter"}',
        cursor: 'opaque-cursor',
      });
      await router.request(`/runs?${query}`, {
        headers: { 'x-nocobase-run-token': 'run-secret' },
      });
      expect(output.records()).toHaveLength(2);
      for (const record of output.records()) {
        expect(record.req).toMatchObject({
          query: {
            subjectId: '394741478850560',
            limit: '20',
            status: 'running',
          },
          caller: 'agentRun',
        });
      }
      expect(JSON.stringify(output.records())).not.toMatch(
        /token-value|password-value|private-search|private-filter|opaque-cursor|run-secret/,
      );
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
        mode: 'private-mode',
        view: 'private-view',
        status: '任意正文',
        statusKey: 'private-status',
        subjectKind: 'private-kind',
        subjectId: 'i'.repeat(1000),
        agentId: 'private-agent',
        runnerId: 'private-runner',
        projectId: '123\nsecret',
        issueId: '123 secret',
        appId: 'private-app',
        environmentId: 'private-environment',
        sort: 'private-sort',
        direction: 'private-direction',
        purpose: 'private-purpose',
        includeArchived: 'private-boolean',
      });
      await router.request(`/?${query}`);
      expect(output.records()).toHaveLength(2);
      for (const record of output.records())
        expect(record.req).toMatchObject({ query: {} });
      expect(JSON.stringify(output.records())).not.toMatch(
        /private-|任意正文|secret|iiii/,
      );
    },
  );

  it('accepts bounded numeric, boolean, enum and structured identifier values', async () => {
    const output = createMemoryDestination();
    const router = new Hono();
    router.use('*', requestLogger({ logger: createLogger({}, output) }));
    router.get('/', (context) => context.text('ok'));
    const query = {
      limit: '100',
      offset: '0',
      page: '1',
      pageSize: '50',
      mode: 'table',
      view: 'board',
      status: 'queued',
      statusKey: 'backlog',
      subjectKind: 'issue',
      subjectId: '123',
      agentId: 'dba9a7e6-79f5-4cd0-bf2a-f24f87184461',
      runnerId: '124',
      projectId: '125',
      issueId: '126',
      appId: '127',
      environmentId: '128',
      sort: 'updated',
      direction: 'desc',
      purpose: 'preview',
      includeArchived: 'false',
    };
    await router.request(`/?${new URLSearchParams(query)}`);
    expect(output.records()[0].req).toMatchObject({ query });
  });

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
      '/runs?limit=private-text&status=running&subjectId=' + '1'.repeat(1000),
    );
    expect(output.records()).toHaveLength(2);
    for (const record of output.records())
      expect(record.req).toMatchObject({ query: { status: 'running' } });
    expect(JSON.stringify(output.records())).not.toContain('private-text');
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
