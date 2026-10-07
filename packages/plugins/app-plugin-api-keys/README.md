# @nocobase/app-plugin-api-keys

API key authentication for NocoBase applications, built on Better Auth.

A key authenticates as the user who created it. `Auth.getSession()` resolves the `x-api-key` header the same way it resolves a session cookie, so `auth.required()`, the route guards, and `@nocobase/app-plugin-authorization` all see the owning user and exactly the roles that user holds. Nothing in an application has to know a request arrived by key rather than by cookie.

Keys are self-service: each signed-in user creates and revokes their own under `/settings/api-keys`.

## What this package is

Better Auth's [API Key plugin](https://www.better-auth.com/docs/plugins/api-key), plus the parts an application needs around it:

- the `apikey` table migration;
- the Settings page and its locales;
- `apiKey` and `apiKeyClient`, carrying Better Auth's own names and options.

`apiKey` is wrapped only to supply three defaults, all of them overridable; everything else is Better Auth's behavior and its documentation applies unchanged. They come from this package rather than from a dependency each application installs because the migration here has to match the schema that version of `@better-auth/api-key` declares; a test asserts the table carries a column for every field the plugin declares.

## Installing it

```ts
// server/plugins.ts — migrations for the apikey table
import apiKeys from '@nocobase/app-plugin-api-keys/server';

// server/config/auth.ts — the Better Auth plugin itself
import { apiKey } from '@nocobase/app-plugin-api-keys/server';

export default defineAppConfig((_runtime) => ({
  plugins: [username({ displayUsername: false }), apiKey()],
}));
```

```ts
// client/plugins.ts — the management page
import apiKeys from '@nocobase/app-plugin-api-keys/client';
apiKeys({ path: '/api-keys' });

// client/config/auth.ts — so authClient.apiKey.* reaches the endpoints
import { apiKeyClient } from '@nocobase/app-plugin-api-keys/client';

export default defineAppConfig((_runtime) => ({
  plugins: [usernameClient({ displayUsername: false }), apiKeyClient()],
}));
```

Then grant `page:api-keys/access` to the roles that may manage keys — normally all authenticated users, since every endpoint acts only on the caller's own keys — and run `pnpm nocobase db apply`.

Registering the server plugin without `apiKey()` creates the table and mounts no endpoints; registering `apiKey()` without the server plugin mounts endpoints against a table that does not exist.

## The three defaults

| Option                    | Better Auth                         | Here    | Why                                                                                                                     |
| ------------------------- | ----------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `enableSessionForAPIKeys` | `false`                             | `true`  | Without it a key authenticates nothing: the page still issues keys, and every request carrying one answers 401          |
| `rateLimit.enabled`       | `true`, 10 requests per key per day | `false` | That is a quota for issuing keys rather than for using them, and it silently breaks the first integration anyone writes |
| `requireName`             | `false`                             | `true`  | The management page identifies a key by its name, and a key listed as "unnamed" cannot be revoked with any confidence   |

All three are overridable. `apiKey({ rateLimit: { enabled: true, maxRequests: 1000, timeWindow: 60_000 } })` sets a quota, and passing all three back reproduces Better Auth's own behaviour exactly.

## Using a key

```bash
curl -H 'x-api-key: <key>' https://example.com/api/orders
```

## Reading the API document with a key

A valid key may read the application's OpenAPI document and its Swagger UI, exactly as a signed-in session may: `curl -H 'x-api-key: <key>' https://example.com/api/swagger` returns the JSON document, and `/api/swagger/docs` the page. The key is checked the way every other request checks it, so an unknown, expired or disabled key, or one whose owner is disabled, gets `401` with `error.reason` `API_DOCS_UNAUTHENTICATED`, and reading the document extends no session. The document lists this plugin's endpoints under `/api/auth/api-key/...` with the rest of Better Auth's, tagged `Authentication`. A configuration with a `customAPIKeyGetter` is not consulted by this check, because the getter needs a Better Auth endpoint context.

## What a key can do

A key is its owner. Beyond the application's own routes, it reaches the Better Auth endpoints Better Auth lets a session reach — verified against `@better-auth/api-key` 1.7.1 with only an `x-api-key` header:

| Endpoint                                                           |                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `/api-key/*` (create, list, update, delete)                        | 403 `API_KEY_SESSION_FORBIDDEN` — managing keys takes a sign-in         |
| `POST /update-user`                                                | reachable — profile fields                                              |
| `GET /list-sessions`                                               | reachable — returns session rows including the unsigned session `token` |
| `POST /sign-out`                                                   | reachable                                                               |
| `POST /delete-user`, `POST /change-email`, `POST /revoke-sessions` | 401                                                                     |
| `POST /change-password`                                            | requires `currentPassword`                                              |

**No key manages keys.** Every `/api-key/*` endpoint refuses a request made with a key, scoped or not, so a leaked key cannot mint its own successors or revoke the evidence; only a signed-in session creates, updates or deletes keys. Routes of the application that manage keys apply the same rule with `requireSignInSession()` after `auth.required()`.

One consequence of an unscoped key reaching the rest is worth planning for. **`/list-sessions` discloses the session token.** It is the unsigned half of the session cookie, which is `token.signature`; replaying it alone does not authenticate, because the HMAC is computed with the auth secret. It becomes a working session takeover only if that secret also leaks or a deployment turns cookie signing off.

An application that wants it closed gives the key a scope, or adds a Better Auth `before` hook of its own.

A rejected key — expired, revoked, or wrong — is answered by a guarded `/api` route with Better Auth's own status in the standard error body, its code as `error.reason` and `authentication` as `error.domain`, so the caller can tell why: `401 KEY_EXPIRED`, `401 KEY_NOT_FOUND`, `429 USAGE_EXCEEDED`. Branch on `error.reason`, never on `message`. `Auth.getSession()` throws Better Auth's `APIError` for a refused key, exactly as Better Auth itself does, and a caller that only asks who is signed in catches it. A disabled user's keys stop working immediately, because `Auth.getSession()` re-reads `user.disabledAt` on every request.

## Scoped keys

A key may carry a scope, as a GitHub fine-grained token does. Its effective permission is its owner's current permission intersected with the scope: the scope never grants anything, and an owner who loses a permission takes it from every key at once. A key without a scope behaves exactly as described above.

The scope is a set of permission groups, each at a level — read, write, or admin, each including the ones before it — and, where a group offers it, limited to some records of a business ("only selected Apps"). Plugins declare their groups as plain data (`KeyScopeGroupDeclaration`, `KeyScopePresetDeclaration` from `@nocobase/app-plugin-api-keys/shared/scopes`, written as literals so the plugin does not depend on this package); the application assembles them, because only it knows every plugin:

```ts
const scopes = container.resolve(apiKeyScopesToken);
scopes.mapAccess((ref) => /* page, settings or business access → { resource, action } */);
scopes.groups.add(RELEASES_KEY_SCOPE_GROUPS[0], releasesKeyScopeObjects(services));
scopes.presets.add(CI_DEPLOY_PRESET);
```

A scope is stored in Better Auth's `permissions` column, which Better Auth refuses to take from a client on create or update (`SERVER_ONLY_PROPERTY`), so a key's holder cannot widen it: `{ "$v": ["1"], "releases.apps": ["read", "write"], "releases.apps@": ["app-1"] }`. `/api/apiKeys` offers no way to change a person's key's scope; create another. An application that manages keys of its own (an organization's keys, say) may change one with `ScopedApiKeys.setScope`, deciding itself who may and what they may give. A group the application no longer registers grants nothing, so removing one only narrows the keys that named it.

What enforces a scope on each request:

- Better Auth turns the key into its owner's session, as for any key. This plugin's provider then recognizes the key behind the session (its id and token), reads its scope once per request, and adds it to the authorization identity as `keyScope` (`authz.use`). `authz.can`, `require`, `authorize` and the permissions snapshot deny anything outside it with `KEY_SCOPE`.
- `auth.required()` refuses a scoped key with 403 `SCOPED_KEY_FORBIDDEN` unless the route opts in with `auth.required({ scopedKeys: true })`. Opt in only where every operation is authorized through `authz`, or where the code narrows by `identity.keyScope` itself; anything that derives permissions on its own (from `permissionSets.getEffective`, say) must intersect with `keyScope` or it widens the key back to its owner.
- A scoped key reaches no Better Auth account endpoint but `/get-session`: it cannot mint or list keys, change the profile, list sessions or sign out.
- Record selections are enforced only by the plugin that owns the records, through `keyScope.objects(business)`. An empty selection reaches none of them: the key holds the group's actions, so the commands and routes that need them are offered, while every record the plugin checks is refused.

A service account's key is treated as scoped even without a scope: `required()` refuses it unless the route opts in, it reaches no account endpoint, and its identity carries a `keyScope` that narrows nothing (`permissions: null`), so plugins can tell a key from a person. Disabling the account stops all its keys immediately.

`apiKeys.maxScopedKeyDays` in the application's configuration caps how long a scoped key lives; unset, "never expires" stays available. The editor proposes 90 days.

### Server API

| Export                             | What it is                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiKeyScopesToken`                | The registry: `groups.add`, `presets.add`, `mapAccess`, `validate`, `compile`                                                                                                          |
| `scopedApiKeysToken`               | `ScopedApiKeys`: `scopeOptions`, `scopeObjects`, `list`, `get`, `check`, `create`, `issueChecked`, `setScope`, `update`, `rotate`, `revoke`, `revokeAll`, `resolve`, `setOwnKeyPolicy` |
| `ApiKeyScopeError`                 | A refused scope, 400 with a stable code                                                                                                                                                |
| `encodeKeyScope`, `decodeKeyScope` | The storage format                                                                                                                                                                     |

`ScopedApiKeys` acts on whichever user it is told; the caller decides who may manage whose keys. An application builds its own key pages and a service account's keys on it.

- `check(input, identity)` validates what `create` would issue — name, description, scope, the records it picks (each must be one `identity` may see) and expiry — without issuing anything, so a caller can refuse before it creates whatever the key belongs to; `issueChecked(userId, checked)` then issues it.
- `rotate(userId, keyId)` gives a key a new secret in place: the same id, name, description, scope and owner, with the expiry renewed for the lifetime the key had. The old secret stops at once. Better Auth generates and hashes the new value, so its key options apply.
- `setScope(userId, keyId, scope, identity)` replaces a scoped key's scope; `update(userId, keyId, { name?, description? })` renames it.
- `setOwnKeyPolicy(policy)` says who may create (and rotate) keys of their own: `(userId) => Promise<boolean>`. Without one everyone may. With one, `POST /api/apiKeys`, its rotation and Better Auth's own `/api-key/create` from a sign-in answer 403 `API_KEY_CREATION_FORBIDDEN` to anyone the policy refuses, while listing and revoking stay open. The plugin's provider connects the Better Auth hook at boot (`connectOwnKeyPolicy`).

### HTTP API

`/api/apiKeys`, for the signed-in person's own keys (a scoped key or a service account is refused with 403 `SCOPED_KEY_FORBIDDEN`, any other key with 403 `API_KEY_SESSION_FORBIDDEN`). Failures answer in the standard error body with domain `apiKeys` and the codes above as `reason`; an invalid body is 400 `INVALID_INPUT` naming the field, and an unknown field is rejected.

| Request                                                 | Answer                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET /scopeOptions`                                     | `{ data }`, `KeyScopeOptions`: the groups with what the caller holds today, presets, expiry, `mayCreate` |
| `GET /scopeObjects/:group?q=&id=`                       | `{ data, meta: { total } }`: the records the caller may choose for a group; `id` may repeat              |
| `GET /`                                                 | `{ data, meta: { total } }`: the caller's keys, with scope and last use, never a secret                  |
| `POST /` `{ name, description?, expiresInDays, scope }` | 201 `{ data: { key, secret } }`, the secret shown once                                                   |
| `POST /:keyId/rotate`                                   | `{ data: { key, secret } }`: same id, name, scope and lifetime; the old secret stops at once             |
| `DELETE /:keyId`                                        | 204                                                                                                      |

`toApiKeysApiError(error)` turns `ApiKeyScopeError` and `ApiKeyRequestError` into that body's `ApiError`, for an application's own key routes: `router.onError((error, context) => apiErrorHandler(toApiKeysApiError(error), context))`.

The Settings page under `/settings/api-keys` predates scopes and does not offer them; an application that offers scoped keys builds its own page on this API.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-api-keys check
```

## Server extensions

Pass an array to `apiKey()` to configure multiple key classes with unique `configId` values. Each entry receives the usual overridable NocoBase defaults. Set `enableSessionForAPIKeys: false` for keys that an application verifies explicitly instead of resolving into the owner’s Session.

`ApiKeyService` from the server entry binds trusted `create`, `get`, `verify`, `disable`, and `remove` calls to one registered configuration and the Authentication plugin API. It never returns a hash, and creation returns the plaintext once. The service supports database storage only; callers own authorization, the resources they bind keys to, and restrictions on public self-service endpoints. No application-specific scope or App identity is built into this plugin.

Server calls run through `Auth.pluginApi()` and the normal Better Auth hooks; `withConnection(connection)` binds all credential writes to a caller-owned transaction. The added get/delete operations are declared with `createAuthEndpoint.serverOnly` and cannot be reached over HTTP.

`findRequestApiKey(plugin, headers)` returns the key a request carries, read from the headers of every configuration that resolves keys into sessions, and `createApiKeyApiDocsAccess(resolveAuth)` is the API document access check the plugin's server registers; an application assembling its own providers can register it on `apiDocsToken` itself. `Auth.plugin<ApiKeysPlugin>('api-key')?.options.configurations` holds the configurations `apiKey()` was created with, after its defaults.

Trusted lifecycle integrations can call `removeUserApiKeys(connection, userId, configIds)` within their user-deletion transaction to remove database-backed credentials for explicit user-referencing configurations. Do not pass organization-referencing or custom-storage configurations. Hub uses `default` and `hub-publishing`; dependent Hub bindings are removed by foreign-key cascades.
