# Enabling an official Better Auth plugin

The authentication plugin is Better Auth with NocoBase storage, so every official Better Auth plugin is available to an application: sign-in methods, and also everything else Better Auth offers, such as device login for a CLI, bearer tokens, organizations, two-factor and passkeys. This reference covers enabling any of them. [Adding sign-in methods](adding-sign-in-methods.md) covers the sign-in specifics, and [a custom Better Auth plugin](custom-better-auth-plugin.md) the case where nothing official fits.

## Official plugin first

When a requirement touches authentication, look for an official Better Auth plugin before writing anything. Read the plugin list and the plugin's page in the documentation of the Better Auth version the application has installed (the version in the lockfile; the published source is in `node_modules/better-auth/dist/plugins/<plugin>/`), not from memory: options, endpoints and schema change between releases. An official plugin brings its endpoints, rate limits, error codes and OpenAPI description, and its security handling has been reviewed upstream. Write a custom plugin only when no official one fits, and say which official plugins were ruled out and why.

Enabling one takes four steps, all in the application:

1. Add the plugin to `plugins` in `server/config/auth.ts`, keeping the plugins already there, and its client counterpart, when it has one, to `client/config/auth.ts`.
2. Write the migration its schema needs ([below](#schema)).
3. Add the UI it needs, preferring a UI Library block when one exists.
4. Test the flow end to end through `/api/auth/*`, including the migration.

Every endpoint the plugin adds is served under `/api/auth/*` at once and documented in the application's API document; do not write a Hono route for it. Do not add `openAPI()`, which would publish an unauthenticated reference page of its own.

## Schema

Configuring a plugin changes nothing in the database: the plugin starts, and the first request that touches its model fails against a missing table or column. The authentication plugin owns only its own tables (`user`, `session`, `account`, `verification`), so the application creates whatever else a plugin it chooses needs. Do this before enabling it:

1. Find the plugin's schema in the installed version: the schema section of its documentation page, and `schema.mjs` beside its source. It lists every model the plugin adds and every field it adds to `user`, `session` or `account`, with type, required, unique and index information. `twoFactor`, `passkey`, `organization`, `deviceAuthorization` and `magicLink` add schema; `username`, `emailOTP` and `bearer` extend or reuse existing tables. NocoBase's API keys plugin creates the `apikey` table itself.
2. Write one application migration in `database/main/migrations/` that creates those models and alters those collections, spelling out every field, type, length, nullability, unique constraint and index exactly as the schema declares them, with a `down` that reverses it. Follow the application Skill's migrations reference for the DSL. Keep Better Auth's model and field names (`deviceCode`, `userCode`); the adapter maps them to the naming strategy. Say in the migration which Better Auth version the shape comes from, and add a new migration when a later version adds a field.
3. Put a unique constraint on every external-account key, normally `issuer + subject` or the plugin's own identifier column. It prevents double binding and settles concurrent first sign-ins.
4. Test the migration with `describeMigration()` from `@nocobase/app-testing/server`, and exercise the plugin's endpoints in a test against the migrated database, so a field the documentation omitted is found there and not in production.

Never copy or edit the authentication plugin's migrations, never run Better Auth's schema generation or `migrate` against the application database, and do not add physical foreign keys to the authentication tables. The adapter does not support Better Auth join queries; read the plugin's source for `join` before adopting it, and say so if it uses one.

## Common cases

| Requirement                                          | Use                                                                                                                                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A CLI or another device signs in through the browser | `deviceAuthorization()` with `bearer()` on the server, `deviceAuthorizationClient()` on the client, the `device-approval` UI Library block on a signed-in `/device` route, and a migration creating `deviceCode` |
| Scripts and integrations call the API for years      | The NocoBase API Keys plugin (the `nocobase-app-plugin-api-keys` Skill), not Better Auth's `apiKey()` on its own: it adds scopes, service accounts, key management pages and the rule that no key manages keys   |
| Organizations, teams and invitations                 | `organization()` and its schema; decide first whether NocoBase's own authorization and team model already covers the need                                                                                        |
| A second factor or passwordless sign-in              | `twoFactor()`, `passkey()`, `magicLink()` or `emailOTP()`, each with its schema and its client plugin                                                                                                            |

### Device login for a CLI

RFC 8628 through `deviceAuthorization()`: the CLI posts its client id to `/api/auth/device/code`, shows the user code and opens `verification_uri_complete`; the person approves the code on the application's `/device` page while signed in; the CLI polls `/api/auth/device/token` (`authorization_pending`, `slow_down`, `access_denied`, `expired_token`) until it receives a session token, which it sends as `Authorization: Bearer` because `bearer()` turns that header into the session cookie. The CLI holds an ordinary session: Better Auth's sliding renewal (seven days, renewed daily while used) keeps it signed in, a disabled account loses it like a cookie, and `POST /api/auth/sign-out` with the token ends it.

- Set `validateClient` to accept only the client ids of the application's CLIs. `@nocobase/app-cli-client` sends `nocobase-cli` unless a branded CLI configures its own (`AppCliConfig.auth.clientId`).
- Give `verificationUri` as an app-local path such as `/device`: the authentication provider places it below the application's public base path, which Better Auth itself would drop.
- Install the `device-approval` block and render it from a `/device` page. The templates route it as `auth: 'optional'`, so it renders outside the shell like the sign-in pages, and the page sends a person who is not signed in to `/login?redirect=<the /device address with its code>`, from which the guest guard brings them back.
- Create the `deviceCode` model: `deviceCode` and `userCode` (strings, required, each unique), `userId` (string, optional), `expiresAt` (date, required), `status` (string, required), `lastPolledAt` (date, optional), `pollingInterval` (number, optional, milliseconds), `clientId` and `scope` (strings, optional), plus `id`. That is the shape in better-auth 1.7.5; check the installed version's `schema.mjs`.
- The plugin needs no join queries. With the API Keys plugin installed, no API key reaches the approval endpoints: approving issues a session, which takes a sign-in.
- Adding `bearer()` documents a `bearerAuth` security scheme beside `cookieAuth` in the API document.
