---
name: nocobase-app-plugin-api-keys
description: Register the API Keys plugin in a NocoBase App, let scripts and integrations call the App's API with an x-api-key header, place or restrict the key management page, or work out why a key is rejected.
metadata:
  short-description: Authenticate API requests with user-owned keys
---

# API Keys App Plugin

Use this Skill when an App needs non-interactive callers — a script, a cron job,
a third-party integration — to reach its API as a real user, or when a key the
App issued is being rejected. The default configuration resolves a key into its owner’s Session and carries that user’s roles. Applications needing scoped credentials must use a separate configuration with `enableSessionForAPIKeys: false` and enforce their business rules on the server.

This package is Better Auth's
[API Key plugin](https://www.better-auth.com/docs/plugins/api-key) plus the
`apikey` migration, the Settings page, and the locales. `apiKey` is wrapped
only to supply three defaults, all overridable; its name, options and behaviour
are Better Auth's, and Better Auth's documentation applies unchanged.

## Public surfaces

- Server plugin: default export of `@nocobase/app-plugin-api-keys/server`.
  Contributes the `apikey` table migration and nothing else.
- `apiKey(options?)`, plus `API_KEY_TABLE_NAME`, `API_KEY_ERROR_CODES` and the
  option types, from the same entry. Use these rather than adding
  `@better-auth/api-key` to the App: the migration here matches the schema this
  version declares, and taking both from one package keeps them in step.
- Client registration factory and `ApiKeysClientOptions`:
  `@nocobase/app-plugin-api-keys/client`.
- `apiKeyClient`, re-exported from `@better-auth/api-key/client` by the same
  entry.
- `ApiKeySummary`, `API_KEYS_PAGE_ACCESS`, `API_KEYS_ROUTE_ID`, and the expiry
  helpers, for an App that builds its own page instead of using the one here.
  The page itself reads `useAuthenticationClient().apiKey`, typed through the
  authentication plugin's `AuthClientPluginRegistry`.
- HTTP API: `POST /api/auth/api-key/create`, `GET /api/auth/api-key/list`,
  `GET /api/auth/api-key/get`, `POST /api/auth/api-key/update`, and
  `POST /api/auth/api-key/delete`. All five act only on the caller's own keys.

The plugin contributes no NocoBase route of its own. The endpoints above are
Better Auth's, mounted by Authentication's `/api/auth/*` handler. Its server registers one thing: the access check that lets a valid key read the App's API document.

## Register it

Both halves are required, and each fails differently on its own.

1. Add the default export to the App's `server/plugins.ts` and
   `client/plugins.ts`. Configure the page with
   `apiKeys({ path: '/api-keys' })`; it mounts under `/settings`.
2. Add `apiKey()` to `plugins` in `server/config/auth.ts`, and `apiKeyClient()`
   to `plugins` in `client/config/auth.ts`.
3. Grant `page:api-keys/access` to the roles that may manage keys. Keys are
   self-service and every endpoint acts only on the caller's own, so this is
   normally granted to all authenticated users.
4. Run `pnpm nocobase db apply`.

Only step 1 leaves the `apikey` table created and no endpoints mounted. Only
step 2 mounts endpoints against a table that does not exist, and every call
fails at the database.

### The three defaults

`apiKey()` supplies `enableSessionForAPIKeys: true`, `rateLimit: { enabled:
false }` and `requireName: true`, so an App normally passes nothing.

`enableSessionForAPIKeys` is the one that has to be set. Better Auth defaults
it off, and with it off a key authenticates nothing: the Settings page still
issues keys, and every request carrying one answers 401. Nothing points at the
configuration, so do not override it without meaning to.

`rateLimit` is off because Better Auth's own default is 10 requests per key per
day, which is a quota for issuing keys rather than for using them. Pass
`{ enabled: true, maxRequests: 1000, timeWindow: 60_000 }` for a quota the App
actually wants.

All three are overridable, and passing all three back reproduces Better Auth's
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

A key is its owner, so it reaches the Better Auth endpoints a Session reaches.
Verified against `@better-auth/api-key` 1.7.1 with only an `x-api-key` header:

| Endpoint                                                 | Result                     |
| -------------------------------------------------------- | -------------------------- |
| `POST /api-key/create`, `GET /api-key/list`              | reachable                  |
| `POST /update-user`                                      | reachable                  |
| `GET /list-sessions`                                     | reachable                  |
| `POST /sign-out`                                         | reachable                  |
| `POST /delete-user`, `/change-email`, `/revoke-sessions` | 401                        |
| `POST /change-password`                                  | requires `currentPassword` |

Two consequences to plan for:

- **A key mints keys.** The successor holds its own expiry and revocation, and
  nothing links it to the key that made it. Revoking a leaked key means
  reviewing the owner's whole list, not deleting the one key you know about.
- **`/list-sessions` returns the unsigned session token.** The cookie is
  `token.signature`, so replaying the token alone does not authenticate; it
  becomes a takeover only if the auth secret leaks too or cookie signing is
  off.

An App that wants either closed adds its own Better Auth `before` hook
rejecting those paths when the API key header is present. Match on the header
rather than on the resolved Session, and place the hook before the plugin's
own, or the Session is minted and returned first.

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

The plugin owns the `apikey` table, the `@better-auth/api-key` version, the
three defaults, and the Settings page. The App owns its two `config/auth.ts`
files, any option it overrides there, where the page is mounted, and which
roles may reach it.

Never write the `apikey` table directly. Its `key` column holds a hash, and a
row inserted by hand authenticates nothing.

## Verification

1. Grant `page:api-keys/access`, sign in, open the Settings page, create a key,
   and copy it.
2. `curl -H 'x-api-key: <key>' <app>/api/<a route behind auth.required()>` —
   expect the same response the signed-in user gets.
3. Revoke the key in the page, repeat step 2 — expect 401, not 500.
4. Disable the owning user, repeat step 2 with a second key — expect 401.

## Trusted server extensions

`apiKey()` also accepts a configuration array, each with a unique `configId`. The three NocoBase defaults apply to each entry and remain overridable. A non-Session configuration must never share the default Session configuration’s identity. Verification checks the actual stored configuration, so presenting such a key in `x-api-key` does not grant its owner’s Session.

`new ApiKeyService(authentication, configId)` provides trusted database-backed `create({ userId, name, expiresIn? })`, `get(id)`, `verify(secret)`, `disable(id)` and `remove(id)` operations. Create returns `{ key, secret }` once; summaries never include the stored hash. Get, disable and remove are configuration-bound; disable and remove are repeatable. Missing configurations fail closed. The service uses the registered Better Auth configuration, endpoints and formal Authentication plugin API. Secondary storage is not supported by this service.

These methods are server-only capabilities, not authorization checks. Callers must authorize the actor, bind their own resources, and enforce scopes before allowing the operation. Keep application-specific rules outside this plugin. Applications that reserve a configuration for their own management API must also reject public Better Auth management requests for that configuration; otherwise its owner can update its enabled state or expiration through the self-service endpoints. Better Auth may prune expired rows during normal API Key operations.

Server calls run through `Auth.pluginApi()` and the normal Better Auth hooks; `withConnection(connection)` binds all credential writes to a caller-owned transaction. The added get/delete operations are declared with `createAuthEndpoint.serverOnly` and cannot be reached over HTTP.
