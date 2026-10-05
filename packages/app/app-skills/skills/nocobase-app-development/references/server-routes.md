# Server routes

HTTP endpoints live in `server/routes/` and are listed in the array `server/routes/index.ts` exports, which `server/runtime.ts` passes to the application.

## Two kinds

| Function             | Path in code     | Final URL        | For                                              |
| -------------------- | ---------------- | ---------------- | ------------------------------------------------ |
| `defineApiRoutes()`  | `/orders`        | `/api/orders`    | Application APIs the browser calls               |
| `defineRootRoutes()` | `/callbacks/pay` | `/callbacks/pay` | Webhooks, OAuth callbacks, protocol entry points |

Do not repeat `/api` in the path, and never write the deployment base path such as `/main` — both are added by the runtime.

Name paths, shape responses and errors, validate input and declare each route for the API document as [HTTP API design](http-api.md) describes. Every `/api` route carries a `describeRoute()` and validates its input with `apiValidator()`, both from `@nocobase/app-server/router`; a route without a declaration is a defect.

## An authenticated endpoint

```ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiValidator,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { ListOrdersQuery, OrderSchema } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<Application> = defineApiRoutes(
  (app) => {
    const router = new Hono();
    const auth = app.container.resolve(authenticationToken);
    const orders = app.container.resolve(orderServiceToken);

    router.use('/orders', auth.required());
    router.get(
      '/orders',
      describeRoute({
        tags: ['Orders'],
        summary: 'List orders',
        operationId: 'listOrders',
        responses: {
          '200': listResponse(OrderSchema),
          // It requires a session but checks no permission, so it lists its statuses instead of spreading apiErrorResponses.
          // The query validator adds the 400 for invalid input.
          '401': apiErrorResponse(401),
          '500': apiErrorResponse(500),
        },
      }),
      apiValidator('query', ListOrdersQuery),
      async (context) => {
        const { page, pageSize } = context.req.valid('query');
        const result = await orders.list({ page, pageSize });
        return context.json({
          data: result.rows,
          meta: { page, pageSize, total: result.total },
        });
      },
    );

    return router;
  },
);
```

The factory creates and returns its own router. Resolve dependencies from `app.container` inside the factory. `ListOrdersQuery` and `OrderSchema` are zod schemas in `server/routes/schemas.ts`; [HTTP API design](http-api.md#declaring-a-route) describes how to write them and what each part of `describeRoute()` means.

## Every route owns its own security

**Mounting under `/api` does not authenticate anything.** `/api` is a location. A route with no `auth.required()` is public regardless of where it mounts.

Never depend on middleware installed by another route, or on the order contributions happen to be registered in. Contribution order changes when a plugin is added, and a route protected only by someone else's middleware silently becomes public.

`auth.required()` rejects anonymous requests with `401 UNAUTHENTICATED`, reason `AUTHENTICATION_REQUIRED`. `auth.optional()` attaches the session when present without rejecting.

## Authorization, when identity is not enough

Authentication answers who is calling. Authorization answers whether they may perform this action. Sensitive operations need both:

```ts
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import {
  ApiError,
  apiErrorResponses,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';

export const orderAdminRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    const routes = new Hono<AuthorizationEnv>();
    const auth = app.container.resolve(authenticationToken);
    const authorization = app.container.resolve(authorizationToken);

    routes.use('*', auth.required(), authorization.middleware());
    routes.get(
      '/',
      describeRoute({
        tags: ['Orders'],
        summary: 'List orders for administration',
        operationId: 'listAdministeredOrders',
        responses: {
          '200': listResponse(OrderSchema),
          // 401, 403 and 500: authenticated, with a permission check. No validator, so no 400.
          ...apiErrorResponses,
        },
      }),
      async (context) => {
        const allowed = await context.get('authz').can({
          resource: { type: 'settings', id: 'orders-admin' },
          action: 'read',
        });
        if (!allowed) {
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'ORDERS_ADMIN_DENIED',
            domain: 'orders',
            message: 'Reading the order administration is not allowed.',
          });
        }

        const { rows, total } = await listOrders();
        return context.json({ data: rows, meta: { total } });
      },
    );

    router.route('/orderAdmin', routes);
    return router;
  });
```

Use a stable `resource`/`action` pair per operation — `read` and `create` are distinct decisions. The pair must be registered: `settings`, `composite` and `database.collection` deny an item or action nobody added, so this route's owner calls `authz.settings.add({ id: 'orders-admin', title, actions: [{ name: 'read' }] })` in its provider's `boot` and may list it in an administration subsection with `authz.ui.place({ type: 'settings', id: 'orders-admin' }, { section })`; an unplaced item is listed under Administration's "Other". `can` is true only for an unconditional permit; a check that depends on records, such as a `database.collection` grant with record access, is conditional and needs the policy flow below.

### Enforce record, field and relation policies

Read [application permission development](authorization.md) and the installed `nocobase-app-plugin-authorization` Skill before building data access. Register each governed collection explicitly in the owning provider with `authz.database.collections.add({ name, title, actions? })`; the database supplies field/relation metadata. Unregistered collections are denied even to unrestricted users.

For ordinary collection CRUD, resolve and bind the policy:

```ts
const policy = await authz.database.policyFor(
  'customers',
  context.get('authz'),
);
if (policy.read === false) {
  throw new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'CUSTOMERS_READ_DENIED',
    domain: 'customers',
    message: 'Reading customers is not allowed.',
  });
}
const customers = database.repository('customers').withPolicy(policy);
return context.json({ data: await customers.findMany() });
```

For a business operation, call the request context's `authorize({ resource: { type: 'composite', id }, action })` once, reject denied or missing policies, and bind each table's `decision.conditions.database[collection]` policy. Do not replace it with aggregate collection authorization: grants from another business operation could widen the result. `require` rejects conditional decisions; `can` reports feature visibility rather than access to a specific record.

Bound repositories enforce rows, fields and relations together. Keep multi-table writes transactional and business-state predicates in the update. Map out-of-scope `RECORD_NOT_FOUND` errors consistently without exposing hidden records. Never fetch unrestricted rows and filter them in the browser.

### Repository API endpoints

Keep `defineRepositoryApiRoutes` and its static policies. For business authorization, follow the installed authorization Skill’s `references/repository-routes.md`: `authz.database.authorizeRepository({ repository, resource, actions })` binds Repository methods to typed business actions and narrows the existing policy through middleware. Authenticate first and cover every action of the protected exposure. Use the shortcut when one Repository operation and one data scope complete the action with standard input/output; independent type/length validation can remain middleware. Persisted-state checks, side effects, multiple scopes and enriched responses require custom handlers: project title/notes editing fits the shortcut, while draft quote editing, quote submission and order delivery do not. One resource can use both styles for different actions. Do not substitute collection-aggregated grants for a business-action decision.

Static endpoint policies only narrow user grants. Read/write relation capabilities must be explicitly granted; a relation in the static shape does not create permission. Use the authorization Skill's `references/business-module.md` for the full workflow and `references/fluent-registration.md` for field/relation declarations. The installable authorization example demonstrates quote submission and delivery responsibilities.

## Scope middleware to paths you own

Use the explicit path, or an isolated sub-router mounted at your prefix as above. A `router.use('*', ...)` on the top-level router leaks into contributions mounted later and is the way an unrelated endpoint accidentally becomes protected — or, worse, the way yours accidentally is not.

## Deliberately public routes

A third-party webhook cannot present a login session, so it is public by design. Public still requires a security boundary:

```ts
router.post('/callbacks/payment', async (context) => {
  const signature = context.req.header('x-payment-signature');
  const body = await context.req.text();

  if (!signature || !verify(body, signature)) {
    return context.json({ code: 'INVALID_SIGNATURE' }, 401);
  }

  await acceptPayment(body);
  return context.json({ accepted: true }, 202);
});
```

A root route is not under `/api`, so its responses are whatever the third party's protocol expects rather than the standard `/api` body, and it is not part of the API document.

A public route under `/api`, such as a status probe or data the sign-in page reads before anyone is signed in, still declares itself, and adds `security: []` to its `describeRoute()` so the document does not claim it needs a session or an API key.

Verify the signature, and handle timestamps, replay protection, and idempotency as the third-party protocol requires. Record in a comment why the route is public. Test anonymous requests with a missing signature, a wrong signature, a valid signature, and a duplicate delivery.

## Structuring larger routes

One or two handlers belong directly in the factory. When a domain grows several handlers or shared error handling, extract a function that returns its own `Hono` and mount it:

```ts
export function createOrderRoutes(options: CreateOrderRoutesOptions): Hono {
  const routes = new Hono();
  routes.use('*', options.auth.required());
  routes.get(
    '/:orderId',
    describeRoute({
      tags: ['Orders'],
      summary: 'Get an order',
      operationId: 'getOrder',
      responses: {
        '200': dataResponse(OrderSchema),
        '401': apiErrorResponse(401),
        '404': apiErrorResponse(404),
        '500': apiErrorResponse(500),
      },
    }),
    apiValidator('param', OrderParams),
    async (context) =>
      context.json({
        data: await options.orders.get(context.req.valid('param').orderId),
      }),
  );
  return routes;
}
```

Do not write a helper that mutates a router passed in by its caller. Returning a router you own keeps the security boundary inside the thing being tested.

## Keep the layers apart

Routes handle HTTP: parsing input, checking permission, shaping the response and status. Domain logic goes in a service under `server/providers/` — see [services and jobs](services-and-jobs.md). A service should not read a Hono context or decide status codes.

## Registering

Export the contributions in order from `server/routes/index.ts`:

```ts
const routes: readonly AppRouteContribution<Application>[] = [
  apiRoutes,
  rootRoutes,
];

export default routes;
```

Declaration modules must not connect to the database, start workers, or execute route factories at import time.

## Calling from the browser

In React components and custom Hooks, use `useApiClient()` from `@nocobase/app-client` to obtain the application's HTTP client so requests follow the configured `api.baseURL`. Outside React, resolve `apiClientToken` from the application's services or pass the client explicitly. Request paths are relative to that base; do not hardcode `/api` or the deployment mount path. See [client API requests](frontend/references/api.md) for client resolution, custom requests, uploads, cancellation, errors and remote Repository operations.

## Verify

- An anonymous request returns `401`.
- An authenticated request without permission returns `403`.
- A caller restricted to their own records cannot read, update, or delete someone else's — verified by request, not by reading the code.
- A permitted request returns the expected payload.
- Middleware does not leak into other routes.
- Every `/api` route is declared: after `app.start()`, `findUndeclaredApiRoutes(app)` is empty, and the route appears in `GET /api/swagger` with its `operationId`. See the Verify section of [HTTP API design](http-api.md#verify).
- A public route rejects missing and invalid signatures, and handles duplicate delivery.
