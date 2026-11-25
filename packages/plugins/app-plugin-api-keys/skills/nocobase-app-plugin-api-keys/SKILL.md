---
name: nocobase-app-plugin-api-keys
description: Register the API Keys plugin in a NocoBase App, let scripts and integrations call the App's API with an x-api-key header, or work out why a key is rejected.
metadata:
  short-description: Authenticate API requests with user-owned keys
---

# API Keys App Plugin

Use this Skill when an App needs non-interactive callers — a script, a cron job,
a third-party integration — to reach its API as a real user, or when a key the
App issued is being rejected. The default configuration resolves a key into its owner’s Session and carries that user’s roles. Applications needing scoped credentials must use a separate configuration with `enableSessionForAPIKeys: false` and enforce their business rules on the server.

This package is Better Auth's
[API Key plugin](https://www.better-auth.com/docs/plugins/api-key) plus the
`apikey` migration. `apiKey` is wrapped
only to supply four defaults, all overridable; its name, options and behaviour
are Better Auth's, and Better Auth's documentation applies unchanged.

## Public surfaces

Set `apiKeys.systemApiKeyRoutes: false` to omit the `/api/systemApiKeys` management endpoints. They are enabled by default. Personal key management, key rules, authentication of existing system keys and scheduled maintenance continue to work. To restore HTTP rotation or revocation for an existing system key, re-enable the routes.

Set `apiKeys.keyAdministrationRoutes: false` to omit the member key and rule administration endpoints under `/api/apiKeys/members` and `/api/apiKeys/rules`. They are enabled by default. Previously saved rules still apply and take precedence over application configuration.

- Server plugin: default export of `@nocobase/app-plugin-api-keys/server`.
  Contributes the `apikey` table migration and nothing else.
- `apiKey(options?)`, plus `API_KEY_TABLE_NAME`, `API_KEY_ERROR_CODES` and the
  option types, from the same entry. Use these rather than adding
  `@better-auth/api-key` to the App: the migration here matches the schema this
  version declares, and taking both from one package keeps them in step.
- Client registration factory: `@nocobase/app-plugin-api-keys/client`. It
  contributes no pages.
- `apiKeyClient`, re-exported from `@better-auth/api-key/client` by the same
  entry.
- `ApiKeySummary` and the expiry helpers, for the App's own key management
  page. Such a page reads `useAuthenticationClient().apiKey`, typed through the
  authentication plugin's `AuthClientPluginRegistry`, and is declared among the
  App's own routes.
- HTTP API: `POST /api/auth/api-key/create`, `GET /api/auth/api-key/list`,
  `GET /api/auth/api-key/get`, `POST /api/auth/api-key/update`, and
  `POST /api/auth/api-key/delete`. All five act only on the caller's own keys.

The plugin contributes no NocoBase route of its own. The endpoints above are
Better Auth's, mounted by Authentication's `/api/auth/*` handler. Its server registers the access check that lets a valid key read the App's API document, and, through the authentication plugin's `signInMethodsToken`, the API keys row on System settings › Sign-in and authentication: `On` while `apiKey()` is among `auth.plugins`, `Not configured` otherwise. Removing the plugin removes the row.

## Register it

Both halves are required, and each fails differently on its own.

1. Add the default export to the App's `server/plugins.ts` and
   `client/plugins.ts`.
2. Add `apiKey()` to `plugins` in `server/config/auth.ts`, and `apiKeyClient()`
   to `plugins` in `client/config/auth.ts`.
3. Run `pnpm nocobase db apply`.

Only step 1 leaves the `apikey` table created and no endpoints mounted. Only
step 2 mounts endpoints against a table that does not exist, and every call
fails at the database.

### The four defaults

`apiKey()` supplies `enableSessionForAPIKeys: true`, `rateLimit: { enabled:
false }`, `requireName: true` and `maximumNameLength: 100`, so an App normally passes nothing. The name limit matches scoped key creation and rotation; an application can override it.

`enableSessionForAPIKeys` is the one that has to be set. Better Auth defaults
it off, and with it off a key authenticates nothing: keys are still
issued, and every request carrying one answers 401. Nothing points at the
configuration, so do not override it without meaning to.

`rateLimit` is off because Better Auth's own default is 10 requests per key per
day, which is a quota for issuing keys rather than for using them. Pass
`{ enabled: true, maxRequests: 1000, timeWindow: 60_000 }` for a quota the App
actually wants.

All four are overridable, and passing all four back reproduces Better Auth's
own behaviour exactly.

## Call the API with a key

```bash
curl -H 'x-api-key: <key>' https://example.com/api/orders
```

An App route needs no change. `auth.required()` and `auth.optional()` resolve
the key into the owner's Session, and Authorization then evaluates that user's
roles. Read `context.get('auth')` exactly as for a cookie Session.

Pass `apiKeyHeaders: ['x-api-key', 'authorization-key']` to accept a different
header.

To find out what the App's API offers, read its OpenAPI document with the same key: `GET /api/swagger` returns the JSON document and `GET /api/swagger/docs` the Swagger UI page. A signed-in session or a valid key may read it; anything else gets `401` with `error.reason` `API_DOCS_UNAUTHENTICATED`. The API key endpoints are listed there under `/api/auth/api-key/...`, tagged `Authentication`.

## What a key can reach, and what it cannot

An unscoped key authenticates as its owner, but some Better Auth endpoints require a stored sign-in session. Verified with this plugin's default `apiKey()` configuration, `better-auth` and `@better-auth/api-key` 1.7.21, database-backed sessions, the `bearer()` plugin both application templates enable, and `x-api-key` as the only authentication header (no cookie or bearer token). The source regression suite is `packages/plugins/app-plugin-api-keys/tests/endpoint-reachability.test.ts`; run it again when upgrading Better Auth. These results include this plugin's guards, rather than describing the upstream API Key plugin alone.

| Endpoint                                                                                                        | Result                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api-key/create`, `GET /api-key/list`, `GET /api-key/get`, `POST /api-key/update`, `POST /api-key/delete` | 403 `API_KEY_SESSION_FORBIDDEN` — this plugin requires a sign-in to manage keys                                                              |
| `POST /update-user`                                                                                             | 200 — updates the owner's profile                                                                                                            |
| `GET /list-sessions`                                                                                            | 200 — returns session rows including the unsigned session `token`                                                                            |
| `POST /sign-out`                                                                                                | 200 — leaves the key and existing sign-in sessions valid                                                                                     |
| `POST /delete-user`, `POST /change-email`, `POST /revoke-sessions`                                              | 401 `UNAUTHORIZED`                                                                                                                           |
| `POST /change-password`                                                                                         | 401 `UNAUTHORIZED` with a valid body, even with the correct `currentPassword`; omitting `currentPassword` gives 400 `VALIDATION_ERROR` first |

**No key manages keys directly.** This plugin refuses every `/api-key/*` endpoint to a request authenticated by a key, scoped or not, with `API_KEY_SESSION_FORBIDDEN`. App-owned key-management routes apply `requireSignInSession()` after `auth.required()`.

**`/list-sessions` turns an unscoped key into a sign-in session.** It returns each session's `token`, the unsigned half of the `token.signature` session cookie. Replayed as a cookie the token alone does not authenticate, but both application templates enable Better Auth's `bearer()` plugin (for CLI device sign-in), and with its default `requireSignature: false` it signs a bearer token itself. `Authorization: Bearer <token>` is therefore the owner's full sign-in session, not a key session: the guards above do not apply to it, so it can create new keys, revoke sessions and reach every endpoint a sign-in reaches. The regression suite pins this. A leaked unscoped key must be treated as a leaked sign-in: revoke the key, revoke the owner's sessions, and review every key the owner holds.

In an App with the default templates' `bearer()`, close this path in one of two ways: give every key a scope (a scoped key cannot use account endpoints other than `/get-session`), or reject `/list-sessions` in the App's Better Auth `hooks.before` when an API key header is present. Check the configured key header names (`x-api-key` by default) rather than a resolved Session: the App's hook runs before plugin hooks resolve the key.

**Key permissions.** A key's permissions take the shape of a permission set's grants (`permissions` on `POST /api/apiKeys`, stored as format `2`) and are intersected with the holder's current permission on every request. A plugin marks an action no key may hold with `humanOnly: <reason>` where it registers the action; every key, with permissions or without, is then denied it (`KEY_HUMAN_ONLY`) while a signed-in person keeps it. A plugin offers key templates and the records a key may be limited to through `authz.credentials.templates.add` and `authz.credentials.objectSources.add`. Scope groups (`KeyScopeGroupDeclaration`, `apiKeyScopesToken`, `scope` on `POST /api/apiKeys`) are deprecated; see the plugin README's "Format 1, deprecated" for the migration.

## Other constraints

- **A rejected key is answered with Better Auth's own status, and its code as `error.reason`** (domain `authentication`) in the standard error body, so a guarded route tells the caller why: `401 KEY_EXPIRED`, `401 KEY_NOT_FOUND`, `429 USAGE_EXCEEDED`. `getSession()` throws Better Auth's `APIError` for a
  refused key, as Better Auth itself does; a caller that only asks who is
  signed in catches it.
- **Disabling a user disables that user's keys immediately**, because
  Authentication re-reads `user.disabledAt` on every request.
- **The key is shown once.** Only a hash is stored, alongside the first few
  characters used to identify it in a list. A lost key is replaced, not
  recovered.
- **A client may set only `name`, `expiresIn`, `prefix`, and `metadata`.**
  Better Auth refuses `remaining`, `permissions`, and the rate-limit fields on
  a request that carries headers, so an App that needs those sets them
  server-side.
- `expiresIn` is seconds, validated in whole days between 1 and 365.

## Ownership

The plugin owns the `apikey` table, the `@better-auth/api-key` version, and
the four defaults. The App owns its two `config/auth.ts` files, any
option it overrides there, and any page it builds for managing keys.

Never write the `apikey` table directly. Its `key` column holds a hash, and a
row inserted by hand authenticates nothing.

## Verification

1. Sign in and create a key with `authClient.apiKey.create()` (or the App's own
   page), and copy it.
2. `curl -H 'x-api-key: <key>' <app>/api/<a route behind auth.required()>` —
   expect the same response the signed-in user gets.
3. Revoke the key, repeat step 2 — expect 401, not 500.
4. Disable the owning user, repeat step 2 with a second key — expect 401.

## Trusted server extensions

`apiKey()` also accepts a configuration array, each with a unique `configId`. The four NocoBase defaults apply to each entry and remain overridable. A non-Session configuration must never share the default Session configuration’s identity. Verification checks the actual stored configuration, so presenting such a key in `x-api-key` does not grant its owner’s Session.

`new ApiKeyService(authentication, configId)` provides trusted database-backed `create({ userId, name, expiresIn? })`, `get(id)`, `verify(secret)`, `disable(id)` and `remove(id)` operations. Create returns `{ key, secret }` once; summaries never include the stored hash. Get, disable and remove are configuration-bound; disable and remove are repeatable. Missing configurations fail closed. The service uses the registered Better Auth configuration, endpoints and formal Authentication plugin API. Secondary storage is not supported by this service.

These methods are server-only capabilities, not authorization checks. Callers must authorize the actor, bind their own resources, and enforce scopes before allowing the operation. Keep application-specific rules outside this plugin. Applications that reserve a configuration for their own management API must also reject public Better Auth management requests for that configuration; otherwise its owner can update its enabled state or expiration through the self-service endpoints. Better Auth may prune expired rows during normal API Key operations.

Server calls run through `Auth.pluginApi()` and the normal Better Auth hooks; `withConnection(connection)` binds all credential writes to a caller-owned transaction. The added get/delete operations are declared with `createAuthEndpoint.serverOnly` and cannot be reached over HTTP.
