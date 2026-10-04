import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';

import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import { validator } from 'hono/validator';

import {
  ApiError,
  type ApiInputSchema,
  parseApiInput,
  defineApiRoutes,
  defineRootRoutes,
} from '../src/router/index.js';

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
});
