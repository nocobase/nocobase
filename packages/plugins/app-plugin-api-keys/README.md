# @nocobase/app-plugin-api-keys

API key authentication for NocoBase applications, built on Better Auth.

A key authenticates as the user who created it. `Auth.getSession()` resolves the `x-api-key` header the same way it resolves a session cookie, so `auth.required()`, the route guards, and `@nocobase/app-plugin-authorization` all see the owning user and exactly the roles that user holds. Nothing in an application has to know a request arrived by key rather than by cookie.

Keys are self-service: each signed-in user creates and revokes their own, in Personal settings › API keys, which this plugin's client registers (see [Pages](#pages)). A system key instead acts as a service account of its own, not as any member, and administrators manage it in System settings › API keys (see [System keys](#system-keys)).

## Pages

The client plugin (`@nocobase/app-plugin-api-keys/client`) registers Personal settings › API keys at `/me/api-keys`: the person's keys with what each can do, its expiry and last use, rotate and revoke; New key (`/me/api-keys/create`), where a key gets its permissions from the authorization plugin's permission table limited to what the person holds, a template or quick settings, and its secret is shown once with a copy button and a `curl` example; and a key's read-only detail (`/me/api-keys/:keyId`), where permissions the person has lost show struck through as lapsed. New key shows only to a person who may create keys (see below); everyone can list, open and revoke their own keys. The pages need the authorization plugin's client registered, whose `KeyPermissionEditor` they use, and an application lists the plugin in `client/plugins.ts` with nothing else to write.

It also registers System settings › API keys, in the Accounts category, with four tabs each at its own address: System keys (`/settings/api-keys`, with New system key at `create` and a key's detail at `:identityId`, whose Permissions tab changes its permissions at once and whose Activity tab lists who changed what, before and after), Managed keys (`/settings/api-keys/managed`, view, disable or delete only), Members' personal keys (`/settings/api-keys/members`, filtered by "same as member" or unused for 90 days, revoked without seeing the key or changing its permissions) and Rules (`/settings/api-keys/rules`). Opening them takes `settings:apiKeys/read`; creating and changing anything takes `manage`. Its client service provider adds System key and Personal key to the subjects of Roles and permissions › Permission check, through the authorization plugin's `checkSubjects`.

An application replaces a page with its own through `routeComponentOverrides` on its runtime definition, naming the page by the ids in `API_KEY_ROUTES` (`@nocobase/app-plugin-api-keys:apiKeysPersonal`, `…:apiKeysPersonalCreate`, `…:apiKeysPersonalDetail`, `…:apiKeysSystem`, `…:apiKeysSystemCreate`, `…:apiKeysSystemDetail`, `…:apiKeysManaged`, `…:apiKeysManagedDetail`, `…:apiKeysMembers`, `…:apiKeysRules`), or leaves every page out with `apiKeys({ routes: false })` and builds its own on `authClient.apiKey.*` or the HTTP API below.

## Who may create keys

`settings:personalApiKeys` `create` lets a person create (and rotate) keys of their own, and `settings:apiKeys` `read` and `manage` are the permissions of the system settings' API keys page; all three are settings items no key may hold. Without an application policy (`ScopedApiKeys.setOwnKeyPolicy`), which still decides when set, `/api/apiKeys` and Better Auth's `/api-key/create` require `personalApiKeys/create` from a role. The built-in `member` role carries nothing: so that nobody loses the ability on upgrade, a seed creates the role `personal-api-key-creators`, holding only that permission, and assigns it user by user to every person the installation has then, never to a service account; people added later get it from an administrator. An application role that already has that key is left as it is, and the seed uses the next free key (`personal-api-key-creators-2`, …). The seed skips only when the authorization plugin's roles Collection is not registered, which its migrations do; any other failure, including a database refusing to read the table, fails the upgrade, which runs again.

A key that acts as its owner in full ("Same as me", `permissions: null` or the deprecated `scope: null`) is refused with 403 `SAME_AS_ME_DISABLED` unless the application sets `apiKeys.allowSameAsMe: true`, on new and upgraded installations alike. Keys that exist keep working and can be rotated either way. A service account's key is bounded by the account's own permissions and is not one of these. An application whose callers still create such keys, through `/api/apiKeys` or Better Auth's `/api-key/create`, turns the option on. Studio is one: its CLI and tests create such keys, so it adds `apiKeys.allowSameAsMe: true` to its configuration (PM-1766). That one line of configuration is the only change Studio needs for this release; everything else it uses works unchanged.

## System keys

A system key is a service account this plugin creates for it (`kind: 'service'`, never listed among members or in member pickers), a hidden, protected Permission Set `system-key-<account id>` that account holds (owner `@nocobase/app-plugin-api-keys`), and one API key of that account whose own permissions are the same grants, so the two intersect. It does not act as its owner, who only receives its reminders, and it keeps working when people leave. Its permissions are granted one by one from what the administrator holds (`KEY_SCOPE_EXCEEDS_YOURS` otherwise), start with none, and change at any time; every change is recorded in `apiKeyEvents` with who made it and the permissions before and after, as are creating, editing, rotating, disabling, enabling and deleting. Rotating keeps the identity, name, permissions and activity and stops the old secret at once; disabling stops the key at once.

A system key is no member, so it takes records as all (`{ type: 'all' }`, `allRecords`) or as selected ones (a `{ type: 'records' }` scope or the records a key is limited to), never scopes counted from a person such as "mine" or actions ending in `.related` (`SYSTEM_KEY_SCOPE`). Its scope is marked `personless`, so default access and sharing rules that add records by a `personal` record access ("records I own", "records I created") add none for it; restriction rules apply to it as to anyone, and sharing rules cannot name a service account. An administrator who holds only records counted from themselves can give it only records chosen from those they can see (`{ type: 'records', ids }`, listed, searched and paged by `GET /api/apiKeys/scopeRecords`). Chosen records are checked again on saving against what the giver reaches now, restriction rules included, even under a role that reaches every record; every record or a record they cannot see is refused (`KEY_SCOPE_EXCEEDS_YOURS`). Its owner must be an active member and is told a week before the key expires. Permission changes are made one at a time per key, with the set, the key's scope and the activity written in one transaction. Every process protects the hidden sets by their `system-key-` prefix, so a set another process creates later is hidden and protected at once. The prefix is reserved: no role can be created in it, and a set already named so before is reported at boot, to be renamed.

Only service accounts listed in `apiKeySystemKeys` are system keys. An application's own service accounts and their Permission Sets, such as Studio's organization keys (`api-key-<id>` sets, `studioApiKeyEvents`, `/api/organizationKeys`), are never listed or changed; `SystemApiKeys.adopt({ identityId, keyId, permissions?, ownerId?, managedBy?, events? })` lists one as a system key: the key named must belong to the account. The hidden set takes the grants the account holds, read from its Permission Sets in the same transaction (scopes counted from a person stay: they only narrow); `permissions`, when given, must each be held exactly (`ADOPT_NOT_HELD`). The key keeps its own scope, so what it may do stays the intersection of both, and its history is copied. It runs in one transaction; calling it again for the same key answers the adopted key, for another key of the account `ALREADY_SYSTEM_KEY`. An application then removes its own set and records.

Managed keys are system keys another feature creates and adjusts for a person: `createManaged(userId, input, managedBy)`, `setPermissionsManaged(identityId, userId, permissions)` and `rotateManaged(identityId, actorId)` need no `settings:apiKeys/manage` but never give more than that person holds. `managedBy` (`{ kind, id, title }`) shows as "Managed · <title>"; administrators can only view, disable or delete them (`SYSTEM_KEY_MANAGED` otherwise; `updateManaged` and `enableManaged` are the manager's). A manager registered with `managers.add(kind, { onRevoked })` is told when an administrator disables or deletes one: the notice is stored (`apiKeyManagerNotices`) in the transaction that disables or deletes the key, delivered once it commits with its `noticeId`, the same on every attempt, and removed once taken, and `deliverNotices()`, which the daily schedule runs, tries a failed one again, even after the key is gone, so a manager should treat a repeated notice as the same event.

### Rules

System settings › API keys › Rules, kept in `apiKeyRules`, replace the application's `apiKeys` configuration once saved: whether "same as me" personal keys may be created (off by default), the longest and the default lifetime of a personal key with permissions, and after how many idle days keys are disabled (off by default; more than 7 days). They act on keys created or rotated afterwards. Idle disabling applies to personal and system keys alike, by the rule each key took when it was created or last rotated: a key made before the rule, or while it was off, is never disabled for being idle, and changing the rule reaches a key only when it is rotated. The plugin's daily schedule (through `@nocobase/app-plugin-scheduler`) reminds the owner, by an in-app notification, a week before, and counts idle time from the later of the last use and the current value's issue; rotating clears the last reminder. Who may open the page, manage system keys or create personal keys is set on roles, never in the rules.

## What this package is

Better Auth's [API Key plugin](https://www.better-auth.com/docs/plugins/api-key), plus the parts an application needs around it:

- the `apikey` table migration;
- `apiKey` and `apiKeyClient`, carrying Better Auth's own names and options.

`apiKey` is wrapped only to supply four defaults, all of them overridable; everything else is Better Auth's behavior and its documentation applies unchanged. They come from this package rather than from a dependency each application installs because the migration here has to match the schema that version of `@better-auth/api-key` declares; a test asserts the table carries a column for every field the plugin declares.

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
// client/plugins.ts — registers the plugin; it contributes no pages
import apiKeys from '@nocobase/app-plugin-api-keys/client';
apiKeys();

// client/config/auth.ts — so authClient.apiKey.* reaches the endpoints
import { apiKeyClient } from '@nocobase/app-plugin-api-keys/client';

export default defineAppConfig((_runtime) => ({
  plugins: [usernameClient({ displayUsername: false }), apiKeyClient()],
}));
```

Then run `pnpm nocobase db apply`.

Registering the server plugin without `apiKey()` creates the table and mounts no endpoints; registering `apiKey()` without the server plugin mounts endpoints against a table that does not exist.

## The four defaults

| Option                    | Better Auth                         | Here    | Why                                                                                                                     |
| ------------------------- | ----------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `enableSessionForAPIKeys` | `false`                             | `true`  | Without it a key authenticates nothing: keys are still issued, and every request carrying one answers 401               |
| `rateLimit.enabled`       | `true`, 10 requests per key per day | `false` | That is a quota for issuing keys rather than for using them, and it silently breaks the first integration anyone writes |
| `requireName`             | `false`                             | `true`  | A key is identified by its name, and a key listed as "unnamed" cannot be revoked with any confidence                    |
| `maximumNameLength`       | `32`                                | `100`   | Matches scoped key creation and rotation.                                                                               |

All four are overridable. `apiKey({ rateLimit: { enabled: true, maxRequests: 1000, timeWindow: 60_000 } })` sets a quota, and passing all four back reproduces Better Auth's own behaviour exactly.

## Using a key

```bash
curl -H 'x-api-key: <key>' https://example.com/api/orders
```

## Reading the API document with a key

A valid key may read the application's OpenAPI document and its Swagger UI, exactly as a signed-in session may: `curl -H 'x-api-key: <key>' https://example.com/api/swagger` returns the JSON document, and `/api/swagger/docs` the page. The key is checked the way every other request checks it, so an unknown, expired or disabled key, or one whose owner is disabled, gets `401` with `error.reason` `API_DOCS_UNAUTHENTICATED`, and reading the document extends no session. The document lists this plugin's endpoints under `/api/auth/api-key/...` with the rest of Better Auth's, tagged `Authentication`. A configuration with a `customAPIKeyGetter` is not consulted by this check, because the getter needs a Better Auth endpoint context.

## What a key can do

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

A rejected key — expired, revoked, or wrong — is answered by a guarded `/api` route with Better Auth's own status in the standard error body, its code as `error.reason` and `authentication` as `error.domain`, so the caller can tell why: `401 KEY_EXPIRED`, `401 KEY_NOT_FOUND`, `429 USAGE_EXCEEDED`. Branch on `error.reason`, never on `message`. `Auth.getSession()` throws Better Auth's `APIError` for a refused key, exactly as Better Auth itself does, and a caller that only asks who is signed in catches it. A disabled user's keys stop working immediately, because `Auth.getSession()` re-reads `user.disabledAt` on every request.

## Scoped keys

A key may carry permissions, as a GitHub fine-grained token does. Its effective permission is its holder's current permission intersected with them: they never grant anything, and a holder who loses a permission takes it from every key at once. A key without permissions acts as its holder, as described above, except that no key ever takes an action a person's only (below).

### Permissions in the shape of a permission set

A key's permissions are the grants of a permission set — the same resources and actions (pages, settings items and their actions, business actions, composite actions and the tabs plugins add), with the record scopes of a composite action as its policy — and the records a business is limited to:

```json
{
  "grants": [
    {
      "resource": { "type": "page", "id": "rel-apps" },
      "actions": [{ "action": "access" }]
    },
    {
      "resource": { "type": "rel", "id": "rel.apps" },
      "actions": [{ "action": "deploy.all" }]
    },
    {
      "resource": { "type": "composite", "id": "sales.quotes" },
      "actions": [
        {
          "action": "view",
          "policy": {
            "type": "composite",
            "scopes": { "quote": "recordsIOwn" }
          }
        }
      ]
    }
  ],
  "objects": { "rel.apps": ["app-1"] }
}
```

`POST /api/apiKeys` takes them as `permissions` (null for the caller in full) and every key answers them as `permissions`. They are checked when the key is made: each action must be registered (`UNKNOWN_PERMISSION`), one a key may hold (`KEY_ACTION_HUMAN_ONLY`) and one the maker holds today (403 `KEY_SCOPE_EXCEEDS_YOURS`); each record must be one the maker may see (`UNKNOWN_SCOPE_OBJECT`), of a business that offers record selection (`SCOPE_OBJECTS_NOT_OFFERED`). `GET /api/apiKeys/grantable` lists what the caller may give: the actions they hold, those no key may hold marked with the reason, the templates resolved to what they hold, and the businesses offering record selection.

They are stored in Better Auth's `permissions` column as format `2` — `{ "$v": "2", "grants": [...], "objects": {...} }` — which Better Auth refuses to take from a client (`SERVER_ONLY_PROPERTY`), so a key's holder cannot widen them. A value in an unknown format grants nothing; a field left out means none, while a damaged one is never read as left out: a damaged grant list or record-limit map grants nothing, an action whose policy is damaged is dropped, and a business whose record list is damaged reaches none of its records.

Plugins declare what keys are offered with the authorization plugin, next to the actions they register, without depending on this package:

- **Actions no key may hold:** `humanOnly: <reason>` on an action (`authz.settings.add`, `ResourceItems`, a resource type's actions, or `.humanOnly(reason)` on a composite action). A request made with any key — with permissions, without, or a service account's — is denied the action with `KEY_HUMAN_ONLY`, whatever its holder's grants say; a person signed in takes it as their role allows. `risk: 'high'` marks an action the permission editor asks about before turning it on.
- **Templates:** `authz.credentials.templates.add({ id, title, description?, expiresInDays?, grants: [{ resource, actions, objects?: 'pick' }] })`. An action name stands for each of its levels (`deploy` for `deploy.related` and `deploy.all`); a key gets the levels its maker holds. `ScopedApiKeys.templatePermissions(templateId, identity, objects?)` makes the same permissions in code, for an integration that creates keys from a template. A built-in `read-only` template takes every `access`, `read` and `view` action the maker holds.
- **Record sources:** `authz.credentials.objectSources.add(business, source)`, where `business` is what `keyScope.objects(business)` takes and the resource id of its grants (`rel.apps`), and `source.list({ identity, search?, ids? })` answers only what `identity` may see.

### Format 1, deprecated

Before format `2`, a scope was a set of permission groups at a read, write or admin level, which plugins declared as data (`KeyScopeGroupDeclaration`, `KeyScopePresetDeclaration`) and the application assembled through `apiKeyScopesToken` (`groups.add`, `presets.add`, `mapAccess`). All of it is deprecated and still works for one more minor release, then removed:

- `POST /api/apiKeys` still takes `scope`, and `GET /scopeOptions` and `GET /scopeObjects/:group` still answer (marked `deprecated` in the API document). A key answers `scope` as the groups it was made or converted from — none for a key made with `permissions` — next to `permissions`.
- `ScopedApiKeys.scopeOptions`, `scopeObjects`, `check`, `issueChecked`, `setScope` and `identityOf` take and answer the groups as before; a scope is checked against the registered groups as before, then stored converted to format `2` with the groups kept alongside (`legacy`). An action a group maps to that no key may hold is dropped from the converted permissions.
- `encodeKeyScope` and `decodeKeyScope` read and write format `1`; `decodeKeyScope` answers a format-`2` value's groups. Use `encodeKeyPermissions` and `decodeKeyPermissions`.
- A key still stored in format `1` (`{ "$v": ["1"], "releases.apps": ["read", "write"], "releases.apps@": ["app-1"] }`) keeps working as before. After an upgrade, the first request the application serves converts every such key in the background, exactly as it is enforced at that moment, so no key widens; in batches; a key naming a group no longer registered, or one that fails to convert, stays in format `1` and is tried again on the next start, and the application log gets a summary with counts and key ids only. Nothing has to be regenerated.
- The `KEY_SCOPE_GROUPS` and `KEY_SCOPE_PRESETS` of the projects, releases and agents plugins are still exported; those plugins now declare templates, record sources and human-only actions as above.

To migrate an application: stop registering groups and presets, register templates and record sources with `authz.credentials`, mark the actions no key may hold `humanOnly`, and send `permissions` instead of `scope`.

`/api/apiKeys` offers no way to change a person's key's permissions; create another. An application that manages keys of its own (an organization's keys, say) may change one with `ScopedApiKeys.setScope`, deciding itself who may and what they may give.

What enforces a scope on each request:

- Better Auth turns the key into its owner's session, as for any key. This plugin's provider then recognizes the key behind the session (its id and token), reads its permissions once per request (one query), and adds them to the authorization identity as `keyScope` (`authz.use`). `authz.can`, `require`, `authorize` and the permissions snapshot deny anything outside them with `KEY_SCOPE`, and any action a person's only with `KEY_HUMAN_ONLY`, which is checked first. A composite action's record scopes apply to an unrestricted holder's key too. A composite action's record scopes restrict the records it reaches the way a restriction rule does (`keyScope.policy`). A key without permissions carries a `keyScope` that narrows no action (`permissions: null`), so it too is denied what a person only may do.
- `auth.required()` refuses a scoped key with 403 `SCOPED_KEY_FORBIDDEN` unless the route opts in with `auth.required({ scopedKeys: true })`. Opt in only where every operation is authorized through `authz`, or where the code narrows by `identity.keyScope` itself; anything that derives permissions on its own (from `permissionSets.getEffective`, say) must intersect with `keyScope` or it widens the key back to its owner.
- A scoped key reaches no Better Auth account endpoint but `/get-session`: it cannot mint or list keys, change the profile, list sessions or sign out.
- Record selections are enforced only by the plugin that owns the records, through `keyScope.objects(business)`. An empty selection reaches none of them: the key holds the group's actions, so the commands and routes that need them are offered, while every record the plugin checks is refused.

A service account's key is treated as scoped even without a scope: `required()` refuses it unless the route opts in, it reaches no account endpoint, and its identity carries a `keyScope` that narrows nothing (`permissions: null`), so plugins can tell a key from a person. Disabling the account stops all its keys immediately.

`apiKeys.maxScopedKeyDays` in the application's configuration caps how long a scoped key lives; unset, "never expires" stays available. The editor proposes 90 days.

### Server API

| Export                                         | What it is                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiKeyScopesToken`                            | The deprecated format-`1` registry: `groups.add`, `presets.add`, `mapAccess`, `validate`, `compile`; and `compilePermissions`, `convert`                                                                                                                                                            |
| `scopedApiKeysToken`                           | `ScopedApiKeys`: `grantable`, `checkPermissions`, `templatePermissions`, `list`, `get`, `check`, `create`, `issueChecked`, `update`, `rotate`, `revoke`, `revokeAll`, `resolve`, `credentialScope`, `upgradeLegacyScopes`, `setOwnKeyPolicy`; deprecated `scopeOptions`, `scopeObjects`, `setScope` |
| `systemApiKeysToken`                           | `SystemApiKeys`: `list`, `get`, `events`, `create`, `update`, `setPermissions`, `rotate`, `disable`, `enable`, `remove`, `createManaged`, `setPermissionsManaged`, `rotateManaged`, `updateManaged`, `enableManaged`, `adopt`, `deliverNotices`, `managers.add`                                     |
| `memberApiKeysToken`, `idleApiKeysToken`       | `MemberKeys` (`list`, `revoke`) and `IdleKeys` (`sweep`), behind Members' personal keys and the idle rule                                                                                                                                                                                           |
| `ApiKeyScopeError`                             | Refused permissions, 400 with a stable code                                                                                                                                                                                                                                                         |
| `encodeKeyPermissions`, `decodeKeyPermissions` | The storage format; `encodeKeyScope`, `decodeKeyScope` read and write the deprecated format `1`                                                                                                                                                                                                     |

`ScopedApiKeys` acts on whichever user it is told; the caller decides who may manage whose keys. An application builds its own key pages and a service account's keys on it.

- `check(input, identity)` validates what `create` would issue — name, description, scope, the records it picks (each must be one `identity` may see) and expiry — without issuing anything, so a caller can refuse before it creates whatever the key belongs to; `issueChecked(userId, checked)` then issues it.
- `rotate(userId, keyId)` gives a key a new secret in place: the same id, name, description, scope and owner, with the expiry renewed for the lifetime the key had. The old secret stops at once. Better Auth generates and hashes the new value, so its key options apply.
- `setScope(userId, keyId, scope, identity)` replaces a scoped key's scope; `update(userId, keyId, { name?, description? })` renames it.
- `setOwnKeyPolicy(policy)` says who may create (and rotate) keys of their own: `(userId) => Promise<boolean>`. Without one everyone may. With one, `POST /api/apiKeys`, its rotation and Better Auth's own `/api-key/create` from a sign-in answer 403 `API_KEY_CREATION_FORBIDDEN` to anyone the policy refuses, while listing and revoking stay open. The plugin's provider connects the Better Auth hook at boot (`connectOwnKeyPolicy`).

### HTTP API

`/api/apiKeys`, for the signed-in person's own keys (a scoped key or a service account is refused with 403 `SCOPED_KEY_FORBIDDEN`, any other key with 403 `API_KEY_SESSION_FORBIDDEN`). Failures answer in the standard error body with domain `apiKeys` and the codes above as `reason`; an invalid body is 400 `INVALID_INPUT` naming the field, and an unknown field is rejected.

| Request                                                                               | Answer                                                                                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET /grantable`                                                                      | `{ data }`, `GrantablePermissions`: what the caller holds, human-only marks, templates, expiry, `mayCreate` |
| `GET /scopeOptions` (deprecated)                                                      | `{ data }`, `KeyScopeOptions`: the groups with what the caller holds today, presets, expiry, `mayCreate`    |
| `GET /scopeObjects/:group?q=&id=` (deprecated)                                        | `{ data, meta: { total } }`: the records the caller may choose for a group; `id` may repeat                 |
| `GET /objects/:business?q=&id=`                                                       | `{ data, meta: { total } }`: the records the caller may limit a key to for a business; `id` may repeat      |
| `GET /`                                                                               | `{ data, meta: { total, mayCreate, allowSameAsMe } }`: the caller's keys, never a secret                    |
| `GET /:keyId`                                                                         | `{ data }`: one key with `lapsed`, the actions it lost because the caller no longer holds them              |
| `POST /` `{ name, description?, expiresInDays, permissions }` (or deprecated `scope`) | 201 `{ data: { key, secret } }`, the secret shown once                                                      |
| `POST /:keyId/rotate`                                                                 | `{ data: { key, secret } }`: same id, name, scope and lifetime; the old secret stops at once                |
| `DELETE /:keyId`                                                                      | 204                                                                                                         |

System settings › API keys answers on the same router and on `/api/systemApiKeys`, from a sign-in only. Reading takes `settings:apiKeys/read`, every change `manage`:

| Request                                                                                                                       | Answer                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /api/apiKeys/members?q=&sameAsMember=&idleDays=&page=&pageSize=`                                                         | `{ data, meta: { total } }`: members' personal keys with their member, never a secret                         |
| `DELETE /api/apiKeys/members/:keyId`                                                                                          | 204                                                                                                           |
| `GET /api/apiKeys/rules`, `PUT /api/apiKeys/rules` `{ allowSameAsMe, personalMaxDays, personalDefaultDays, idleDisableDays }` | `{ data }`, the rules; 400 `INVALID_RULES`                                                                    |
| `GET /api/systemApiKeys?q=&managed=&page=&pageSize=`, `GET /api/systemApiKeys/:identityId`                                    | `{ data, meta: { total } }`: system keys with owner, manager, status and permissions, paged                   |
| `GET /api/apiKeys/scopeRecords?resource=&action=&scope=&q=&page=`                                                             | `{ data, meta: { hasMore } }`: the records the caller sees through a composite action's data scope, 50 a page |
| `POST /api/systemApiKeys` `{ name, description?, ownerId?, expiresInDays, permissions }`                                      | 201 `{ data: { key, secret } }`, the secret shown once                                                        |
| `PATCH /api/systemApiKeys/:identityId` `{ name?, description?, ownerId? }`                                                    | `{ data }`                                                                                                    |
| `PUT /api/systemApiKeys/:identityId/permissions` `{ permissions }`                                                            | `{ data }`; 400 `SYSTEM_KEY_MANAGED` for a managed key                                                        |
| `POST /api/systemApiKeys/:identityId/rotate`                                                                                  | `{ data: { key, secret } }`; 400 `SYSTEM_KEY_MANAGED` for a managed key                                       |
| `POST /api/systemApiKeys/:identityId/disable`, `…/enable`                                                                     | `{ data }`; disabling or deleting a managed key calls its manager                                             |
| `DELETE /api/systemApiKeys/:identityId`                                                                                       | 204: the key, its service account and its Permission Set go                                                   |
| `GET /api/systemApiKeys/:identityId/events`                                                                                   | `{ data }`: its activity, newest first                                                                        |

`toApiKeysApiError(error)` turns `ApiKeyScopeError` and `ApiKeyRequestError` into that body's `ApiError`, for an application's own key routes: `router.onError((error, context) => apiErrorHandler(toApiKeysApiError(error), context))`.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-api-keys check
```

## Server extensions

Pass an array to `apiKey()` to configure multiple key classes with unique `configId` values. Each entry receives the usual overridable NocoBase defaults. Set `enableSessionForAPIKeys: false` for keys that an application verifies explicitly instead of resolving into the owner’s Session.

`ApiKeyService` from the server entry binds trusted `create`, `get`, `verify`, `disable`, and `remove` calls to one registered configuration and the Authentication plugin API. It never returns a hash, and creation returns the plaintext once. The service supports database storage only; callers own authorization, the resources they bind keys to, and restrictions on public self-service endpoints. No application-specific scope or App identity is built into this plugin.

Server calls run through `Auth.pluginApi()` and the normal Better Auth hooks; `withConnection(connection)` binds all credential writes to a caller-owned transaction. The added get/delete operations are declared with `createAuthEndpoint.serverOnly` and cannot be reached over HTTP.

`findRequestApiKey(plugin, headers)` returns the key a request carries, read from the headers of every configuration that resolves keys into sessions, and `createApiKeyApiDocsAccess(resolveAuth)` is the API document access check the plugin's server registers; an application assembling its own providers can register it on `apiDocsToken` itself. `Auth.plugin<ApiKeysPlugin>('api-key')?.options.configurations` holds the configurations `apiKey()` was created with, after its defaults.

Trusted lifecycle integrations can call `removeUserApiKeys(connection, userId, configIds)` within their user-deletion transaction to remove database-backed credentials for explicit user-referencing configurations. Do not pass organization-referencing or custom-storage configurations.
