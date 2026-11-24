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
2. Write one application migration in `database/main/migrations/` that creates those models and alters those collections, spelling out every field, type, length, nullability, unique constraint and index exactly as the schema declares them, with a `down` that reverses it. Follow the application Skill's migrations reference for the DSL. Keep Better Auth's model and field names (`deviceCode`, `userCode`); the adapter maps them to the naming strategy. A field name ending in capitals, such as passkey's `credentialID`, does not survive snake_case column names (`credential_id` reads back as `credentialId`): map it with the plugin's `schema` option (`schema: { passkey: { fields: { credentialID: 'credentialId' } } }`) and use the mapped name in the migration. Say in the migration which Better Auth version the shape comes from, and add a new migration when a later version adds a field.
3. Put a unique constraint on every external-account key, normally `issuer + subject` or the plugin's own identifier column. It prevents double binding and settles concurrent first sign-ins.
4. Test the migration with `describeMigration()` from `@nocobase/app-testing/server`, and exercise the plugin's endpoints in a test against the migrated database, so a field the documentation omitted is found there and not in production.

Never copy or edit the authentication plugin's migrations, never run Better Auth's schema generation or `migrate` against the application database, and do not add physical foreign keys to the authentication tables. The adapter does not support Better Auth join queries; read the plugin's source for `join` before adopting it, and say so if it uses one.

## Using the current authentication transaction

Import `authTransactionConnection()` from `@nocobase/app-plugin-authentication/server` in trusted server-side extensions. It returns `Promise<DatabaseConnection | undefined>`. Call it inside an authentication callback such as a transactional OIDC resolver or a `databaseHooks.session.create.before` hook. When Better Auth runs that callback in a NocoBase adapter transaction, use the returned connection for application queries that must see uncommitted authentication changes or roll back with them. Using the application’s main connection from inside the transaction can wait on the transaction itself on SQLite.

The result is `undefined` outside an active authentication transaction, including after-commit hooks. Decide how to handle that case according to the extension’s needs. If atomicity is required, abort when the connection is unavailable. Await all work that uses the borrowed connection before returning from the callback. To roll back the transaction on rejection, propagate the failure through the transaction callback, for example by throwing an `APIError` from a session hook.

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

### Two-factor authentication and passkeys

The Sign-in and authentication page's guides hand a development agent a prompt that points here. Two-factor authentication is `twoFactor()` from `better-auth/plugins` with `twoFactorClient()` from `better-auth/client/plugins`. Passkeys are not in `better-auth` itself: install `@better-auth/passkey` at the same version as `better-auth` and use `passkey()` from `@better-auth/passkey` with `passkeyClient()` from `@better-auth/passkey/client`. Read `rpID` (the host name) and `origin` from `app.publicOrigin` rather than hard-coding them; passkeys need HTTPS (localhost excepted), and changing the domain invalidates every passkey already registered. Neither plugin comes with pages: the application adds the Account and security sections (setting up and removing an authenticator with its backup codes; adding, renaming and deleting passkeys) and the sign-in steps (the code after `twoFactorRedirect`, through `twoFactor.verifyTotp` or `twoFactor.verifyBackupCode`; a "Sign in with a passkey" button through `signIn.passkey`).

These migrations match better-auth and `@better-auth/passkey` 1.7.21; the authentication plugin's tests run both and use them through Better Auth. Give them the application's own timestamp.

```ts
// The twoFactor() schema in better-auth 1.7.21.
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202612010001_create_two_factor',

  async up({ builder }) {
    await builder.alterCollection('user', (collection) => {
      collection.boolean('twoFactorEnabled').nullable().defaultTo(false);
    });
    await builder.createCollection('twoFactor', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('secret', { length: 255 }).notNull();
      collection.text('backupCodes').notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.boolean('verified').nullable().defaultTo(true);
      collection.integer('failedVerificationCount').nullable().defaultTo(0);
      collection.datetime('lockedUntil').nullable();

      collection.primary('id', { name: 'pk_two_factor' });
      collection.index('secret', { name: 'idx_two_factor_secret' });
      collection.index('userId', { name: 'idx_two_factor_user' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('twoFactor');
    await builder.alterCollection('user', (collection) => {
      collection.dropField('twoFactorEnabled');
    });
  },
});

export default migration;
```

```ts
// The passkey() schema in @better-auth/passkey 1.7.21, with credentialID stored as
// credentialId: an all-caps suffix does not survive the snake_case column names.
// A WebAuthn credential ID is up to 1023 bytes, 1364 characters of base64url, so it is a
// text column. No portable index holds a key that long (MySQL with utf8mb4 stops at 3072
// bytes, SQL Server at 1700), so it has none: a passkey sign-in reads the table by it,
// and people's passkeys are listed through the userId index.
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202612010002_create_passkey',

  async up({ builder }) {
    await builder.createCollection('passkey', (collection) => {
      collection.string('id', { length: 64 }).notNull();
      collection.string('name', { length: 255 }).nullable();
      collection.text('publicKey').notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.text('credentialId').notNull();
      collection.integer('counter').notNull();
      collection.string('deviceType', { length: 32 }).notNull();
      collection.boolean('backedUp').notNull();
      collection.string('transports', { length: 255 }).nullable();
      collection.datetime('createdAt').nullable();
      collection.string('aaguid', { length: 64 }).nullable();

      collection.primary('id', { name: 'pk_passkey' });
      collection.index('userId', { name: 'idx_passkey_user' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('passkey');
  },
});

export default migration;
```
