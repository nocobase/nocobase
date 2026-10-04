import {
  databaseManagerToken,
  type DatabaseManager,
  RepositoryError,
} from '@nocobase/db';
import { Hono, type Context, type Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';

import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import { validator } from 'hono/validator';

import {
  ApiError,
  type ApiInputSchema,
  parseApiInput,
  apiErrorHandler,
  defineApiRoutes,
  defineRepositoryApiRoutes,
  defineRootRoutes,
} from '../src/router/index.js';
import { defineServerPlugin } from '../src/plugins/index.js';

const config = new AppConfig();
await config.loadAll();
config.mergeDefaults({
  app: {
    name: 'main',
    publicBasePath: '/main',
    internalBasePath: '',
    publicApiUrl: '/main/api',
  },
});

// Shaped like zod's `safeParse`, which `parseApiInput` matches structurally.
const deployInput: ApiInputSchema<{ releaseId: string }> = {
  safeParse(value) {
    const releaseId = (value as { releaseId?: unknown } | null)?.releaseId;
    return typeof releaseId === 'string'
      ? { success: true, data: { releaseId } }
      : {
          success: false,
          error: {
            issues: [
              {
                path: ['releaseId'],
                message: 'Expected a string.',
                code: 'invalid_type',
              },
            ],
          },
        };
  },
};

function createApp(): Application {
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/app' }),
  });
  app.addRoutes(
    defineRootRoutes(() => {
      const router = new Hono();
      router.get('/*', (context) => context.html('<!doctype html>'));
      return router;
    }),
  );
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.get('/workflows/:id', (context) => {
        throw new ApiError({
          status: 'NOT_FOUND',
          reason: 'WORKFLOW_NOT_FOUND',
          domain: 'workflow',
          message: `Workflow ${context.req.param('id')} was not found.`,
          localizedMessage: { locale: 'zh-CN', message: '工作流不存在。' },
        });
      });
      router.post('/workflows', () => {
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_WORKFLOW',
          domain: 'workflow',
          message: 'The workflow is invalid.',
          fieldViolations: [{ field: 'title', description: 'Required.' }],
        });
      });
      router.get('/exception', () => {
        throw new HTTPException(403, { message: 'Nope.' });
      });
      router.get('/denied', () => {
        throw Object.assign(new Error('Not yours.'), {
          status: 403,
          reason: 'AUTHORIZATION_DENIED',
          domain: 'authorization',
        });
      });
      router.post('/orders/:orderId/close', () => {
        throw new RepositoryError('VERSION_CONFLICT', 'The order changed.');
      });
      router.post('/orders/relink', () => {
        throw new RepositoryError(
          'RELATION_TARGET_NOT_FOUND',
          'The customer was not found.',
          { path: ['values', 'customer'], details: { relation: 'customer' } },
        );
      });
      router.post('/orders/broken', () => {
        throw new RepositoryError('INVALID_POLICY', 'Policy secret detail.');
      });
      router.get('/crash', () => {
        throw new Error('database password is hunter2');
      });
      router.get('/ok', (context) => context.json({ data: true }));
      router.post(
        '/apps/:appId/deploy',
        validator('json', (value) => parseApiInput(deployInput, value)),
        (context) => context.json({ data: context.req.valid('json') }, 202),
      );
      return router;
    }),
  );
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.onError((_error, context) => context.json({ own: true }, 418));
      router.get('/own', () => {
        throw new Error('handled by the route');
      });
      return router;
    }),
  );
  return app;
}

async function request(
  app: Application,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return app.fetch(new Request(`http://localhost${path}`, init));
}

describe('/api errors', () => {
  it('renders a thrown ApiError as the standard error body', async () => {
    const response = await request(createApp(), '/api/workflows/42', {
      headers: { 'x-request-id': 'trace-1' },
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('x-request-id')).toBe('trace-1');
    expect(await response.json()).toEqual({
      error: {
        code: 404,
        status: 'NOT_FOUND',
        reason: 'WORKFLOW_NOT_FOUND',
        domain: 'workflow',
        message: 'Workflow 42 was not found.',
        localizedMessage: { locale: 'zh-CN', message: '工作流不存在。' },
        requestId: 'trace-1',
      },
    });
  });

  it('includes field violations', async () => {
    const response = await request(createApp(), '/api/workflows', {
      method: 'POST',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        fieldViolations: [{ field: 'title', description: 'Required.' }],
      },
    });
  });

  it('keeps the status and message of an HTTPException', async () => {
    const response = await request(createApp(), '/api/exception');

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: {
        code: 403,
        status: 'PERMISSION_DENIED',
        reason: 'HTTP_403',
        domain: 'app',
        message: 'Nope.',
      },
    });
  });

  it('keeps the 4xx status, reason and domain an error carries', async () => {
    const response = await request(createApp(), '/api/denied');

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        reason: 'AUTHORIZATION_DENIED',
        domain: 'authorization',
        message: 'Not yours.',
      },
    });
  });

  it('answers an unexpected error with a 500 that reveals nothing', async () => {
    const response = await request(createApp(), '/api/crash');
    const body = (await response.json()) as { error: { requestId: string } };

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: {
        code: 500,
        status: 'INTERNAL',
        reason: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      },
    });
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(body.error.requestId).toBe(response.headers.get('x-request-id'));
  });

  it('answers an unknown API path with a JSON 404 instead of the SPA page', async () => {
    const response = await request(createApp(), '/api/missing');

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { status: 'NOT_FOUND', reason: 'ROUTE_NOT_FOUND', domain: 'app' },
    });
    expect(
      (await request(createApp(), '/settings')).headers.get('content-type'),
    ).toContain('text/html');
  });

  it("leaves a route's own error handler in charge", async () => {
    const response = await request(createApp(), '/api/own');

    expect(response.status).toBe(418);
    expect(await response.json()).toEqual({ own: true });
  });

  it('generates a request id when the caller sends none or an unsafe one', async () => {
    const generated = await request(createApp(), '/api/ok');
    const unsafe = await request(createApp(), '/api/ok', {
      headers: { 'x-request-id': 'a b<script>' },
    });

    expect(generated.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(unsafe.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('validates input and names the invalid fields', async () => {
    const deploy = (body: unknown) =>
      request(createApp(), '/api/apps/7/deploy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    const accepted = await deploy({ releaseId: 'r1' });
    expect(accepted.status).toBe(202);
    expect(await accepted.json()).toEqual({ data: { releaseId: 'r1' } });

    const rejected = await deploy({});
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_INPUT',
        domain: 'app',
        fieldViolations: [
          {
            field: 'releaseId',
            description: 'Expected a string.',
            reason: 'invalid_type',
          },
        ],
      },
    });
  });

  it("answers a Repository error a route lets propagate, and hides one that is the server's fault", async () => {
    const conflict = await request(createApp(), '/api/orders/7/close', {
      method: 'POST',
    });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: { status: 'ABORTED', reason: 'VERSION_CONFLICT', domain: 'app' },
    });

    const relink = await request(createApp(), '/api/orders/relink', {
      method: 'POST',
    });
    expect(relink.status).toBe(400);
    expect(await relink.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'RELATION_TARGET_NOT_FOUND',
        domain: 'app',
        fieldViolations: [
          {
            field: 'values.customer',
            reason: 'RELATION_TARGET_NOT_FOUND',
          },
        ],
        metadata: {
          path: ['values', 'customer'],
          details: { relation: 'customer' },
        },
      },
    });
    const broken = await request(createApp(), '/api/orders/broken', {
      method: 'POST',
    });
    const body = JSON.stringify(await broken.json());
    expect(broken.status).toBe(500);
    expect(body).toContain('INTERNAL_ERROR');
    expect(body).not.toContain('secret');
  });

  it('renders recognized errors from a router mounted on a bare Hono and rethrows the rest', async () => {
    const router = new Hono();
    router.onError(apiErrorHandler);
    router.get('/missing', () => {
      throw new RepositoryError('RECORD_NOT_FOUND', 'No such order.');
    });
    router.get('/crash', () => {
      throw new Error('boom');
    });
    const outer = new Hono();
    outer.onError((_error, context) => context.text('outer', 500));
    outer.route('/', router);

    const missing = await outer.request('/missing');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      error: { reason: 'RECORD_NOT_FOUND' },
    });
    expect(await (await outer.request('/crash')).text()).toBe('outer');
  });
});

function routesOf(
  register: (router: Hono) => void,
): ReturnType<typeof defineApiRoutes<Application>> {
  return defineApiRoutes(() => {
    const router = new Hono();
    register(router);
    return router;
  });
}

function createBareApp(): Application {
  return new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/app' }),
  });
}

const ok = (context: Context): Response => context.json({ data: true });

describe('duplicate API routes', () => {
  it('fails start when two contributions register the same method and path', async () => {
    const app = createBareApp();
    app.addRoutes(
      routesOf((router) => router.post('/x/y', ok)),
      { owner: '@nocobase/app-plugin-first' },
    );
    app.addRoutes(
      routesOf((router) => router.post('/x/y', ok)),
      { owner: '@nocobase/app-plugin-second' },
    );

    await expect(app.start()).rejects.toThrow(
      'Duplicate API route: POST /api/x/y from @nocobase/app-plugin-first and POST /api/x/y from @nocobase/app-plugin-second',
    );
  });

  it('names a plugin by its package name and an unlabelled contribution by its position', async () => {
    const app = createBareApp();
    app.addRoutes(routesOf((router) => router.get('/healthz', ok)));
    app.addServerPlugins({
      appPackageName: '@nocobase/app-test',
      plugins: [
        defineServerPlugin({
          baseDir: import.meta.dirname,
          packageName: '@nocobase/app-plugin-health',
          routes: [routesOf((router) => router.get('/healthz', ok))],
        }),
      ].map((definition) => ({
        definition,
        metadata: {
          packageName: definition.packageName,
          version: 'test',
          rootDir: '/test/plugins/health',
          jobLocations: [],
        },
      })),
    });

    await expect(app.start()).rejects.toThrow(
      'GET /api/healthz from route contribution #1 and GET /api/healthz from @nocobase/app-plugin-health',
    );
  });

  it('treats parameter names as irrelevant and an ALL route as every method', async () => {
    const renamed = createBareApp();
    renamed.addRoutes(routesOf((router) => router.get('/a/:id', ok)));
    renamed.addRoutes(routesOf((router) => router.get('/a/:orderId', ok)));
    await expect(renamed.start()).rejects.toThrow(
      'GET /api/a/:id from route contribution #1 and GET /api/a/:orderId from route contribution #2',
    );

    const all = createBareApp();
    all.addRoutes(routesOf((router) => router.delete('/b', ok)));
    all.addRoutes(routesOf((router) => router.all('/b', ok)));
    await expect(all.start()).rejects.toThrow('Duplicate API route');
  });

  it('fails start when one router registers the same handler route twice', async () => {
    const app = createBareApp();
    app.addRoutes(
      routesOf((router) => {
        router.get('/twice', ok);
        router.get('/twice', ok);
      }),
      { owner: 'app' },
    );

    await expect(app.start()).rejects.toThrow(
      'GET /api/twice from app and GET /api/twice from app',
    );
  });

  it('accepts the same path under different methods, a parameter beside a fixed segment, middleware and handler chains', async () => {
    const app = createBareApp();
    const guard = async (_context: Context, next: Next): Promise<void> => {
      await next();
    };
    app.addRoutes(
      routesOf((router) => {
        router.use('*', guard);
        router.use('/x/*', guard);
        router.get('/x/y', guard, ok);
        router.post(
          '/apps/:appId/deploy',
          guard,
          validator('json', (value) => parseApiInput(deployInput, value)),
          ok,
        );
        router.get('/users/findMany', ok);
      }),
    );
    app.addRoutes(
      routesOf((router) => {
        router.use('*', guard);
        router.use('/x/*', guard);
        router.post('/x/y', guard, ok);
        router.get('/users/:userId', ok);
        router.route('/nested', new Hono().get('/z', ok));
      }),
    );

    await app.start();
    expect((await request(app, '/api/x/y', { method: 'POST' })).status).toBe(
      200,
    );
    expect((await request(app, '/api/users/7')).status).toBe(200);
    expect((await request(app, '/api/nested/z')).status).toBe(200);
  });

  it('fails start when a data endpoint collides with a hand-written route', async () => {
    const app = createBareApp();
    app.container.instance(databaseManagerToken, {
      repository: () => ({}),
    } as unknown as DatabaseManager);
    app.addRoutes(
      defineRepositoryApiRoutes({
        principal: () => undefined,
        repositories: [
          {
            name: 'users',
            policy: () => ({ read: true }),
            actions: { findMany: {} },
          },
        ],
      }),
      { owner: 'the users exposure' },
    );
    app.addRoutes(
      routesOf((router) => router.post('/users/findMany', ok)),
      { owner: '@nocobase/app-plugin-users' },
    );

    await expect(app.start()).rejects.toThrow(
      'POST /api/users/findMany from the users exposure and POST /api/users/findMany from @nocobase/app-plugin-users',
    );
  });
});
