import { userPreferencesServiceToken } from '@nocobase/app-plugin-users/server';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import {
  apiDocsToken,
  defineHttpMiddleware,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  inspectApiRoutes,
} from '@nocobase/app-server/router';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  createMinimalServerFactory,
  createStandaloneServer,
} from '../helpers/minimal-app.js';
import { Visitor } from '../helpers/preference-visitor.js';

describe('preferences through the original Users API', () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await createTestApp({
      createServer: createMinimalServerFactory((application) => {
        application.addHttpMiddleware(
          defineHttpMiddleware({
            name: 'preference-test-http-chain',
            register(router) {
              router.use('*', async (context, next) => {
                await next();
                context.header('x-test-http-chain', 'ran');
                context.header(
                  'x-test-request-id',
                  context.get('requestId') as string,
                );
              });
            },
          }),
        );
      }),
      config: {
        demoMode: { enabled: true, allowCollections: ['userPreferences'] },
      },
    });
  });
  afterAll(() => app.close());

  it('keeps the application HTTP middleware and one request ID on reads and writes', async () => {
    const visitor = new Visitor(app);
    await visitor.signIn();
    for (const response of [
      await visitor.request('/users/me/preferences'),
      await visitor.request('/users/me/preferences/locale', 'PUT', {
        value: 'zh-CN',
      }),
    ]) {
      expect(response.status).toBe(200);
      expect(response.headers.get('x-test-http-chain')).toBe('ran');
      expect(response.headers.get('x-request-id')).toBeTruthy();
      expect(response.headers.get('x-test-request-id')).toBe(
        response.headers.get('x-request-id'),
      );
    }
  });

  it('renders unexpected failures as API errors without committing pending cookies', async () => {
    const visitor = new Visitor(app);
    await visitor.signIn();
    const preferences = app.application.container.resolve(
      userPreferencesServiceToken,
    );
    const failure = vi
      .spyOn(preferences, 'list')
      .mockRejectedValueOnce(new Error('Preference read failed'));
    try {
      const response = await visitor.request('/users/me/preferences', 'PATCH', {
        locale: 'zh-CN',
      });
      expect(response.status).toBe(500);
      expect(response.headers.getSetCookie()).toEqual([]);
      expect(await response.json()).toMatchObject({
        error: {
          reason: 'INTERNAL_ERROR',
          requestId: response.headers.get('x-request-id'),
        },
      });
      expect((await visitor.preferences()).locale).toBe('en-US');
    } finally {
      failure.mockRestore();
    }
  });

  it('isolates overlapping requests and leaves direct service calls on account storage', async () => {
    const first = new Visitor(app);
    const second = new Visitor(app);
    const id = await first.signIn();
    await second.signIn();
    const preferences = app.application.container.resolve(
      userPreferencesServiceToken,
    );
    await preferences.set(id, 'locale', 'fr-FR');
    const responses = await Promise.all([
      first.request('/users/me/preferences', 'PATCH', {
        locale: 'zh-CN',
        'theme.mode': 'dark',
      }),
      second.request('/users/me/preferences', 'PATCH', {
        locale: 'de-DE',
        'theme.mode': 'light',
      }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await first.preferences()).toMatchObject({
      locale: 'zh-CN',
      'theme.mode': 'dark',
    });
    expect(await second.preferences()).toMatchObject({
      locale: 'de-DE',
      'theme.mode': 'light',
    });
    expect(await preferences.get(id, 'locale')).toBe('fr-FR');
  });

  it('documents the adapted contract on the four declared Users operations', async () => {
    const document = await app.application.container
      .resolve(apiDocsToken)
      .getDocument();
    expect(findUndeclaredApiRoutes(app.application)).toEqual([]);
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const routes = inspectApiRoutes(app.application).filter((route) =>
      route.path.startsWith('/api/users/me/preferences'),
    );
    expect(routes.map((route) => route.method).sort()).toEqual([
      'DELETE',
      'GET',
      'PATCH',
      'PUT',
    ]);
    const collection = document.paths['/api/users/me/preferences'];
    const item = document.paths['/api/users/me/preferences/{key}'];
    expect(collection?.get).toMatchObject({
      operationId: 'usersListMyPreferences',
      description: expect.stringContaining('browser-session cookies'),
    });
    expect(item?.put).toMatchObject({
      operationId: 'usersSetMyPreference',
      description: expect.stringContaining('INVALID_PREFERENCE_VALUE'),
    });
    expect(collection?.patch?.requestBody).toMatchObject({
      content: {
        'application/json': {
          schema: {
            allOf: expect.arrayContaining([
              {
                type: 'object',
                properties: Object.fromEntries(
                  ['locale', 'theme.mode', 'theme.preset'].map((key) => [
                    key,
                    expect.objectContaining({
                      type: 'string',
                      minLength: 1,
                      maxLength: 100,
                      pattern: '^[a-zA-Z0-9._-]+$',
                    }),
                  ]),
                ),
              },
            ]),
          },
        },
      },
    });
    expect(item?.delete?.responses?.['204']).toMatchObject({
      headers: { 'Set-Cookie': { schema: { type: 'string' } } },
    });
    for (const operation of [collection?.patch, item?.put, item?.delete])
      expect(operation?.responses?.['403']).toEqual({
        $ref: '#/components/responses/PermissionDenied',
      });
  });
});

it('counts preference requests against the same global API rate limit', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    config: {
      demoMode: { enabled: true },
      api: { rateLimit: { max: 1, window: '1h' } },
    },
  });
  try {
    const visitor = new Visitor(app);
    await visitor.signIn();
    const cookie = visitor.cookies.getCookieStringSync(
      `http://localhost${app.publicBasePath}/api/users/me/preferences`,
    );
    const fetch = (path: string, address: string) =>
      app.application.fetch(
        new Request(`http://localhost/api${path}`, { headers: { cookie } }),
        { incoming: { socket: { remoteAddress: address } } },
      );
    expect((await fetch('/demoMode/status', '192.0.2.1')).status).toBe(200);
    const limited = await fetch('/users/me/preferences', '192.0.2.1');
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.reason).toBe('RATE_LIMITED');
    expect((await fetch('/users/me/preferences', '192.0.2.2')).status).toBe(
      200,
    );
    expect((await fetch('/demoMode/status', '192.0.2.2')).status).toBe(429);
  } finally {
    await app.close();
  }
});

it('keeps root and nested application cookies separate when choosing and deleting preferences', async () => {
  const parent = await createTestApp({
    createServer: createStandaloneServer,
    config: {
      app: { publicBasePath: '/' },
      auth: { baseURL: 'http://localhost/api/auth' },
      demoMode: { enabled: true },
    },
  });
  let nested: TestApp | undefined;
  try {
    nested = await createTestApp({
      createServer: createStandaloneServer,
      config: { demoMode: { enabled: true } },
    });
    const first = new Visitor(parent);
    const second = new Visitor(nested, first.cookies);
    await first.signIn();
    expect(
      (
        await first.request('/users/me/preferences/locale', 'PUT', {
          value: 'zh-CN',
        })
      ).status,
    ).toBe(200);
    await second.signIn();
    expect((await second.preferences()).locale).toBe('en-US');
    expect(
      (
        await second.request('/users/me/preferences/locale', 'PUT', {
          value: 'de-DE',
        })
      ).status,
    ).toBe(200);
    expect((await first.preferences()).locale).toBe('zh-CN');
    expect(
      (await second.request('/users/me/preferences/locale', 'DELETE')).status,
    ).toBe(204);
    expect((await second.preferences()).locale).toBe('en-US');
    expect((await first.preferences()).locale).toBe('zh-CN');
  } finally {
    await nested?.close();
    await parent.close();
  }
});
