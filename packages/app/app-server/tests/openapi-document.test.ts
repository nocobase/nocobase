import { Hono, type Context } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  ApiError,
  apiDocsToken,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  defineRootRoutes,
  describeRoute,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
  healthCheckApiRoutes,
  inspectApiRoutes,
  mergeApiDocumentFragment,
  type ApiDocsService,
  type ApiDocument,
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

const Order = z
  .object({ id: z.string(), status: z.enum(['open', 'closed']) })
  .meta({ ref: 'ShopOrder' });

function shopRouter(): Hono {
  const router = new Hono();
  router.get(
    '/orders/:orderId',
    describeRoute({
      tags: ['Shop'],
      summary: 'Get an order',
      operationId: 'shopGetOrder',
      responses: { '200': dataResponse(Order), ...apiErrorResponses },
    }),
    apiValidator('param', z.object({ orderId: z.string() })),
    apiValidator('query', z.object({ expand: z.string().optional() })),
    (context) =>
      context.json({
        data: { id: context.req.valid('param').orderId, status: 'open' },
      }),
  );
  router.post(
    '/orders/:orderId/cancel',
    describeRoute({
      tags: ['Shop'],
      summary: 'Cancel an order',
      operationId: 'shopCancelOrder',
      responses: { '200': dataResponse(Order) },
    }),
    apiValidator('param', z.object({ orderId: z.string() })),
    apiValidator(
      'json',
      z.strictObject({
        reason: z.string().min(1).meta({ description: 'Why.' }),
      }),
    ),
    (context) => context.json({ data: null }),
  );
  router.get(
    '/orders/config',
    // Read by the application shell only.
    describeRoute({ hide: true }),
    (context) => context.json({ data: {} }),
  );
  router.get('/orders/undeclared', (context) => context.json({ data: null }));
  const nested = new Hono();
  nested.get(
    '/items',
    describeRoute({
      tags: ['Shop'],
      summary: 'List items',
      operationId: 'shopListItems',
    }),
    (context) => context.json({ data: [], meta: { total: 0 } }),
  );
  nested.delete('/items/:itemId', (context) => context.body(null, 204));
  router.route('/catalog', nested);
  return router;
}

function createApp(configure?: (docs: ApiDocsService) => void): Application {
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/app' }),
  });
  app.addRoutes(healthCheckApiRoutes);
  app.addRoutes(defineApiRoutes(() => shopRouter()));
  app.addRoutes(
    defineRootRoutes(() => {
      const router = new Hono();
      router.get('/*', (context) => context.html('<!doctype html>'));
      return router;
    }),
  );
  app.registerProviders();
  configure?.(app.container.resolve(apiDocsToken));
  return app;
}

async function request(
  app: Application,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return app.fetch(new Request(`http://localhost${path}`, init));
}

const signedIn = (context: Context): boolean =>
  context.req.header('authorization') === 'Bearer ok';

async function documentOf(app: Application): Promise<ApiDocument> {
  await app.start();
  return app.container.resolve(apiDocsToken).getDocument();
}

describe('API document', () => {
  it('lists a described route with its tags, summary, operationId, parameters, body and responses', async () => {
    const document = await documentOf(createApp());

    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(document.openapi).toBe('3.1.0');
    expect(document.info).toEqual({ title: 'main', version: '0.0.0' });
    expect(document.servers).toEqual([{ url: '/main' }]);

    const get = document.paths!['/api/orders/{orderId}']!.get!;
    expect(get).toMatchObject({
      tags: ['Shop'],
      summary: 'Get an order',
      operationId: 'shopGetOrder',
      parameters: [
        {
          in: 'path',
          name: 'orderId',
          required: true,
          schema: { type: 'string' },
        },
        { in: 'query', name: 'expand', schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: {
                properties: {
                  data: { $ref: '#/components/schemas/ShopOrder' },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthenticated' },
      },
    });
    expect(document.components!.schemas!.ShopOrder).toMatchObject({
      properties: { status: { enum: ['open', 'closed'] } },
    });

    const cancel = document.paths!['/api/orders/{orderId}/cancel']!.post!;
    expect(cancel.requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string', minLength: 1, description: 'Why.' },
            },
            required: ['reason'],
            additionalProperties: false,
          },
        },
      },
    });
    // A validator adds the 400 in the standard error body, not hono-openapi's own.
    expect(cancel.responses!['400']).toEqual({
      $ref: '#/components/responses/InvalidInput',
    });
    expect(document.tags).toEqual([{ name: 'App' }, { name: 'Shop' }]);
  });

  it('sees routes of sub-routers with their mount prefix', async () => {
    const document = await documentOf(createApp());

    expect(document.paths!['/api/catalog/items']!.get).toMatchObject({
      operationId: 'shopListItems',
    });
  });

  it('leaves hidden and undeclared routes out, and the docs routes too', async () => {
    const document = await documentOf(createApp());
    const paths = Object.keys(document.paths!);

    expect(paths).not.toContain('/api/orders/config');
    expect(paths).not.toContain('/api/orders/undeclared');
    expect(paths).not.toContain('/api/catalog/items/{itemId}');
    expect(paths.some((path) => path.startsWith('/api/swagger'))).toBe(false);
    expect(document.paths!['/api/healthz']!.get).toMatchObject({
      operationId: 'checkHealth',
    });
  });

  it('reports every endpoint that declares nothing', async () => {
    const app = createApp();
    expect(() => findUndeclaredApiRoutes(app)).toThrow('Start it');
    await app.start();

    expect(findUndeclaredApiRoutes(app)).toEqual([
      { method: 'GET', path: '/api/orders/undeclared' },
      { method: 'DELETE', path: '/api/catalog/items/:itemId' },
    ]);
    const declarations = inspectApiRoutes(app);
    expect(
      declarations.find((route) => route.path === '/api/orders/config'),
    ).toEqual({
      method: 'GET',
      path: '/api/orders/config',
      declared: true,
      hidden: true,
    });
    expect(
      declarations.find((route) => route.path === '/api/orders/:orderId'),
    ).toEqual({
      method: 'GET',
      path: '/api/orders/:orderId',
      declared: true,
      hidden: false,
      operationId: 'shopGetOrder',
      tags: ['Shop'],
      summary: 'Get an order',
    });
    expect(
      declarations.filter((route) => route.path.startsWith('/api/swagger')),
    ).toHaveLength(3);
    expect(
      declarations
        .filter((route) => route.path.startsWith('/api/swagger'))
        .every((route) => route.hidden),
    ).toBe(true);
  });

  it('applies a declaration registered with use() to the routes below it', () => {
    const router = new Hono();
    router.use('/admin/*', describeRoute({ tags: ['Admin'] }));
    router.get('/admin/users', (context) => context.json({ data: [] }));

    expect(inspectApiRoutes(router)).toEqual([
      {
        method: 'GET',
        path: '/api/admin/users',
        declared: true,
        hidden: false,
        tags: ['Admin'],
      },
    ]);
  });

  it('regenerates only after invalidate()', async () => {
    const app = createApp();
    const docs = app.container.resolve(apiDocsToken);
    const first = await documentOf(app);

    expect(await docs.getDocument()).toBe(first);
    docs.invalidate();
    expect(await docs.getDocument()).not.toBe(first);
  });
});

/** A router a dispatcher under `/api/settings` forwards to; its paths start with the segment it is registered under. */
function forwardedRouter(): Hono {
  const router = new Hono();
  router.get(
    '/rules/:ruleId',
    describeRoute({
      tags: ['Settings'],
      summary: 'Get a rule',
      operationId: 'settingsGetRule',
      responses: { '200': dataResponse(Order), ...apiErrorResponses },
    }),
    apiValidator('param', z.object({ ruleId: z.string() })),
    (context) => context.json({ data: null }),
  );
  router.get(
    '/rules/config',
    // Read by the application shell only.
    describeRoute({ hide: true }),
    (context) => context.json({ data: {} }),
  );
  router.delete('/rules/:ruleId', (context) => context.body(null, 204));
  return router;
}

/** The application with a dispatcher on `/api/settings/*` that forwards every request at runtime. */
function createDispatchingApp(
  configure?: (docs: ApiDocsService) => void,
): Application {
  return createApp((docs) => {
    const forwarded = forwardedRouter();
    docs.addApiRouter({
      owner: '@nocobase/app-plugin-settings',
      prefix: '/api/settings',
      router: forwarded,
    });
    docs.addUndeclaredApiRoute({
      owner: '@nocobase/app-plugin-settings',
      method: 'ALL',
      path: '/api/settings/handWritten',
      reason: 'A plain function handler.',
    });
    configure?.(docs);
  });
}

describe('API routes behind a runtime dispatcher', () => {
  it('documents a forwarded router at its prefix like a mounted one', async () => {
    const document = await documentOf(createDispatchingApp());
    const paths = Object.keys(document.paths!);

    expect(document.paths!['/api/settings/rules/{ruleId}']!.get).toMatchObject({
      operationId: 'settingsGetRule',
      tags: ['Settings'],
      parameters: [expect.objectContaining({ in: 'path', name: 'ruleId' })],
    });
    expect(paths).not.toContain('/api/settings/rules/config');
    expect(paths).not.toContain('/api/settings/handWritten');
    expect(document.tags?.map((tag) => tag.name)).toContain('Settings');
    // Shared components are generated from the same base and stay shared.
    expect(Object.keys(document.components!.schemas!)).not.toContain(
      'SettingsShopOrder',
    );
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  });

  it('reports its undeclared routes and every undeclared target with the mounted ones', async () => {
    const app = createDispatchingApp();
    await app.start();

    expect(findUndeclaredApiRoutes(app)).toEqual([
      { method: 'GET', path: '/api/orders/undeclared' },
      { method: 'DELETE', path: '/api/catalog/items/:itemId' },
      { method: 'DELETE', path: '/api/settings/rules/:ruleId' },
      { method: 'ALL', path: '/api/settings/handWritten' },
    ]);
    const declarations = inspectApiRoutes(app);
    expect(
      declarations.find((route) => route.path === '/api/settings/rules/config'),
    ).toEqual({
      method: 'GET',
      path: '/api/settings/rules/config',
      declared: true,
      hidden: true,
    });
    expect(
      declarations.find((route) => route.path === '/api/settings/handWritten'),
    ).toEqual({
      method: 'ALL',
      path: '/api/settings/handWritten',
      declared: false,
      hidden: false,
      reason: 'A plain function handler.',
    });
  });

  it('drops a registration it is told to remove', async () => {
    let removeRouter!: () => void;
    let removeRoute!: () => void;
    const app = createApp((docs) => {
      removeRouter = docs.addApiRouter({
        owner: '@nocobase/app-plugin-settings',
        prefix: '/api/settings',
        router: forwardedRouter(),
      });
      removeRoute = docs.addUndeclaredApiRoute({
        owner: '@nocobase/app-plugin-settings',
        method: 'ALL',
        path: '/api/settings/handWritten',
      });
    });
    const docs = app.container.resolve(apiDocsToken);
    const before = await documentOf(app);
    expect(before.paths).toHaveProperty(['/api/settings/rules/{ruleId}']);

    removeRouter();
    removeRoute();

    const after = await docs.getDocument();
    expect(after.paths).not.toHaveProperty(['/api/settings/rules/{ruleId}']);
    expect(
      findUndeclaredApiRoutes(app).filter((route) =>
        route.path.startsWith('/api/settings'),
      ),
    ).toEqual([]);
  });

  it('leaves a route outside its scope out of the document and reports it', async () => {
    const app = createApp((docs) => {
      const router = forwardedRouter();
      router.get(
        '/elsewhere/orders/:id',
        describeRoute({
          tags: ['Settings'],
          summary: 'Unreachable',
          operationId: 'settingsUnreachable',
        }),
        (context) => context.json({ data: null }),
      );
      docs.addApiRouter({
        owner: '@nocobase/app-plugin-settings',
        prefix: '/api',
        scope: '/rules',
        router,
      });
    });
    const document = await documentOf(app);

    expect(document.paths).toHaveProperty(['/api/rules/{ruleId}']);
    expect(document.paths).not.toHaveProperty(['/api/elsewhere/orders/{id}']);
    expect(
      inspectApiRoutes(app).find(
        (route) => route.path === '/api/elsewhere/orders/:id',
      ),
    ).toEqual({
      method: 'GET',
      path: '/api/elsewhere/orders/:id',
      declared: false,
      hidden: false,
      reason:
        'Declared outside the forwarded path /api/rules, which the dispatcher never forwards to this router.',
    });
    expect(findUndeclaredApiRoutes(app)).toContainEqual({
      method: 'GET',
      path: '/api/elsewhere/orders/:id',
    });
  });

  it('ignores a route outside its scope in the duplicate check', async () => {
    const app = createApp((docs) => {
      const router = forwardedRouter();
      router.get('/orders/:id', describeRoute({ hide: true }), (context) =>
        context.json({ data: null }),
      );
      docs.addApiRouter({
        owner: '@nocobase/app-plugin-settings',
        prefix: '/api',
        scope: '/rules',
        router,
      });
    });

    await expect(app.start()).resolves.toBeUndefined();
  });

  it('rejects a prefix outside /api', () => {
    const app = createApp();
    expect(() =>
      app.container.resolve(apiDocsToken).addApiRouter({
        owner: '@nocobase/app-plugin-settings',
        prefix: '/settings',
        router: forwardedRouter(),
      }),
    ).toThrow('must be /api or a path below it');
  });

  it('fails start when a forwarded route duplicates a mounted one', async () => {
    const app = createApp((docs) => {
      const router = new Hono();
      router.get('/orders/:id', describeRoute({ hide: true }), (context) =>
        context.json({ data: null }),
      );
      docs.addApiRouter({
        owner: '@nocobase/app-plugin-settings',
        prefix: '/api',
        router,
      });
    });

    await expect(app.start()).rejects.toThrow(
      'GET /api/orders/:id from @nocobase/app-plugin-settings',
    );
  });
});

describe('API document fragments', () => {
  it('merges paths, components and tags, renaming what collides', async () => {
    const app = createApp((docs) => {
      docs.addFragment(() => ({
        owner: '@nocobase/app-plugin-authentication',
        paths: {
          '/api/auth/sign-in/email': {
            post: {
              tags: ['Authentication'],
              summary: 'Sign in with email',
              operationId: 'shopGetOrder',
              responses: {
                '200': {
                  description: 'Signed in.',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ShopOrder' },
                    },
                  },
                },
              },
            },
          },
          '/api/orders/{orderId}': {
            get: { operationId: 'authShadow', responses: {} },
          },
        },
        components: {
          schemas: {
            ShopOrder: {
              type: 'object',
              properties: { token: { type: 'string' } },
            },
            ApiErrorBody: {
              type: 'object',
              description: 'The body of every failed `/api` response.',
              required: ['error'],
              properties: {
                error: { $ref: '#/components/schemas/ApiErrorPayload' },
              },
            },
          },
        },
        tags: [{ name: 'Authentication', description: 'Better Auth.' }],
      }));
    });
    const warnings: string[] = [];
    await app.start();
    const document = await generateApiDocument(app, {
      info: { title: 'main', version: '1.0.0' },
      fragments: [],
      onWarning: (message) => warnings.push(message),
    });
    expect(document.paths!['/api/auth/sign-in/email']).toBeUndefined();

    const merged = await app.container.resolve(apiDocsToken).getDocument();
    const signIn = merged.paths!['/api/auth/sign-in/email']!.post!;
    expect(signIn.operationId).toBe('authenticationShopGetOrder');
    expect(signIn.responses!['200']).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AuthenticationShopOrder' },
        },
      },
    });
    expect(merged.components!.schemas!.AuthenticationShopOrder).toEqual({
      type: 'object',
      properties: { token: { type: 'string' } },
    });
    // An identical component is shared rather than renamed.
    expect(
      merged.components!.schemas!.AuthenticationApiErrorBody,
    ).toBeUndefined();
    // A declared route wins over a fragment operation for the same method and path.
    expect(merged.paths!['/api/orders/{orderId}']!.get!.operationId).toBe(
      'shopGetOrder',
    );
    expect(merged.tags).toContainEqual({
      name: 'Authentication',
      description: 'Better Auth.',
    });
  });

  it('reports what it renamed or dropped', () => {
    const document: ApiDocument = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {
        '/api/a': { get: { operationId: 'getA', responses: {} } },
      },
      components: { schemas: { Thing: { type: 'string' } } },
    };
    const warnings: string[] = [];
    mergeApiDocumentFragment(
      document,
      {
        owner: 'example',
        namespace: 'ext',
        paths: {
          '/api/a': { get: { operationId: 'other', responses: {} } },
          '/api/b': {
            get: { operationId: 'getA', responses: {} },
            post: { operationId: 'getA', responses: {} },
          },
        },
        components: {
          schemas: { Thing: { type: 'number' }, ExtThing: { type: 'boolean' } },
        },
      },
      (message) => warnings.push(message),
    );

    expect(document.paths!['/api/b']!.get!.operationId).toBe('extGetA');
    expect(document.paths!['/api/b']!.post!.operationId).toBe('extGetA2');
    expect(document.components!.schemas!.Thing).toEqual({ type: 'string' });
    expect(document.components!.schemas!.ExtThing).toEqual({ type: 'boolean' });
    expect(document.components!.schemas!.ExtThing2).toEqual({ type: 'number' });
    expect(warnings).toHaveLength(4);
  });

  it('has no security schemes or requirement while nothing contributes one', async () => {
    const document = await documentOf(createApp());

    expect(document).not.toHaveProperty('security');
    expect(document.components).not.toHaveProperty('securitySchemes');
  });

  it('lists contributed security schemes and offers each requirement as an alternative', async () => {
    const app = createApp((docs) => {
      docs.addFragment({
        owner: '@nocobase/app-plugin-authentication',
        components: {
          securitySchemes: {
            cookieAuth: {
              type: 'apiKey',
              in: 'cookie',
              name: 'main.session_token',
            },
          },
        },
        security: [{ cookieAuth: [] }],
      });
      docs.addFragment(() => ({
        owner: '@nocobase/app-plugin-api-keys',
        components: {
          securitySchemes: {
            apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
          },
        },
        security: [{ apiKeyAuth: [] }, { cookieAuth: [] }],
      }));
    });
    const document = await documentOf(app);

    expect(document.components!.securitySchemes).toEqual({
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'main.session_token' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    });
    expect(document.security).toEqual([{ cookieAuth: [] }, { apiKeyAuth: [] }]);
    // A route that needs no credential says so, overriding the document's requirement.
    expect(document.paths!['/api/healthz']!.get!.security).toEqual([]);
    expect(document.paths!['/api/orders/{orderId}']!.get).not.toHaveProperty(
      'security',
    );
  });

  it('follows a renamed security scheme into the requirements that name it', () => {
    const document: ApiDocument = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: {
        securitySchemes: { tokenAuth: { type: 'http', scheme: 'bearer' } },
      },
      security: [{ tokenAuth: [] }],
    };
    mergeApiDocumentFragment(document, {
      owner: 'example',
      namespace: 'ext',
      paths: {
        '/api/x': { get: { security: [{ tokenAuth: [] }], responses: {} } },
      },
      components: {
        securitySchemes: {
          tokenAuth: { type: 'apiKey', in: 'header', name: 'x-token' },
        },
      },
      security: [{ tokenAuth: [] }],
    });

    expect(document.components!.securitySchemes!.extTokenAuth).toEqual({
      type: 'apiKey',
      in: 'header',
      name: 'x-token',
    });
    expect(document.security).toEqual([
      { tokenAuth: [] },
      { extTokenAuth: [] },
    ]);
    expect(document.paths!['/api/x']!.get!.security).toEqual([
      { extTokenAuth: [] },
    ]);
  });
});

describe('API documentation routes', () => {
  it('do not exist while no access check is registered', async () => {
    const app = createApp();

    for (const path of [
      '/api/swagger',
      '/api/swagger/docs',
      '/api/swagger/docs/swagger-ui.css',
    ]) {
      const response = await request(app, path, {
        headers: { authorization: 'Bearer ok' },
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: {
          status: 'NOT_FOUND',
          reason: 'ROUTE_NOT_FOUND',
          domain: 'app',
        },
      });
    }
  });

  it('answer 401 when every access check refuses', async () => {
    const app = createApp((docs) => {
      docs.addAccess({ name: 'session', check: () => false });
      docs.addAccess({ name: 'api-key', check: signedIn });
    });

    for (const path of ['/api/swagger', '/api/swagger/docs']) {
      const response = await request(app, path);
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: {
          status: 'UNAUTHENTICATED',
          reason: 'API_DOCS_UNAUTHENTICATED',
          domain: 'app',
        },
      });
    }
  });

  it('let an access check answer with an error of its own', async () => {
    const app = createApp((docs) => {
      docs.addAccess({
        name: 'session',
        check: () => {
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'DOCS_FORBIDDEN',
            domain: 'authentication',
            message: 'No.',
          });
        },
      });
    });

    const response = await request(app, '/api/swagger');
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { reason: 'DOCS_FORBIDDEN' },
    });
  });

  it('serve the document, the Swagger UI page and its files when one check allows', async () => {
    const app = createApp((docs) => {
      docs.addAccess({ name: 'session', check: () => false });
      docs.addAccess({ name: 'api-key', check: signedIn });
    });
    const headers = { authorization: 'Bearer ok' };

    const document = await request(app, '/api/swagger', { headers });
    expect(document.status).toBe(200);
    expect(await document.json()).toMatchObject({
      openapi: '3.1.0',
      paths: {
        '/api/orders/{orderId}': { get: { operationId: 'shopGetOrder' } },
      },
    });

    const page = await request(app, '/api/swagger/docs', { headers });
    expect(page.status).toBe(200);
    expect(page.headers.get('content-type')).toContain('text/html');
    const html = await page.text();
    expect(html).toContain('<title>main API</title>');
    expect(html).toContain('src="docs/swagger-ui-bundle.js"');
    expect(html).toContain('href="docs/swagger-ui.css"');
    expect(html).not.toMatch(/https?:\/\//);

    const initializer = await request(app, '/api/swagger/docs/initializer.js', {
      headers,
    });
    const script = await initializer.text();
    expect(script).toContain("url: '../swagger'");
    expect(script).toContain('persistAuthorization: true');

    const css = await request(app, '/api/swagger/docs/swagger-ui.css', {
      headers,
    });
    expect(css.status).toBe(200);
    expect(css.headers.get('content-type')).toBe('text/css; charset=utf-8');
    expect((await css.text()).length).toBeGreaterThan(1000);

    const bundle = await request(
      app,
      '/api/swagger/docs/swagger-ui-bundle.js',
      {
        headers,
      },
    );
    expect(bundle.status).toBe(200);
    expect(await bundle.text()).toContain('SwaggerUIBundle');

    const favicon = await request(app, '/api/swagger/docs/favicon-32x32.png', {
      headers,
    });
    expect(favicon.headers.get('content-type')).toBe('image/png');

    const unknown = await request(app, '/api/swagger/docs/package.json', {
      headers,
    });
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({
      error: { reason: 'ROUTE_NOT_FOUND' },
    });

    const assetWithoutAccess = await request(
      app,
      '/api/swagger/docs/swagger-ui.css',
    );
    expect(assetWithoutAccess.status).toBe(401);
  });

  it('fail start when a plugin route takes a docs path', async () => {
    const app = createApp();
    app.addRoutes(
      defineApiRoutes(() => {
        const router = new Hono();
        router.get('/swagger', (context) => context.json({}));
        return router;
      }),
      { owner: '@nocobase/app-plugin-example' },
    );

    await expect(app.start()).rejects.toThrow(
      'GET /api/swagger from @nocobase/app-plugin-example and GET /api/swagger from @nocobase/app-server',
    );
  });
});
