# Server Route examples

Use these examples when the concise rules in [Server development](./server.md) are not enough. They follow the current NocoBase v3 `defineApiRoutes()`, `defineRootRoutes()`, `Auth`, and `AppAuthorization` contracts on `develop`.

## Choose the mount scope first

| Requirement                  | Route API            | Source path          | Mounted application path |
| ---------------------------- | -------------------- | -------------------- | ------------------------ |
| Signed-in business API       | `defineApiRoutes()`  | `/orders`            | `/api/orders`            |
| Signed-in top-level entry    | `defineRootRoutes()` | `/orders/export`     | `/orders/export`         |
| Third-party payment callback | `defineRootRoutes()` | `/callbacks/payment` | `/callbacks/payment`     |

Do not repeat `/api`, the App name, or the deployment public base path in a contribution path. The host restores its public base path when it mounts the App. Every `/api` path starts with the plugin's namespace — `@nocobase/app-plugin-orders` owns `/orders` — and follows the [HTTP API rules](http-api.md) for methods, responses, errors and input validation. Root routes answer whatever their protocol requires.

Route scope does not supply security. Each contribution installs and tests its own authentication and authorization, or implements and tests an explicit public protocol boundary.

## Define the service contracts and Tokens

The examples keep reusable behavior behind service interfaces. A Route owns HTTP input, status codes, authentication, authorization, and error mapping; it delegates domain work to a service resolved from the container.

```ts
// server/tokens.ts
import type { RepositoryPolicy } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface OrderRecord {
  readonly id: string;
  readonly reference: string;
}

export interface CreateOrderInput {
  readonly reference: string;
}

export interface OrderService {
  /** Reads through `policy` when given: rows, fields and relations it allows. */
  list(policy?: RepositoryPolicy): Promise<readonly OrderRecord[]>;
  create(
    input: CreateOrderInput,
    policy?: RepositoryPolicy,
  ): Promise<OrderRecord>;
}

export interface PaymentDelivery {
  readonly deliveryId: string;
  readonly rawBody: string;
}

export interface PaymentSignatureInput extends PaymentDelivery {
  readonly signature: string;
  readonly timestamp: string;
}

export interface PaymentWebhookService {
  verify(input: PaymentSignatureInput): Promise<boolean>;
  accept(delivery: PaymentDelivery): Promise<'accepted' | 'duplicate'>;
}

export const orderServiceToken: ServiceToken<OrderService> =
  createServiceToken<OrderService>('@nocobase/app-plugin-orders/order-service');

export const paymentWebhookServiceToken: ServiceToken<PaymentWebhookService> =
  createServiceToken<PaymentWebhookService>(
    '@nocobase/app-plugin-orders/payment-webhook-service',
  );
```

The provider that owns a capability creates and exports its Token. Consumers import that exact Token; creating another Token with the same string produces a different container key.

## Authenticated API Route

A small Route is clearest when its factory resolves dependencies, installs middleware on an explicit owned path, and declares the handlers directly.

```ts
// server/routes/api.ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { orderServiceToken } from '../tokens.js';
import { OrderSchema } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const authentication = container.resolve(authenticationToken);
    const orders = container.resolve(orderServiceToken);

    router.use('/orders', authentication.required());
    router.get(
      '/orders',
      describeRoute({
        tags: ['Orders'],
        summary: 'List orders',
        operationId: 'ordersListOrders',
        responses: {
          '200': listResponse(OrderSchema),
          // No permission check, so no 403 and no apiErrorResponses; no validator, so no 400.
          '401': apiErrorResponse(401),
          '500': apiErrorResponse(500),
        },
      }),
      async (context) => {
        const rows = await orders.list();
        return context.json({ data: rows, meta: { total: rows.length } });
      },
    );

    return router;
  });
```

This contribution provides `GET /api/orders` and declares it in the application's API document, served at `/api/swagger/docs`; [HTTP API rules](http-api.md#api-documentation) describe each part of `describeRoute()`. A list this small is a bounded list that skips paging, so it still answers `meta.total`. The `/api` mount distinguishes an application API from a top-level entry; it does not authenticate the request.

Authentication answers who the caller is. This read endpoint deliberately permits every signed-in user. Add authorization when the business action is restricted.

## Independently protected Root Route

A Root contribution does not inherit middleware from an API contribution in the same plugin. Install authentication again on the Root path that requires it.

```ts
// server/routes/root.ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineRootRoutes,
  type AppRootRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

export const rootRoutes: AppRootRouteContribution<AppPluginApplication> =
  defineRootRoutes(({ container }) => {
    const router = new Hono();
    const authentication = container.resolve(authenticationToken);

    router.use('/orders/export', authentication.required());
    router.get('/orders/export', (context) =>
      context.json({ downloadUrl: '/temporary/orders.csv' }),
    );

    return router;
  });
```

Use an explicit owned path instead of contribution-wide `router.use('*', ...)`. Hono routers are composed in order, so wildcard middleware on a router mounted at a shared scope can affect a later contribution.

## Public callback with a real protocol boundary

A third-party webhook cannot normally present a NocoBase session. It may therefore be intentionally public from the application's session perspective, while still authenticating the sender with the third party's protocol.

```ts
// server/routes/payment-callback.ts
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineRootRoutes,
  type AppRootRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { paymentWebhookServiceToken } from '../tokens.js';

export const paymentCallbackRoutes: AppRootRouteContribution<AppPluginApplication> =
  defineRootRoutes(({ container }) => {
    const router = new Hono();
    const webhooks = container.resolve(paymentWebhookServiceToken);

    router.post('/callbacks/payment', async (context) => {
      const signature = context.req.header('x-payment-signature');
      const timestamp = context.req.header('x-payment-timestamp');
      const deliveryId = context.req.header('x-payment-delivery-id');
      const rawBody = await context.req.text();

      if (!signature || !timestamp || !deliveryId) {
        return context.json(
          {
            code: 'INVALID_PAYMENT_CALLBACK',
            message: 'Payment callback headers are incomplete',
          },
          401,
        );
      }

      const verified = await webhooks.verify({
        signature,
        timestamp,
        deliveryId,
        rawBody,
      });
      if (!verified) {
        return context.json(
          {
            code: 'INVALID_PAYMENT_SIGNATURE',
            message: 'Payment callback signature is invalid',
          },
          401,
        );
      }

      const result = await webhooks.accept({ deliveryId, rawBody });
      return context.json(
        { accepted: result === 'accepted', duplicate: result === 'duplicate' },
        result === 'accepted' ? 202 : 200,
      );
    });

    return router;
  });
```

This is a Root route, so its responses follow the payment provider's protocol rather than the `/api` error body. The service should compare signatures safely, reject timestamps outside the protocol window, prevent replay, and persist idempotency by `deliveryId`. Apply a request-body limit before buffering untrusted payloads. Keep provider-specific secrets out of logs and responses.

Test missing headers, an invalid signature, an expired or replayed delivery, a valid delivery, and a duplicate. The duplicate response should follow the provider's retry contract and must not repeat the business side effect.

## Authentication and authorization in an isolated child router

When a resource's operations need authorization as well as authentication, create a child router and mount it at the resource's path. It replaces the plain authenticated `/orders` route above: one operation has one URL. This is the appropriate place for `router.use('*', ...)` because the wildcard is isolated inside the child router.

```ts
// server/routes/schemas.ts
import { z } from 'zod';

import type { OrderRecord } from '../tokens.js';

export const CreateOrderInput = z.strictObject({
  reference: z.string().trim().min(1),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInput>;

// Typed against the service's record, so the documented response cannot drift from what the handler returns.
export const OrderSchema: z.ZodType<OrderRecord> = z
  .object({
    id: z.string(),
    reference: z.string().meta({ description: 'The order reference.' }),
  })
  .meta({ ref: 'OrdersOrder' });
```

```ts
// server/routes/orders.ts
import type { Auth } from '@nocobase/app-plugin-authentication';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import { type AuthorizationEnv } from '@nocobase/authorization/core';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { RepositoryPolicy } from '@nocobase/db';
import { Hono, type Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import type { OrderService } from '../tokens.js';
import { CreateOrderInput, OrderSchema } from './schemas.js';

export interface CreateOrderRoutesOptions {
  readonly authentication: Auth;
  readonly authorization: AppAuthorization;
  readonly orders: OrderService;
}

export function createOrderRoutes(
  options: CreateOrderRoutesOptions,
): Hono<AuthorizationEnv> {
  const routes = new Hono<AuthorizationEnv>();

  // The application renders errors under /api; installing the handler here keeps
  // the standard body when this router is tested on its own.
  routes.onError(apiErrorHandler);
  routes.use('*', options.authentication.required());
  routes.use('*', options.authorization.middleware());

  // The feature gate: a registered settings item, whose check never depends on records. It runs as middleware ahead
  // of the validators, so a caller without it learns nothing about the input a route expects.
  const gate = (action: string) =>
    createMiddleware<AuthorizationEnv>(async (context, next) => {
      await context.get('authz').require({
        resource: { type: 'settings', id: 'orders-admin' },
        action,
      });
      await next();
    });
  // Data access: the collection's CRUD decisions folded into one Repository policy.
  const policy = async (
    context: Context<AuthorizationEnv>,
    action: 'read' | 'create',
  ): Promise<RepositoryPolicy> => {
    const orders = await options.authorization.database.policyFor(
      'orders',
      context.get('authz'),
    );
    if (orders[action] === false)
      throw new ApiError({
        status: 'PERMISSION_DENIED',
        reason: 'ORDER_ACCESS_DENIED',
        domain: 'orders',
        message: `The caller may not ${action} orders.`,
      });
    return orders;
  };

  routes.get(
    '/',
    gate('read'),
    describeRoute({
      tags: ['Orders'],
      summary: 'List orders',
      operationId: 'ordersListOrders',
      responses: { '200': listResponse(OrderSchema), ...apiErrorResponses },
    }),
    async (context) => {
      const orders = await policy(context, 'read');
      const rows = await options.orders.list(orders);
      return context.json({ data: rows, meta: { total: rows.length } });
    },
  );

  routes.post(
    '/',
    gate('create'),
    describeRoute({
      tags: ['Orders'],
      summary: 'Create an order',
      operationId: 'ordersCreateOrder',
      responses: { '201': dataResponse(OrderSchema), ...apiErrorResponses },
    }),
    apiValidator('json', CreateOrderInput),
    async (context) => {
      const orders = await policy(context, 'create');
      const input = context.req.valid('json');
      return context.json(
        { data: await options.orders.create(input, orders) },
        201,
      );
    },
  );

  return routes;
}
```

The current authorization middleware reads the session set by `Auth.required()`, establishes the request identity, and stores an `AuthorizationContext` in `context.get('authz')`. Install middleware in that order. `require()` throws `AuthorizationDeniedError` for a denied or conditional decision; the application answers it `403` with reason `AUTHORIZATION_DENIED` and domain `authorization`, and the router above renders it the same way when tested alone. Use it only for the feature gate: the owning provider registers `authz.settings.add({ id: 'orders-admin', title, actions: [{ name: 'read' }, { name: 'create' }] })` and `authz.database.collections.add({ name: 'orders', title })`, where a collection id is the collection name. Never call `require` on a `database.collection` check: a grant with record access makes it conditional, so it is denied even when some rows are allowed. Bind the policy from `authz.database.policyFor` to the Repository instead, or, for a business operation, `authorize` the business action and bind `decision.conditions.database[collection]`, as `packages/app/app-skills/skills/nocobase-app-development/references/server-routes.md` describes.

The child router is still plugin-owned code, not a new framework contribution API. The framework contribution resolves the owner-exported Tokens and mounts the returned `Hono`.

```ts
// server/routes/orders-contribution.ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { orderServiceToken } from '../tokens.js';
import { createOrderRoutes } from './orders.js';

export const orderRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    router.route(
      '/orders',
      createOrderRoutes({
        authentication: container.resolve(authenticationToken),
        authorization: container.resolve(authorizationToken),
        orders: container.resolve(orderServiceToken),
      }),
    );
    return router;
  });
```

Do not add a `registerOrderRoutes(router, dependencies): void` helper that mutates a router owned by its caller solely to make tests convenient. A domain factory that returns its own `Hono` is independently testable, and the production contribution itself exposes `createRouter()` for wiring tests.

## Compose the contributions

Keep Root and API contributions in a stable array. The Server plugin consumes the array directly; there is no Route loader.

```ts
// server/routes/index.ts
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import { orderRoutes } from './orders-contribution.js';
import { paymentCallbackRoutes } from './payment-callback.js';
import { rootRoutes } from './root.js';

// orderRoutes serves /api/orders; the plain apiRoutes version is not listed
// beside it, because one URL has one handler.
const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  rootRoutes,
  paymentCallbackRoutes,
  orderRoutes,
];

export default routes;
```

`server/plugin.ts` supplies an absolute `baseDir`, package identity, providers, and the direct Route array. Declaration modules must remain import-safe: top-level code creates definitions and arrays, but does not resolve services or execute a Route factory.

```ts
// server/plugin.ts
import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const plugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-orders',
  serviceProviders,
  routes,
});

export default plugin;
```

## Test the production contributions

Call each exported contribution's real `createRouter()` with a complete `AppPluginApplication`. The following focused test uses the real `Auth` class with a database provided by `createDatabaseTest()` and substitutes only `getSession()` to select anonymous behavior without unsafe partial-class casts.

```ts
// tests/server/routes.test.ts
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { createConfigPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, vi } from 'vitest';

import { apiRoutes } from '../../server/routes/api.js';
import { rootRoutes } from '../../server/routes/root.js';
import { orderServiceToken } from '../../server/tokens.js';

const test = createDatabaseTest();

describe('order Route contributions', () => {
  test('owns both authentication boundaries without middleware bleed', async ({ connection }) => {
    const authentication = new Auth({
      connection,
      baseURL: 'http://example.test',
      secret: 'route-example-test-secret-at-least-32-characters',
    });
    vi.spyOn(authentication, 'getSession').mockResolvedValue(null);

    const container = new ServiceContainer();
    container.instance(authenticationToken, authentication);
    container.instance(orderServiceToken, {
      list: async () => [{ id: 'order-1', reference: 'SO-1000' }],
      create: async (input) => ({ id: 'order-2', ...input }),
    });

    const application = new Hono();
    const app: AppPluginApplication = {
      appName: 'main',
      publicBasePath: '',
      config: { app: { name: 'main', publicBasePath: '' } },
      paths: createConfigPaths({ rootDir: '/tmp/order-route-example' }),
      router: application,
      container,
    };
    application.route('/api', await apiRoutes.createRouter(app));
    application.route('/', await rootRoutes.createRouter(app));
    application.get('/api/laterPlugin', (context) => context.text('later'));

    expect((await application.request('/api/orders')).status).toBe(401);
    expect((await application.request('/orders/export')).status).toBe(401);
    await expect(
      (await application.request('/api/laterPlugin')).text(),
    ).resolves.toBe('later');
  });
});
```

This test builds a complete application object and runs the same contribution factories used in production. It avoids a test-only `register...` API and avoids pretending that a partial object is an `Auth` instance.

Add a test that the routes are declared: start the application, or mount the contribution on a bare `Hono` as above, and expect `findUndeclaredApiRoutes(router)` from `@nocobase/app-server/router` to be empty and `findApiDocumentSchemaProblems(await generateApiDocument(router, { info: { title: 'test', version: '0' } }))` to be empty too, with the generated document containing `ordersListOrders`. `packages/examples/app-plugin-routes-example/tests/routes.test.ts` does the same for its route.

Add focused tests for authenticated success, `403` with `error.reason` `AUTHORIZATION_DENIED`, each resource/action pair, invalid input answered `400` with reason `INVALID_INPUT` and the field in `fieldViolations`, an unknown body field, callback signature and replay behavior, and service calls. Add a target App integration test for final public-base-path mounting, real sign-in cookies, persisted grants, and multi-plugin composition. The maintained sources below contain larger test suites when the focused pattern is not enough.

## Current maintained source

- Runnable Root and API contribution implementations (`packages/examples/app-plugin-routes-example/server/routes`)
- Production `createRouter()` contribution tests and middleware-leak check (`packages/examples/app-plugin-routes-example/tests/routes.test.ts`)
- Typed real-`Auth` test fixture on the selected test database (`packages/examples/app-plugin-repository-example/tests/helpers.ts`)
- Authentication middleware and `AuthEnv` (`packages/plugins/app-plugin-authentication/server/auth.ts`)
- Authorization middleware, error mapping, and protected handlers (`packages/plugins/app-plugin-authorization/server/routes/authorization.ts`)
- Route contribution contracts (`packages/app/app-server/src/router/routes.ts`)
- Route declarations, response helpers and the document generator (`packages/app/app-server/src/router/openapi/`)

When these implementations change, update the examples to match the exported APIs rather than preserving an obsolete snippet.
