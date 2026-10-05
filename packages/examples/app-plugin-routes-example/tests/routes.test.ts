import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { apiRoutes } from '../server/routes/api.js';
import routes from '../server/routes/index.js';
import { rootRoutes } from '../server/routes/root.js';

const allowAuthentication = {
  required: () => async (_context, next) => next(),
} as unknown as Auth;

const denyAuthentication = {
  required: () => (context) =>
    context.json(
      { code: 'UNAUTHORIZED', message: 'Authentication required' },
      401,
    ),
} as unknown as Auth;

describe('routes example plugin', () => {
  it('serves API and Root Routes after their own authentication boundaries allow the request', async () => {
    const apiRouter = await apiRoutes.createRouter(
      createApplication(allowAuthentication),
    );
    const rootRouter = await rootRoutes.createRouter(
      createApplication(allowAuthentication),
    );

    const apiResponse = await apiRouter.request('/routesExample');
    const rootResponse = await rootRouter.request('/routes-example/root');

    expect(apiResponse.status).toBe(200);
    await expect(apiResponse.json()).resolves.toEqual({
      data: {
        scope: 'api',
        plugin: '@nocobase/app-plugin-routes-example',
        message: 'Hello from the routes example API route',
      },
    });
    expect(rootResponse.status).toBe(200);
    await expect(rootResponse.json()).resolves.toEqual({
      scope: 'root',
      plugin: '@nocobase/app-plugin-routes-example',
      message: 'Hello from the routes example root route',
    });
  });

  it('rejects anonymous requests at each Route boundary', async () => {
    const apiRouter = await apiRoutes.createRouter(
      createApplication(denyAuthentication),
    );
    const rootRouter = await rootRoutes.createRouter(
      createApplication(denyAuthentication),
    );

    for (const [router, path] of [
      [apiRouter, '/routesExample'],
      [rootRouter, '/routes-example/root'],
    ] as const) {
      const response = await router.request(path);
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }
  });

  it('declares one ordered Route array with Root and API scopes', () => {
    expect(routes).toEqual([rootRoutes, apiRoutes]);
    expect(routes.map(({ scope }) => scope)).toEqual(['root', 'api']);
  });

  it('does not leak either authentication boundary into a later contribution', async () => {
    const application = new Hono();
    const apiRouter = await apiRoutes.createRouter(
      createApplication(denyAuthentication),
    );
    const rootRouter = await rootRoutes.createRouter(
      createApplication(denyAuthentication),
    );
    application.route('/api', apiRouter);
    application.route('/', rootRouter);
    application.get('/api/later-plugin', (context) => context.text('api'));
    application.get('/later-plugin', (context) => context.text('root'));

    expect((await application.request('/api/routesExample')).status).toBe(401);
    expect((await application.request('/routes-example/root')).status).toBe(
      401,
    );
    await expect(
      (await application.request('/api/later-plugin')).text(),
    ).resolves.toBe('api');
    await expect(
      (await application.request('/later-plugin')).text(),
    ).resolves.toBe('root');
  });

  it('declares the API Route for the API document', async () => {
    const apiRouter = await apiRoutes.createRouter(
      createApplication(allowAuthentication),
    );

    expect(findUndeclaredApiRoutes(apiRouter)).toEqual([]);
    const document = await generateApiDocument(apiRouter, {
      info: { title: 'Routes example', version: '0.0.0' },
    });
    expect(document.paths?.['/api/routesExample']?.get).toMatchObject({
      tags: ['RoutesExample'],
      operationId: 'routesExampleGetGreeting',
    });
    expect(document.components?.schemas).toHaveProperty(
      'RoutesExampleGreeting',
    );
  });
});

function createApplication(authentication: Auth): AppPluginApplication {
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  return {
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } },
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  };
}
