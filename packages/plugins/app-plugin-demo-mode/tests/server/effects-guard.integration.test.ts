import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import {
  apiErrorHandler,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { createTestApp } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { expect, it } from 'vitest';

import { demoEffectsGuard } from '../../server/index.js';
import { createMinimalServerFactory } from '../helpers/minimal-app.js';

it('guards a nested deployment with localized errors while allowed requests retain authentication and SQL protection', async () => {
  let handled = 0;
  const app = await createTestApp({
    server: { basePath: '/suite/demo' },
    config: { demoMode: { enabled: true } },
    createServer: createMinimalServerFactory((application) => {
      application.addHttpMiddleware(
        demoEffectsGuard({
          paths: ['/api/guarded/*', '/api/demoMode/*'],
          allow: [
            { method: 'POST', path: '/api/guarded/query' },
            { method: 'POST', path: '/api/demoMode/accounts/signInDefault' },
            { method: 'POST', path: '/api/demoMode/data/clear' },
          ],
        }),
      );
      application.addRoutes(
        defineApiRoutes(({ container }) => {
          const router = new Hono();
          router.onError(apiErrorHandler);
          router.post(
            '/guarded/query',
            container.resolve(authenticationToken).required(),
            describeRoute({
              summary: 'Exercise database protection after an HTTP exception',
              operationId: 'testGuardedQuery',
              responses: { 200: { description: 'Query completed' } },
            }),
            async (context) => {
              handled++;
              await container
                .resolve(databaseManagerToken)
                .query()
                .insertInto('demotasks')
                .values({ id: 'should-not-exist', title: 'Forbidden' })
                .execute();
              return context.json({ data: true });
            },
          );
          return router;
        }),
      );
    }),
  });
  try {
    expect(app.publicBasePath).toBe('/suite/demo');
    const blocked = await app.request('/guarded/send', {
      method: 'POST',
      headers: { 'accept-language': 'zh-CN', 'x-request-id': 'nested-demo' },
      body: 'unparsed',
    });
    expect(blocked.status).toBe(400);
    expect(blocked.headers.get('Server-Timing')).toContain('demo-read-only');
    expect(await blocked.json()).toMatchObject({
      error: {
        reason: 'DEMO_READ_ONLY',
        requestId: 'nested-demo',
        localizedMessage: { locale: 'zh-CN', message: '演示模式不能修改' },
      },
    });
    const english = await app.request('/guarded/send', {
      method: 'POST',
      headers: { 'accept-language': 'en-US' },
    });
    expect(await english.json()).toMatchObject({
      error: {
        localizedMessage: {
          locale: 'en-US',
          message: 'This is a demo. Changes cannot be saved.',
        },
      },
    });
    expect(
      (await app.request('/guarded/query', { method: 'POST' })).status,
    ).toBe(401);
    expect(
      (await app.request('/demoMode/data/clear', { method: 'POST' })).status,
    ).toBe(401);
    expect(handled).toBe(0);
    const home = await app.request('/demoMode/accounts/signInDefault', {
      method: 'POST',
      headers: { origin: 'http://localhost' },
    });
    expect(home.status).toBe(200);
    expect(await home.json()).toEqual({ data: { signedIn: true } });
    const cookie = home.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    const write = await app.request('/guarded/query', {
      method: 'POST',
      headers: { cookie, origin: 'http://localhost' },
    });
    expect(handled).toBe(1);
    expect(write.status).toBe(400);
    expect(await write.json()).toMatchObject({
      error: { reason: 'DEMO_READ_ONLY' },
    });
    const rows = await app.connection.query
      .selectFrom('demotasks')
      .select(['id'])
      .execute();
    expect(rows).toEqual([]);
  } finally {
    await app.close();
  }
});
