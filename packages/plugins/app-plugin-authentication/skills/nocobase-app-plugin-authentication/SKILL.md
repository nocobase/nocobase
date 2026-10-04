---
name: nocobase-app-plugin-authentication
description: 'Build authentication requirements in a NocoBase 3 application: protect API routes and pages with the session, read and refresh the session in the browser, customize the login, registration and password pages, add sign-in methods such as social login, OIDC or a custom Better Auth plugin, manage account lifecycle from server code, and configure secrets, cookies and shared storage for deployment.'
metadata:
  short-description: Build authentication into a NocoBase 3 application
  domain-owner: '@nocobase/app-plugin-authentication'
---

# Authentication development

Use this Skill when an application built on `@nocobase/app-plugin-authentication`
needs anything about who the caller is: protecting a route or page, reading the
current user, changing the sign-in pages, adding a sign-in method, disabling
accounts, or preparing authentication for deployment.

Do not use it for what a signed-in user may do — that is
`nocobase-app-plugin-authorization` — or for the user administration page,
which is `nocobase-app-plugin-users`. Do not modify the plugin's own source,
migrations, or `dist/`; everything below is done in the application.

The plugin wraps Better Auth. Application configuration is Better Auth
configuration, and every Better Auth plugin, social provider, and hook is
available through it. Read the installed Better Auth version's documentation
for option details; this Skill covers where those options go in a NocoBase
application and what the plugin adds on top.

## Public surfaces

Server, from `@nocobase/app-plugin-authentication` (the root entry is the
server entry) or `@nocobase/app-plugin-authentication/server`:

- `authenticationToken` resolves the `Auth` instance: `required()`,
  `optional()`, `getSession(headers)`, `handler(request)`.
- `AuthEnv` types a Hono router whose routes read `context.get('auth')`.
- `userAdministrationServiceToken` resolves `UserAdministrationService`:
  `list`, `get`, `create`, `update`, `disable`, `enable`, `resetPassword`,
  `revokeSessions`, `withConnection`; errors are `UserAdministrationError`.
- `AuthConfig` is Better Auth's `BetterAuthOptions`, the type of the application's `server/config/auth.ts`. User initialization configuration lives separately under `users.initialAdmin`.
- `createAuthentication`, `databaseAdapter`, `createAuthStorage` build an
  instance outside the application runtime, mainly in tests.

Client, from `@nocobase/app-plugin-authentication/client`:

- `authentication()` is the registration factory. It takes no options,
  contributes no routes, and mounts one React provider.
- `useAuthentication()` returns `{ client, session, isPending, refresh }`;
  `useAuthenticationClient()` returns the Better Auth client alone.
- `RequiredAuthentication`, `GuestAuthentication`, and
  `AuthenticationGuard({ mode })` gate a route subtree on the session.
- `AuthConfig` is Better Auth's client options, the type of the application's
  `client/config/auth.ts`.
- `authenticationClientToken` is the client's service token, used to stub the
  client in component tests.

Headless actions, from `@nocobase/app-plugin-authentication/client/actions`:
`usePasswordLogin`, `usePasswordRegistration`, `usePasswordResetRequest`,
`usePasswordReset`, each returning `{ submit, isPending, error }`.

HTTP: every Better Auth endpoint is served under `/api/auth/*` by the plugin's
own route. A Better Auth plugin's endpoints appear there automatically. There
is no other authentication REST surface.

## Choose the task path

| The task is                                                                                  | Read                                                                         |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Require or read the session in an API route, compose with authorization, test it             | [protecting routes](references/protecting-routes.md)                         |
| Read the user in a component, sign out, gate a page, change the login pages, add SSO buttons | [client session and pages](references/client-session-and-pages.md)           |
| Add GitHub, Google, OIDC, magic link, or another sign-in method                              | [adding sign-in methods](references/adding-sign-in-methods.md)               |
| The identity platform uses a protocol Better Auth cannot express                             | [custom Better Auth plugin](references/custom-better-auth-plugin.md)         |
| Disable or reset an account from server code, add user fields, send reset emails, deploy     | [user lifecycle and deployment](references/user-lifecycle-and-deployment.md) |

Read only the reference the task needs.

## Ownership

- The plugin owns the protocol, the `user`, `session`, `account`, and
  `verification` collections and their migrations, session validation, the
  guards, the headless actions, and the `/api/auth/*` route.
- The application owns `server/config/auth.ts`, `client/config/auth.ts`, the
  four guest routes in `client/routes.ts`, the pages in `client/pages/auth/`,
  the UI in `client/extensions/nocobase-auth-ui/`, its own migrations for any
  schema a sign-in method adds, and every environment variable and secret.
- Authorization owns permissions. Users owns the administration page. The
  application's own code decides which roles exist.
- The plugin's `skills/` source is authoritative. `.agents/skills/` is a
  synchronized copy and must not be edited.

## Reversible UI customization

Prefer props and page composition, then new application components outside `client/extensions/nocobase-auth-ui/`, over editing the original extension files. Reuse the headless authentication actions in custom forms. Disabling registration or another feature should preserve its pages and components, conditionally disable the route, and hide its entry points so it can be restored. The server must still reject the disabled operation. Read [client session and pages](references/client-session-and-pages.md) for the implementation and verification rules.

## Constraints

- Mounting under `/api` authenticates nothing. A route is protected only by
  `auth.required()` on it. `auth.optional()` never rejects.
- Browser guards are navigation, not security. The server authenticates every
  request independently.
- Configuring a Better Auth plugin changes no database. Any model or field it
  needs is an application migration in `database/migrations/`; never copy or
  edit the plugin's migrations, and never let Better Auth alter tables.
- Sessions and cookies are created by Better Auth only. Do not mint a second
  token, store a session in `localStorage`, or resolve identity from a client
  claim.
- Bind an external identity by a stable `issuer + subject`, never by an
  unverified email. Merging accounts on email is a product decision that has to
  be stated explicitly before it is implemented.
- Secrets stay in server configuration or environment. Nothing under `client/`
  may read one.
- Never log a password, session token, verification value, ticket, or OAuth
  token. Log user ids, request ids, and outcomes.
- A disabled account is rejected at sign-in with `403 ACCOUNT_DISABLED`, and
  its existing sessions and realtime connections are revoked at once. Do not
  add a parallel "active" flag.

## Verification

- Anonymous requests to a protected route return `401` with the standard error body, `error.reason` `AUTHENTICATION_REQUIRED`; the same request with a session returns the route's own response.
- An authenticated request that lacks permission returns `403` from
  authorization, not `401`.
- A `required` route redirects an anonymous browser to `/login`; a `guest`
  route redirects a signed-in browser to `/`.
- After sign-out the previous cookie no longer authenticates.
- A new sign-in method signs a new user in, signs an already bound user in,
  rejects an invalid, expired, or reused credential, and creates exactly one
  binding under concurrent first sign-ins.
- A migration added for a sign-in method runs `up` and `down` against a real
  test database.
- The application passes `lint`, `typecheck`, `test`, and `build`. Skill
  synchronization alone proves only that the copy matches this source.

## Trusted plugin API

`Auth.pluginApi<TPlugin>(pluginId)` returns only the registered plugin’s API methods through Better Auth’s normal dispatch, including before and after hooks. It does not expose the full authentication context and does not authenticate a caller. `Auth.forConnection(connection)` binds those operations to a caller-owned transaction. Consumers still enforce authorization; HTTP-specific hooks must explicitly check for `request` or `headers` instead of accidentally denying trusted server calls.

## Initial administrator

Before the first seed run, set `users.initialAdmin.username`, `users.initialAdmin.email` and `users.initialAdmin.password` in application configuration to customize the bootstrap account. Omitting the entire node preserves `nocobase` / `admin@nocobase.com` / `admin123`; an explicit node requires a nonempty password and defaults the username to `nocobase` and the email to `admin@nocobase.com`. Usernames contain 3–30 letters, digits, underscores or dots, emails must be valid addresses, and both are stored lowercase. Initialization only runs when the user table is empty, hashes the password and grants the newly created account root permission through the authorization plugin. After initialization, configuration changes do not reset accounts or rerun the recorded seeds. The root permission seed selects the administrator by the same configured username. Use the user administration service for subsequent account changes. Do not edit historical seeds or add a competing administrator seed.
