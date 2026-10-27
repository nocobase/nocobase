# Protecting routes

Every server route decides its own authentication. Resolve the `Auth` instance
from the container and put `auth.required()` in front of the routes that need
a signed-in caller.

```ts
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

export const apiRoutes: AppApiRouteContribution<Application> = defineApiRoutes(
  (app) => {
    const auth = app.container.resolve(authenticationToken);
    const routes = new Hono<AuthEnv>();

    routes.use('/orders/*', auth.required());
    routes.get('/orders', (context) => {
      const { user, session } = context.get('auth')!;
      return context.json({
        data: { userId: user.id, expiresAt: session.expiresAt.toISOString() },
      });
    });

    return routes;
  },
);
```

Follow the application's own route conventions for where this file lives and
how it is registered; the application Skill's server-routes reference covers
that. This reference covers what the plugin adds.

## The two middlewares

- `auth.required()` rejects an anonymous request with `401 UNAUTHENTICATED` in the standard error body, reason `AUTHENTICATION_REQUIRED`, domain `authentication`. On success `context.get('auth')` is `{ user, session }`.
- Both middlewares reject a cookie-bearing write whose `Origin` (or `Referer`) is not trusted with `403 PERMISSION_DENIED`, reason `INVALID_CSRF_ORIGIN`, domain `authentication`.
- `auth.optional()` sets `context.get('auth')` to the session or `null` and
  never rejects. Use it for a route whose response differs for a signed-in
  caller but is still public.

Both accept `{ skip: (context) => boolean }` to exempt specific requests, for
example a health probe inside an otherwise protected prefix. A skipped request
has no `auth` variable at all; read it only after checking.

`AuthEnv` is `{ Variables: { auth: AuthSession } }`. Type the router with it so
`context.get('auth')` compiles. `AuthSession` is `{ user, session } | null`;
`user` carries `id`, `name`, `email`, `emailVerified`, `username`, `image`,
`disabledAt`, `createdAt`, `updatedAt`, plus any `user.additionalFields` the
application configured.

## What a session means

`auth.getSession(headers)` is what both middlewares call. It asks Better Auth
for the cookie's session and then re-reads the user row: a user that no longer
exists or has `disabledAt` set yields `null` even though the cookie is still
valid. That is why disabling an account takes effect immediately for HTTP.

Use `getSession` directly when you have a `Request` but no Hono context, for
example in a WebSocket upgrade or a job that validates a caller-supplied
request. Do not call Better Auth's `api.getSession` yourself; it skips the
disabled check.

## Composing with authorization

Authentication answers who is calling. Authorization answers whether they may
do this. Run them in that order on the same router:

```ts
routes.use('*', auth.required(), authorization.middleware());
routes.get('/orders/:orderId', async (context) => {
  // Throws AuthorizationDeniedError, which the application answers as 403 PERMISSION_DENIED.
  await context.get('authz').require({
    resource: { type: 'orders', id: context.req.param('orderId') },
    action: 'read',
  });
  // ...
});
```

The authorization middleware reads the principal from `context.get('auth')`,
so `auth.required()` must come first. An anonymous caller gets `401` from
authentication; a signed-in caller without permission gets `403` from
authorization. Do not collapse the two into one status.

Everything past `can()` and `authorize()` is the authorization Skill's
territory. Read `nocobase-app-plugin-authorization` before building
ownership rules or record filters.

## Scoped keys and service accounts

`auth.required()` refuses a session that a scoped credential stands behind — an API key with a scope, or any key of a service account — with 403 `SCOPED_KEY_FORBIDDEN`. A route that authorizes each operation through `authz` (or narrows by `identity.keyScope` itself) accepts them with `auth.required({ scopedKeys: true })`; leave everything else, such as a person's own inbox or profile, refusing them. The plugin that issues scoped keys registers how to recognize one with `auth.addScopedCredentialCheck`, and `auth.isScopedSession(session, request)` answers the same question in code.

## Public routes

A webhook or OAuth callback cannot present a session cookie and is public by
design. Public still needs a boundary: verify the provider's signature, bind a
one-time value such as `state` to the request, and rate-limit the endpoint.
Mount it with the application's root routes rather than under `/api`, and do
not put `auth.optional()` on it as if that were protection.

## Realtime

The plugin registers a realtime principal resolver that maps a connection to
`{ userId }` through the same `getSession`. An application that installs its
own resolver first wins; the plugin only registers when none exists. Revoking
a user's sessions also disconnects that user's realtime connections.

## Testing a protected route

Route tests should not sign in through Better Auth. Register a stub under
`authenticationToken` whose `required()` and `optional()` set the session you
want, then assert both the anonymous and the authenticated response:

```ts
const container = new ServiceContainer();
container.instance(authenticationToken, testAuth);

const router = await apiRoutes.createRouter({ /* ... */ container });

expect((await router.request('/orders')).status).toBe(401);
```

The application Skill's testing reference shows the full `createRouter` call
and a `testAuth` shape. For an integration test that exercises the real
plugin, build an `Auth` with `createAuthentication({ connection, secret })`
against a test database, sign up through `auth.handler()` with a
`POST /api/auth/sign-up/email` request, and reuse the returned `set-cookie`
header on later requests. The plugin's own integration tests do exactly this.
