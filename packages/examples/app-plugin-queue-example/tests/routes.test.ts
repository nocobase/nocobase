import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  createAppPaths,
  type AppConfigAccessor,
} from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { queueServiceToken } from '@nocobase/app-server/queue';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { createQueueService, type QueueService } from '@nocobase/queue';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueueExampleProvider } from '../server/providers/queue-example.js';
import { apiRoutes } from '../server/routes/index.js';
import {
  queueExampleServiceToken,
  type QueueExampleStatus,
} from '../server/service.js';

const allow = {
  required: () => async (_context: unknown, next: () => Promise<void>) =>
    next(),
} as unknown as Auth;
const deny = {
  required:
    () => (context: { json: (body: unknown, status: number) => Response }) =>
      context.json({ code: 'UNAUTHORIZED' }, 401),
} as unknown as Auth;

let directory: string;
const services: QueueService[] = [];

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'queue-example-'));
});

afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((queue) => queue.shutdown()));
  await rm(directory, { recursive: true, force: true });
});

/** One application start: a queue service over the same storage each time. */
async function start(
  authentication: Auth,
  settings: Record<string, unknown> = {},
) {
  const queue = createQueueService(
    {
      default: 'memory',
      memory: { adapter: 'inMemory', persistence: { path: directory } },
      background: {
        adapter: 'inMemory',
        namespace: 'background',
        persistence: { path: directory },
      },
    },
    { appName: 'main', storagePath: directory },
  );
  services.push(queue);
  const container = new ServiceContainer();
  container.instance(queueServiceToken, queue);
  container.instance(authenticationToken, authentication);
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: createConfigAccessor(settings),
    paths: createAppPaths({ rootDir: directory }),
    router: new Hono(),
    container,
  };
  const provider = new QueueExampleProvider(app);
  provider.register();
  await provider.boot();
  await queue.setup();
  const router = await apiRoutes.createRouter(app);
  return { queue, provider, router, container };
}

async function deliveries(router: Hono): Promise<QueueExampleStatus> {
  const response = await router.request('/queueExample/status');
  return ((await response.json()) as { data: QueueExampleStatus }).data;
}

function greet(router: Hono, body?: unknown): Promise<Response> {
  return Promise.resolve(
    router.request('/queueExample/greet', {
      method: 'POST',
      ...(body === undefined
        ? {}
        : {
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          }),
    }),
  );
}

describe('queue example plugin', () => {
  it('publishes a greeting that both handlers receive', async () => {
    const { router } = await start(allow);

    const response = await greet(router);

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        jobId: expect.any(String),
        queue: 'queue-example',
        channel: 'greeting',
      },
    });
    await vi.waitFor(async () => {
      const status = await deliveries(router);
      expect(status.deliveries.map(({ handler }) => handler).sort()).toEqual([
        'audit',
        'greeting',
      ]);
    });
  });

  it('delays a greeting on request and rejects an invalid delay', async () => {
    const { router } = await start(allow);

    const invalid = await greet(router, { delay: 'soon' });
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: 'delay' })],
      },
    });
    expect((await greet(router, { delay: 600_001 })).status).toBe(400);
    expect((await greet(router, { delay: 300, extra: true })).status).toBe(400);
    const started = Date.now();
    expect((await greet(router, { delay: 300 })).status).toBe(202);
    await vi.waitFor(async () => {
      expect((await deliveries(router)).deliveries).toHaveLength(2);
    });
    expect(Date.now() - started).toBeGreaterThanOrEqual(250);
  });

  it('publishes digests in a batch and skips a day already published', async () => {
    const { router } = await start(allow);

    const first = await router.request('/queueExample/digests', {
      method: 'POST',
    });
    const second = await router.request('/queueExample/digests', {
      method: 'POST',
    });

    const { data: receipts } = (await first.json()) as {
      data: Array<{ jobId: string }>;
    };
    expect(receipts).toHaveLength(2);
    expect(receipts[0].jobId).toMatch(/^digest-\d{4}-\d{2}-\d{2}-morning$/u);
    await expect(second.json()).resolves.toEqual({ data: receipts });
    await vi.waitFor(async () => {
      const status = await deliveries(router);
      // Only the audit handler takes digests.
      expect(status.deliveries).toHaveLength(2);
      expect(
        status.deliveries.every(({ handler }) => handler === 'audit'),
      ).toBe(true);
    });
  });

  it('runs on the configuration key its settings name', async () => {
    const { router } = await start(allow, {
      queueExample: { queue: 'background' },
    });

    await expect(deliveries(router)).resolves.toMatchObject({
      configKey: 'background',
    });
    await greet(router);
    await vi.waitFor(async () => {
      expect((await deliveries(router)).deliveries).toHaveLength(2);
    });
  });

  it('keeps pending greetings for the next start after its handlers unregister', async () => {
    const first = await start(allow);
    await first.provider.shutdown();
    // Handlers are gone, so the job waits in the queue.
    await greet(first.router);
    await first.queue.shutdown();

    const second = await start(allow);
    await vi.waitFor(async () => {
      expect((await deliveries(second.router)).deliveries).toHaveLength(2);
    });
  });

  it('rejects anonymous requests without affecting later Route contributions', async () => {
    const { container } = await start(deny);
    const application = new Hono();
    application.route(
      '/api',
      await apiRoutes.createRouter({
        appName: 'main',
        publicBasePath: '',
        config: createConfigAccessor({}),
        paths: createAppPaths({ rootDir: directory }),
        router: new Hono(),
        container,
      }),
    );
    application.get('/api/later-plugin', (context) => context.text('later'));

    for (const [method, path] of [
      ['POST', '/api/queueExample/greet'],
      ['POST', '/api/queueExample/digests'],
      ['GET', '/api/queueExample/status'],
    ] as const)
      expect((await application.request(path, { method })).status).toBe(401);
    await expect(
      (await application.request('/api/later-plugin')).text(),
    ).resolves.toBe('later');
    expect(
      container.resolve(queueExampleServiceToken).status().deliveries,
    ).toEqual([]);
  });

  it('declares an API Route contribution', () => {
    expect(apiRoutes).toMatchObject({ scope: 'api' });
  });

  it('declares every route for the API document', async () => {
    const { router } = await start(allow);

    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Queue example', version: '0.0.0' },
    });
    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}),
    ) as { operationId?: string; tags?: string[] }[];
    expect(operations.map(({ operationId }) => operationId).sort()).toEqual([
      'queueExampleGetStatus',
      'queueExamplePublishDigests',
      'queueExamplePublishGreeting',
    ]);
    expect(operations.every(({ tags }) => tags?.[0] === 'QueueExample')).toBe(
      true,
    );
    expect(document.components?.schemas).toHaveProperty('QueueExampleStatus');
  });
});

function createConfigAccessor(
  values: Record<string, unknown>,
): AppConfigAccessor {
  return {
    get: <TValue>(key: string): TValue | undefined =>
      values[key] as TValue | undefined,
    raw: () => values,
    reload: async () => ({ changedNamespaces: [] }),
    subscribe: () => () => undefined,
  } as AppConfigAccessor;
}
