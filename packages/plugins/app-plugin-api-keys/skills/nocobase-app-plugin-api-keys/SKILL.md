---
name: nocobase-app-plugin-api-keys
description: Register the API Keys plugin in a NocoBase App, let scripts and integrations call the App's API with an x-api-key header, or work out why a key is rejected.
metadata:
  short-description: Authenticate API requests with user-owned keys
---

# API Keys App Plugin

Use this Skill when an App needs non-interactive callers — a script, a cron job, a third-party integration — to reach its API, or when a key the App issued is rejected. With the default Session-enabled configuration, a key resolves to its owner, but its access also depends on its scope and whether the owner is a person or a service account. Do not treat an API-key Session as a signed-in Session for account or key management.

This package wraps Better Auth's [API Key plugin](https://www.better-auth.com/docs/plugins/api-key), supplies defaults and migrations, and adds NocoBase's key-management and scoped-credential restrictions. Better Auth's option documentation applies subject to these restrictions.

## Public surfaces

- Server plugin: default export of `@nocobase/app-plugin-api-keys/server`. Contributes the `apikey` migration, key-management services and routes, scope enforcement, and API-document access.
- `apiKey(options?)`, plus `API_KEY_TABLE_NAME`, `API_KEY_ERROR_CODES` and the option types, from the same entry. Use these rather than adding `@better-auth/api-key` to the App: the migration here matches the schema this version declares, and taking both from one package keeps them in step.
- Client registration factory: `@nocobase/app-plugin-api-keys/client`. It contributes no pages.
- `apiKeyClient`, re-exported from `@better-auth/api-key/client` by the same entry.
- `ApiKeySummary` and the expiry helpers, for the App's own key management page. Such a page reads `useAuthenticationClient().apiKey`, typed through the authentication plugin's `AuthClientPluginRegistry`, and is declared among the App's own routes.
- HTTP API: `POST /api/auth/api-key/create`, `GET /api/auth/api-key/list`, `GET /api/auth/api-key/get`, `POST /api/auth/api-key/update`, and `POST /api/auth/api-key/delete`. All five act only on the caller's own keys.

The `/api/auth/api-key/*` endpoints are Better Auth's, mounted by Authentication's `/api/auth/*` handler. The plugin also contributes NocoBase key-management routes under `/api/apiKeys`. These routes require a signed-in Session and apply their own authorization checks.

## Register it

Both halves are required, and each fails differently on its own.

1. Add the default export to the App's `server/plugins.ts` and `client/plugins.ts`.
2. Add `apiKey()` to `plugins` in `server/config/auth.ts`, and `apiKeyClient()` to `plugins` in `client/config/auth.ts`.
3. Run `pnpm nocobase db apply`.

Only step 1 does not mount Better Auth's `/api/auth/api-key/*` endpoints. Only step 2 leaves those endpoints without this plugin's migration; apply the migration before issuing or using keys.

### The three defaults

`apiKey()` supplies `enableSessionForAPIKeys: true`, `rateLimit: { enabled: false }` and `requireName: true`, so an App normally passes nothing.

`enableSessionForAPIKeys` is the one that has to be set. Better Auth defaults it off, and with it off a key authenticates nothing: keys are still issued, and every request carrying one answers 401. Nothing points at the configuration, so do not override it without meaning to.

`rateLimit` is off because Better Auth's own default is 10 requests per key per day, which is a quota for issuing keys rather than for using them. Pass `{ enabled: true, maxRequests: 1000, timeWindow: 60_000 }` for a quota the App actually wants.

All three defaults are overridable. Overriding them does not remove the NocoBase security checks described below.

## Call the API with a key

```bash
curl -H 'x-api-key: <key>' https://example.com/api/orders
```

For an ordinary user's unscoped key, `auth.required()` and `auth.optional()` resolve the owner and Authorization evaluates that user's roles. Scoped keys and service-account keys need routes that explicitly opt in with `auth.required({ scopedKeys: true })` and enforce the registered scopes through Authorization. Authentication alone is not a scope check.

Pass `apiKeyHeaders: ['x-api-key', 'authorization-key']` to accept a different header.

To find out what the App's API offers, read its OpenAPI document with the same key: `GET /api/swagger` returns the JSON document and `GET /api/swagger/docs` the Swagger UI page. A signed-in session or a valid key may read it; anything else gets `401` with `error.reason` `API_DOCS_UNAUTHENTICATED`. The API key endpoints are listed there under `/api/auth/api-key/...`, tagged `Authentication`.

## What a key can reach, and what it cannot

The following results are verified with `@better-auth/api-key` 1.7.21 and the NocoBase `apiKey()` wrapper, using its default Session-enabled configuration, a valid `x-api-key` header, no session cookie, and valid request parameters. Paths are relative to `/api/auth`; a service-account key is restricted whether or not it has an explicit scope.

| Endpoint                                                                                                        | Ordinary user's unscoped key    | Scoped user key                 | Service-account key             |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- |
| `GET /get-session`                                                                                              | 200, owner's Session            | 200, owner's Session            | 200, owner's Session            |
| `POST /api-key/create`, `GET /api-key/list`, `GET /api-key/get`, `POST /api-key/update`, `POST /api-key/delete` | 403 `API_KEY_SESSION_FORBIDDEN` | 403 `API_KEY_SESSION_FORBIDDEN` | 403 `API_KEY_SESSION_FORBIDDEN` |
| `POST /update-user`, `GET /list-sessions`, `POST /sign-out`                                                     | 200                             | 403 `SCOPED_KEY_FORBIDDEN`      | 403 `SCOPED_KEY_FORBIDDEN`      |

**No API key manages keys.** The plugin already blocks every `/api-key/*` endpoint for an API-key Session. Sign in to create, read, list, update or delete keys; the caller must also satisfy ownership and any configured key-creation policy. Applications do not need to add a hook to enforce this existing restriction. An application's own key-management route should use the exported `requireSignInSession()` after `auth.required()` and authorize the operation.

Other account endpoints are not interchangeable with business APIs. A scoped user key or a service-account key is rejected with `SCOPED_KEY_FORBIDDEN` once its key Session reaches the account hook; `/get-session` is the identity lookup exception. The plugin also requires a signed-in Session for device authorization review, approval and denial (`/device`, `/device/approve`, `/device/deny`) when that feature is installed. For an ordinary user's unscoped key, Better Auth's endpoint-specific settings and requirements still apply, including to deleting a user, changing an email or password, and revoking sessions; the table does not grant access to those operations.

An ordinary user's unscoped key can read `/list-sessions`, including unsigned session tokens. Treat it as a powerful credential. Use scoped keys for integrations that should not reach account endpoints, and enforce scopes on the business routes they call. An application may add further restrictions for unscoped keys, but must not relax the built-in sign-in requirement for key management.

## Other constraints

- **A rejected key is answered with Better Auth's own status, and its code as `error.reason`** (domain `authentication`) in the standard error body, so a guarded route tells the caller why: `401 KEY_EXPIRED`, `401 KEY_NOT_FOUND`, `429 USAGE_EXCEEDED`. `getSession()` throws Better Auth's `APIError` for a refused key, as Better Auth itself does; a caller that only asks who is signed in catches it.
- **Disabling a user disables that user's keys immediately**, because Authentication re-reads `user.disabledAt` on every request.
- **The key is shown once.** Only a hash is stored, alongside the first few characters used to identify it in a list. A lost key is replaced, not recovered.
- **A client may set only `name`, `expiresIn`, `prefix`, and `metadata`.** Better Auth refuses `remaining`, `permissions`, and the rate-limit fields on a request that carries headers, so an App that needs those sets them server-side.
- `expiresIn` is seconds, validated in whole days between 1 and 365.

## Ownership

The plugin owns the `apikey` table, the `@better-auth/api-key` version, and the three defaults. The App owns its two `config/auth.ts` files, any option it overrides there, and any page it builds for managing keys.

Never write the `apikey` table directly. Its `key` column holds a hash, and a row inserted by hand authenticates nothing.

## Verification

1. Sign in and create a key with `authClient.apiKey.create()` (or the App's own page), and copy it.
2. With an ordinary user's unscoped key, `curl -H 'x-api-key: <key>' <app>/api/<a route behind auth.required()>` — expect the same response the signed-in user gets.
3. Revoke the key, repeat step 2 — expect 401, not 500.
4. Disable the owning user, repeat step 2 with a second key — expect 401.
5. With a valid key and no cookie, call `/api/auth/api-key/list` and `/api/auth/api-key/create` with a valid name — expect 403 `API_KEY_SESSION_FORBIDDEN`. Sign in and repeat using only the session cookie to confirm authorized key management still works.
6. For scoped user keys and service-account keys, verify that `/api/auth/get-session` identifies the owner while `/api/auth/update-user` is rejected with `SCOPED_KEY_FORBIDDEN`. Also verify the intended business route with its scope enforcement enabled.

When upgrading Better Auth, rerun the endpoint checks with the App's installed versions and configuration before updating this table. In the source repository, `packages/plugins/app-plugin-api-keys/tests/integration.test.ts` covers sign-in versus key management and `tests/scoped-keys.test.ts` in the same package covers the credential types above.

## Trusted server extensions

`apiKey()` also accepts a configuration array, each with a unique `configId`. The three NocoBase defaults apply to each entry and remain overridable. A non-Session configuration must never share the default Session configuration’s identity. Verification checks the actual stored configuration, so presenting such a key in `x-api-key` does not grant its owner’s Session.

`new ApiKeyService(authentication, configId)` provides trusted database-backed `create({ userId, name, expiresIn? })`, `get(id)`, `verify(secret)`, `disable(id)` and `remove(id)` operations. Create returns `{ key, secret }` once; summaries never include the stored hash. Get, disable and remove are configuration-bound; disable and remove are repeatable. Missing configurations fail closed. The service uses the registered Better Auth configuration, endpoints and formal Authentication plugin API. Secondary storage is not supported by this service.

These methods are trusted server-only capabilities, not permissions granted to a caller presenting an API key, and not authorization checks. Callers must authorize the actor, bind their own resources, and enforce scopes before allowing the operation. Keep application-specific rules outside this plugin. Applications that reserve a configuration for their own management API must also reject public Better Auth management requests for that configuration; otherwise its owner can update its enabled state or expiration through the self-service endpoints. Better Auth may prune expired rows during normal API Key operations.

Server calls run through `Auth.pluginApi()` and the normal Better Auth hooks; `withConnection(connection)` binds all credential writes to a caller-owned transaction. The added get/delete operations are declared with `createAuthEndpoint.serverOnly` and cannot be reached over HTTP.
