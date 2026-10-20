import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createAppPaths } from '@nocobase/app-server/config';
import {
  createRealtimeService,
  type RealtimeService,
} from '@nocobase/app-server/realtime';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import {
  RealtimeExampleService,
  realtimeExampleServiceToken,
} from '../server/demo-service.js';
import { apiRoutes } from '../server/routes/api.js';
import type { DemoState } from '../shared/demo.js';

describe('realtime example HTTP boundary', () => {
  let database: TestDatabase;
  let realtime: RealtimeService;
  let demo: RealtimeExampleService;
  let router: Hono;
  beforeAll(async () => {
    database = await createTestDatabase();
    realtime = createRealtimeService();
    demo = new RealtimeExampleService(realtime);
    await realtime.setup();
    const auth = new Auth({
      connection: database.connection,
      secret: 'realtime-example-test-secret-at-least-32-characters',
      baseURL: 'http://localhost/api/auth',
    });
    vi.spyOn(auth, 'getSession').mockImplementation(async (headers) => {
      const id = headers.get('x-test-user');
      return id
        ? {
            user: {
              id,
              name: id,
              email: `${id}@example.test`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            session: {
              id: `session-${id}`,
              token: 'test-token',
              userId: id,
              expiresAt: new Date(Date.now() + 60_000),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          }
        : null;
    });
    const container = new ServiceContainer();
    container.instance(authenticationToken, auth);
    container.instance(realtimeExampleServiceToken, demo);
    router = new Hono();
    router.route(
      '/prefix/api',
      await apiRoutes.createRouter({
        appName: 'example',
        publicBasePath: '/prefix',
        config: { app: { name: 'example', publicBasePath: '/prefix' } },
        paths: createAppPaths({ rootDir: '/missing' }),
        router,
        container,
      }),
    );
    router.get('/prefix/api/unrelated', (c) => c.json({ ok: true }));
  });
  afterAll(async () => {
    demo?.close();
    await realtime?.close();
    await database?.destroy();
    vi.restoreAllMocks();
  });
  const send = (path: string, user?: string, method = 'GET', json?: unknown) =>
    router.request(`/prefix/api/realtimeExample/${path}`, {
      method,
      headers: {
        ...(user ? { 'x-test-user': user } : {}),
        ...(json === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(json === undefined ? {} : { body: JSON.stringify(json) }),
    });

  it('authenticates every path without protecting an unrelated contribution', async () => {
    for (const [path, method] of [
      ['state', 'GET'],
      ['personal', 'GET'],
      ['personal/events', 'POST'],
      ['counter', 'GET'],
      ['counter/events', 'POST'],
      ['rooms/missing', 'GET'],
      ['rooms/missing/access', 'PATCH'],
      ['rooms/missing/events', 'POST'],
      ['connection/disconnect', 'POST'],
    ]) {
      expect(
        (
          await send(
            path!,
            undefined,
            method,
            method === 'GET' ? undefined : {},
          )
        ).status,
      ).toBe(401);
    }
    expect((await router.request('/prefix/api/unrelated')).status).toBe(200);
  });

  it('isolates personal state and rejects caller-selected recipients and invalid burst sizes', async () => {
    expect(
      (await send('personal/events', 'alice', 'POST', { userId: 'bob' }))
        .status,
    ).toBe(400);
    expect((await send('personal/events', 'alice', 'POST', {})).status).toBe(
      200,
    );
    expect(await (await send('personal', 'alice')).json()).toMatchObject({
      data: { value: 1 },
    });
    expect(await (await send('personal', 'bob')).json()).toMatchObject({
      data: { value: 0 },
    });
    expect(
      (await send('counter/events', 'alice', 'POST', { count: 21 })).status,
    ).toBe(400);
    expect(
      (await send('counter/events', 'alice', 'POST', { count: 5 })).status,
    ).toBe(200);
    expect(await (await send('counter', 'alice')).json()).toMatchObject({
      data: { value: 5 },
    });
    expect(await (await send('counter', 'bob')).json()).toMatchObject({
      data: { value: 0 },
    });
  });

  it('requires the owner for access changes and current permission for room reads and writes', async () => {
    const state = (await (await send('state', 'room-owner')).json()) as {
      data: DemoState;
    };
    const path = `rooms/${state.data.room.id}`;
    expect((await send(path, 'room-owner')).status).toBe(403);
    expect(
      (await send(`${path}/access`, 'outsider', 'PATCH', { allowed: true }))
        .status,
    ).toBe(404);
    expect(
      (await send(`${path}/access`, 'room-owner', 'PATCH', { allowed: true }))
        .status,
    ).toBe(200);
    expect((await send(path, 'outsider')).status).toBe(404);
    expect((await send(`${path}/events`, 'outsider', 'POST', {})).status).toBe(
      404,
    );
    expect(
      (await send(`${path}/events`, 'room-owner', 'POST', {})).status,
    ).toBe(200);
    expect(await (await send(path, 'room-owner')).json()).toMatchObject({
      data: { value: 1 },
    });
    expect(
      (await send(`${path}/access`, 'room-owner', 'PATCH', { allowed: false }))
        .status,
    ).toBe(200);
    expect(
      (await send(`${path}/events`, 'room-owner', 'POST', {})).status,
    ).toBe(403);
  });

  it('declares all demonstration APIs with complete response schemas', async () => {
    expect(
      findUndeclaredApiRoutes(router, '').filter((route) =>
        route.path.includes('/realtimeExample/'),
      ),
    ).toEqual([]);
    const document = await generateApiDocument(router, {
      prefix: '',
      info: { title: 'Realtime example', version: 'test' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      document.paths?.['/prefix/api/realtimeExample/connection/disconnect']
        ?.post?.operationId,
    ).toBe('realtimeExampleDisconnect');
  });
});
