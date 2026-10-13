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

    await router.request('/users/42?active=true', {
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
          query: { active: 'true' },
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
