import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { Application } from '../src/application/index.js';
import {
  AppConfig,
  createAppPaths,
  defaultAppConfigs,
} from '../src/config/index.js';
import {
  apiRateLimitMiddleware,
  defineApiConfig,
  defineApiRoutes,
  healthCheckApiRoutes,
  parseApiDuration,
  parseApiSize,
  requestIdMiddleware,
  type ApiConfig,
} from '../src/router/index.js';
import type { AppRuntimeContext } from '../src/runtime/definition.js';

const appSection = {
  name: 'main',
  publicBasePath: '/main',
  internalBasePath: '',
  publicApiUrl: '/main/api',
};

/** The bindings `@hono/node-server` passes to `fetch`, carrying the connection's remote address. */
function nodeBindings(address: string): unknown {
  return { incoming: { socket: { remoteAddress: address } } };
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function createApp(api?: ApiConfig): Promise<Application> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ app: appSection, ...(api ? { api } : {}) });
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/app' }),
  });
  app.addRoutes(healthCheckApiRoutes);
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post('/echo', async (context) => {
        const body = await context.req.text();
        return context.json({ data: { length: body.length } });
      });
      router.get('/slow', async (context) => {
        await sleep(150);
        return context.json({ data: 'done' });
      });
      router.get('/slow-failure', async () => {
        await sleep(100);
        throw new Error('failed after the deadline');
      });
      router.get('/stream', () => {
        const encoder = new TextEncoder();
        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (let index = 0; index < 4; index += 1) {
              controller.enqueue(encoder.encode(`data: ${index}\n\n`));
              await sleep(40);
            }
            controller.close();
          },
        });
        return new Response(body, {
          headers: { 'content-type': 'text/event-stream' },
        });
      });
      router.get('/ok', (context) => context.json({ data: true }));
      return router;
    }),
  );
  return app;
}

function post(size: number, init: RequestInit = {}): Request {
  return new Request('http://localhost/api/echo', {
    method: 'POST',
    body: 'x'.repeat(size),
    ...init,
  });
}

/** A body sent without a length, as a chunked upload is. */
function chunkedPost(size: number): Request {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let sent = 0; sent < size; sent += 1024) {
        controller.enqueue(
          new TextEncoder().encode('x'.repeat(Math.min(1024, size - sent))),
        );
      }
      controller.close();
    },
  });
  return new Request('http://localhost/api/echo', {
    method: 'POST',
    body,
    duplex: 'half',
  } as RequestInit);
}

describe('api limits off by default', () => {
  it('accepts a large body, a slow handler and many requests', async () => {
    const app = await createApp();

    const large = await app.fetch(post(2 * 1024 * 1024));
    expect(large.status).toBe(200);
    expect(await large.json()).toEqual({ data: { length: 2 * 1024 * 1024 } });

    expect(
      (await app.fetch(new Request('http://localhost/api/slow'))).status,
    ).toBe(200);

    for (let index = 0; index < 50; index += 1) {
      const response = await app.fetch(
        new Request('http://localhost/api/ok'),
        nodeBindings('203.0.113.1'),
      );
      expect(response.status).toBe(200);
    }
  });

  it('treats null values as unset', async () => {
    const app = await createApp({
      bodyLimit: null,
      timeout: null,
      rateLimit: null,
    });

    expect((await app.fetch(post(64 * 1024))).status).toBe(200);
  });
});

describe('api.bodyLimit', () => {
  it('refuses a body over the limit with 413 BODY_TOO_LARGE', async () => {
    const app = await createApp({ bodyLimit: '1kb' });

    const response = await app.fetch(
      post(2048, { headers: { 'x-request-id': 'trace-body' } }),
    );

    expect(response.status).toBe(413);
    expect(response.headers.get('x-request-id')).toBe('trace-body');
    expect(await response.json()).toMatchObject({
      error: {
        code: 413,
        status: 'INVALID_ARGUMENT',
        reason: 'BODY_TOO_LARGE',
        domain: 'app',
        requestId: 'trace-body',
      },
    });
  });

  it('refuses a chunked body once it grows past the limit', async () => {
    const app = await createApp({ bodyLimit: '1kb' });

    const response = await app.fetch(chunkedPost(4096));

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      error: { reason: 'BODY_TOO_LARGE', domain: 'app' },
    });
  });

  it('passes a body within the limit to the route intact', async () => {
    const app = await createApp({ bodyLimit: 1024 });

    const declared = await app.fetch(post(1024));
    expect(declared.status).toBe(200);
    expect(await declared.json()).toEqual({ data: { length: 1024 } });

    const chunked = await app.fetch(chunkedPost(1000));
    expect(chunked.status).toBe(200);
    expect(await chunked.json()).toEqual({ data: { length: 1000 } });
  });
});

describe('api.timeout', () => {
  it('answers 503 REQUEST_TIMEOUT when the handler misses the deadline', async () => {
    const app = await createApp({ timeout: '50ms' });

    const response = await app.fetch(
      new Request('http://localhost/api/slow', {
        headers: { 'x-request-id': 'trace-slow' },
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('x-request-id')).toBe('trace-slow');
    expect(await response.json()).toMatchObject({
      error: {
        code: 503,
        status: 'UNAVAILABLE',
        reason: 'REQUEST_TIMEOUT',
        domain: 'app',
        requestId: 'trace-slow',
      },
    });
  });

  it('discards a handler that fails after the deadline', async () => {
    const app = await createApp({ timeout: 20 });

    const response = await app.fetch(
      new Request('http://localhost/api/slow-failure'),
    );
    expect(response.status).toBe(503);
    // Let the handler fail; an unhandled rejection would fail the run.
    await sleep(150);
  });

  it('lets a handler within the deadline answer', async () => {
    const app = await createApp({ timeout: '1s' });

    const response = await app.fetch(new Request('http://localhost/api/slow'));

    expect(response.status).toBe(200);
  });

  it('does not cut off a streaming response that outlives the deadline', async () => {
    const app = await createApp({ timeout: '50ms' });

    const startedAt = Date.now();
    const response = await app.fetch(
      new Request('http://localhost/api/stream'),
    );
    expect(response.status).toBe(200);
    const text = await response.text();

    expect(Date.now() - startedAt).toBeGreaterThan(100);
    expect(text).toBe('data: 0\n\ndata: 1\n\ndata: 2\n\ndata: 3\n\n');
  });
});

describe('api.rateLimit', () => {
  it('answers 429 RATE_LIMITED with Retry-After once a client exceeds max', async () => {
    const app = await createApp({ rateLimit: { max: 3, window: '1m' } });
    const client = nodeBindings('203.0.113.7');

    for (let index = 0; index < 3; index += 1) {
      const response = await app.fetch(
        new Request('http://localhost/api/ok'),
        client,
      );
      expect(response.status).toBe(200);
    }
    const limited = await app.fetch(
      new Request('http://localhost/api/ok', {
        headers: { 'x-request-id': 'trace-rate' },
      }),
      client,
    );

    expect(limited.status).toBe(429);
    expect(limited.headers.get('x-request-id')).toBe('trace-rate');
    const retryAfter = Number(limited.headers.get('retry-after'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(await limited.json()).toMatchObject({
      error: {
        code: 429,
        status: 'RESOURCE_EXHAUSTED',
        reason: 'RATE_LIMITED',
        domain: 'app',
        requestId: 'trace-rate',
      },
    });
  });

  it('counts each client address separately', async () => {
    const app = await createApp({ rateLimit: { max: 1, window: '1m' } });

    expect(
      (
        await app.fetch(
          new Request('http://localhost/api/ok'),
          nodeBindings('203.0.113.1'),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await app.fetch(
          new Request('http://localhost/api/ok'),
          nodeBindings('203.0.113.1'),
        )
      ).status,
    ).toBe(429);
    expect(
      (
        await app.fetch(
          new Request('http://localhost/api/ok'),
          nodeBindings('203.0.113.2'),
        )
      ).status,
    ).toBe(200);
  });

  it('counts unknown paths and Better Auth routes, but never /api/healthz', async () => {
    const app = await createApp({ rateLimit: { max: 2, window: '1m' } });
    const client = nodeBindings('203.0.113.9');

    for (let index = 0; index < 5; index += 1) {
      const health = await app.fetch(
        new Request('http://localhost/api/healthz'),
        client,
      );
      expect(health.status).toBe(200);
    }
    expect(
      (
        await app.fetch(
          new Request('http://localhost/api/auth/sign-in/email', {
            method: 'POST',
          }),
          client,
        )
      ).status,
    ).toBe(404);
    expect(
      (await app.fetch(new Request('http://localhost/api/ok'), client)).status,
    ).toBe(200);
    expect(
      (await app.fetch(new Request('http://localhost/api/ok'), client)).status,
    ).toBe(429);
  });

  it('does not count a request whose client address is unknown', async () => {
    const app = await createApp({ rateLimit: { max: 1, window: '1m' } });

    for (let index = 0; index < 3; index += 1) {
      expect(
        (await app.fetch(new Request('http://localhost/api/ok'))).status,
      ).toBe(200);
    }
  });

  it('starts a new window once the old one expires', async () => {
    let now = 1_000_000;
    const router = new Hono();
    router.use('*', requestIdMiddleware());
    router.use(
      '*',
      apiRateLimitMiddleware({ max: 1, windowMs: 10_000 }, { now: () => now }),
    );
    router.get('/api/ok', (context) => context.json({ data: true }));
    const client = nodeBindings('198.51.100.4');
    const fetchOk = (): Promise<Response> =>
      Promise.resolve(
        router.fetch(new Request('http://localhost/api/ok'), client as never),
      );

    expect((await fetchOk()).status).toBe(200);
    now += 4_000;
    const limited = await fetchOk();
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('6');
    now += 6_000;
    expect((await fetchOk()).status).toBe(200);
  });
});

describe('api configuration', () => {
  const runtime = {} as AppRuntimeContext;

  async function validate(api: Record<string, unknown>): Promise<unknown[]> {
    const config = new AppConfig().load({
      name: 'test',
      read: async () => ({ kind: 'map', value: { api } }),
    });
    await config.loadAll();
    const defaults = defaultAppConfigs({ api: defineApiConfig() });
    config.mergeDefaults(defaults(runtime));
    config.defineSections(defaults.sections!);
    return [...(await config.validate())];
  }

  it('accepts sizes, durations and a rate limit', async () => {
    expect(
      await validate({
        bodyLimit: '10mb',
        timeout: '30s',
        rateLimit: { max: 600, window: '1m' },
      }),
    ).toEqual([]);
    expect(await validate({ bodyLimit: 1024, timeout: 500 })).toEqual([]);
    expect(await validate({})).toEqual([]);
  });

  it('reports malformed values with their paths', async () => {
    const issues = await validate({
      bodyLimit: 'ten megabytes',
      timeout: '-5s',
      rateLimit: { max: 1.5, windo: '1m' },
      rateLimt: {},
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: 'error', path: 'api.bodyLimit' }),
        expect.objectContaining({ level: 'error', path: 'api.timeout' }),
        expect.objectContaining({ level: 'error', path: 'api.rateLimit.max' }),
        expect.objectContaining({
          level: 'error',
          path: 'api.rateLimit.window',
        }),
        expect.objectContaining({
          level: 'warning',
          path: 'api.rateLimit.windo',
        }),
        expect.objectContaining({ level: 'warning', path: 'api.rateLimt' }),
      ]),
    );
    expect(issues).toContainEqual({
      level: 'error',
      path: 'api.bodyLimit',
      message: 'must be a positive size such as "512kb", "10mb" or "1gb".',
    });
  });

  it('rejects a rate limit that is not a mapping', async () => {
    expect(await validate({ rateLimit: 600 })).toEqual([
      expect.objectContaining({ level: 'error', path: 'api.rateLimit' }),
    ]);
  });

  it('maps API_BODY_LIMIT and API_TIMEOUT', async () => {
    const config = new AppConfig();
    await config.loadAll();
    const defaults = defaultAppConfigs({ api: defineApiConfig() });
    config.mergeDefaults(defaults(runtime));
    config.defineSections(defaults.sections!);
    await config.loadSectionEnvironment({
      API_BODY_LIMIT: '5mb',
      API_TIMEOUT: '10s',
    });

    expect(config.get('api')).toEqual({ bodyLimit: '5mb', timeout: '10s' });
  });

  it('refuses to start on a malformed limit', async () => {
    const app = await createApp({ timeout: 'soon' });

    await expect(
      app.fetch(new Request('http://localhost/api/ok')),
    ).rejects.toThrow('api.timeout must be a positive duration');
  });

  it('parses durations and sizes', () => {
    expect(parseApiDuration('30s', 'x')).toBe(30_000);
    expect(parseApiDuration('1.5m', 'x')).toBe(90_000);
    expect(parseApiDuration('250', 'x')).toBe(250);
    expect(parseApiSize('10MB', 'x')).toBe(10 * 1024 * 1024);
    expect(parseApiSize('512 kb', 'x')).toBe(512 * 1024);
    expect(() => parseApiSize('10tb', 'x')).toThrow(
      'x must be a positive size',
    );
    expect(() => parseApiDuration(0, 'x')).toThrow(
      'x must be a positive duration',
    );
  });
});
