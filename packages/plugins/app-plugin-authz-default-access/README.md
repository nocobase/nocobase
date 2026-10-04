# @nocobase/app-plugin-authz-default-access

Adds default access: records every identity that already holds an action reaches, in addition to what its own grants select. A default-access rule never grants an action, a page or a field; it widens the records of an action some grant already allows, and restriction rules still narrow the result. Choose it as an intentional baseline, not as a fallback for identities without a selection of their own.

## Terminology

| Term                | Meaning                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Default-access rule | `DefaultAccessRule { key, resource, actions }`, stored by this plugin. A resource holds at most one rule.                 |
| Rule action         | `RuleAction { action, scopeKey?, selection }`: one action of the rule and the records it adds.                            |
| Record selection    | `all`, `records` with ids, or `recordAccess` with a key and params.                                                       |
| Data scope          | A named slot on a composite action; `scopeKey` names it when the rule targets a composite.                                |
| Settings item       | `settings:authorization.default-access`, whose `read`, `create`, `update` and `delete` actions gate this plugin's routes. |

## Layers

```text
 storage                         judgement                                        use
 ─────────────────────────       ────────────────────────────────────────         ────────────────────────────
 default-access rules ─────────▶ `expand` constraint for every identity ─┐        context.authorize(...)
                                  Permission Set grants ─────────────────┴▶ type  authz.database.policyFor(...)
 display: the "Default access" settings page; its settings item is placed in the authorization subsection through authz.ui
```

## Entry points

| Import                                                    | Contents                                       |
| --------------------------------------------------------- | ---------------------------------------------- |
| `@nocobase/app-plugin-authz-default-access/server`        | Server plugin and the `defaultAccess` factory. |
| `@nocobase/app-plugin-authz-default-access/client`        | Client plugin.                                 |
| `@nocobase/app-plugin-authz-default-access/client/plugin` | The client plugin factory alone.               |
| `@nocobase/app-plugin-authz-default-access/client/routes` | The settings route contribution.               |
| `@nocobase/app-plugin-authz-default-access/package.json`  | The package manifest.                          |

## Install

Register the default exports of `./client` and `./server` beside the main authorization plugin and run the application's migrations. Then add the factory to the application's authorization configuration:

```ts
import { defaultAccess } from '@nocobase/app-plugin-authz-default-access/server';

export default { plugins: [defaultAccess()] };
```

`defaultAccess({ store? })` wraps `defaultAccessPlugin` from `@nocobase/authorization/default-access` with the bundled database store; a replacement store implements `DefaultAccessStore<DatabaseConnection>`. During setup it registers the settings item `authorization.default-access`, placed in the `authorization` subsection with `authz.ui.place`, with actions `read`, `create`, `update` and `delete`, and registers its HTTP handler with `authz.routes.add('/defaultAccess', handler)`. Without the factory in the configuration the plugin adds no API and no route.

## Service API

```ts
import { selection } from '@nocobase/authorization/core';
import {
  defineDefaultAccessRule,
  type DefaultAccessAuthorizationApi,
} from '@nocobase/authorization/default-access';
import type { DatabaseConnection } from '@nocobase/db';

if (!('defaultAccess' in authz))
  throw new Error('Default access is not configured');
const rules = (
  authz as typeof authz & DefaultAccessAuthorizationApi<DatabaseConnection>
).defaultAccess;

await rules.create(
  defineDefaultAccessRule('quotes-baseline', quotes.reference())
    .scope('view', 'quotes', selection.recordAccess('sales.public'))
    .build(),
);
await rules.create({
  key: 'orders-baseline',
  resource: { type: 'database.collection', id: 'orders' },
  actions: [
    { action: 'read', selection: selection.recordAccess('recordsIOwn') },
  ],
});
```

| `authz.defaultAccess` method        | Contract                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `create(rule)`                      | Stores a new rule after validating it; a resource that already has a rule throws `DefaultAccessConflictError`. |
| `update(key, rule)`                 | Replaces a rule with a complete definition; the key may change, but not onto a resource another rule holds.    |
| `delete(key)`, `get(key)`, `list()` | Remove and read rules.                                                                                         |
| `withTransaction(transaction)`      | An API bound to a caller-owned transaction.                                                                    |

A rule on a composite names the data scope in `scopeKey` and applies to that composite action's branch only. A rule on a `database.collection` omits `scopeKey` and applies across every branch that reaches the collection. The service is a trusted provisioning API: a custom HTTP caller must check the settings item itself and validate the rule against the registered model with `validateDataScopeRule`, as this plugin's handler does.

## Check access

Rules take effect through the ordinary checks; nothing calls them directly.

```ts
const decision = await c.get('authz').authorize({
  resource: { type: 'composite', id: 'sales.quotes' },
  action: 'view',
});
const policy = decision.conditions?.database?.quotes; // includes the baseline records
```

An unrestricted identity skips every rule.

## HTTP API

Paths are under `/api/authorization` and require a signed-in user. Every route checks `{ resource: { type: 'settings', id: 'authorization.default-access' }, action }` before it validates the request. A rule key may not be `options`, `subjects` or `records`, the fixed segments beside `/defaultAccess/:key`; it is refused as `INVALID_INPUT` naming `key`. Responses wrap results in `{ data }`, and the rule list adds `meta: { total }`; the records list pages by `page` (default 1) and `pageSize` (default 20, at most 100); creation answers `201` and deletion `204` with no body. A `PATCH` changes only the fields it names. Failures use the standard error body with domain `authorization`, except `INVALID_INPUT`, whose domain is `app`; branch on `error.reason`. Errors answer `403 PERMISSION_DENIED` (`AUTHORIZATION_DENIED`), `400 INVALID_ARGUMENT` for a body that does not match the schema (`INVALID_INPUT`) or a rule the registered model does not accept (`INVALID_AUTHORIZATION_INPUT`, whose `fieldViolations` name the offending field, such as `resource.id` or `actions.0.scopeKey`), `404 NOT_FOUND` (`RULE_NOT_FOUND`) for an unknown key, `404 COLLECTION_NOT_FOUND` for a `records/:collection` name the database holds no Collection for, `409 ALREADY_EXISTS` (`RULE_ALREADY_EXISTS`, with `metadata.key`) when a create or rename asks for a key another rule already uses, `404 UNKNOWN_SUBJECT_TYPE` for a subject type without a directory, and `409 ALREADY_EXISTS` with reason `DEFAULT_ACCESS_CONFLICT` when the resource already has a rule, and `metadata.existing` naming that rule. The table enforces the same with a unique `(resourceType, resourceId)` constraint beside the unique `key`.

| Method and path                              | Required action | Request                        | Response `data`                                                         |
| -------------------------------------------- | --------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `GET /defaultAccess`                         | `read`          |                                | `DefaultAccessRule[]`, with `meta: { total }`                           |
| `POST /defaultAccess`                        | `create`        | a complete `DefaultAccessRule` | the rule                                                                |
| `PATCH /defaultAccess/:key`                  | `update`        | the fields that change         | the rule                                                                |
| `DELETE /defaultAccess/:key`                 | `delete`        |                                | none                                                                    |
| `GET /defaultAccess/options`                 | `read`          |                                | `AuthorizationOptions`                                                  |
| `GET /defaultAccess/subjects/:type`          | `read`          | query `q?`, `page`, `pageSize` | `SubjectOption[]`, with `meta: { page, pageSize, total }`               |
| `POST /defaultAccess/subjects/:type/resolve` | `read`          | `{ ids: string[] }`            | `SubjectOption[]`                                                       |
| `GET /defaultAccess/records/:collection`     | `read`          | query `page`, `pageSize`       | `[{ id, label, description? }]`, with `meta: { page, pageSize, total }` |

The settings page is `/settings/authorization/default-access`; its route declares `authz: { resource: { type: 'settings', id: 'authorization.default-access' }, action: 'read' }`.

## `@nocobase/app-plugin-authz-default-access/server`

### Exports

| Export                 | Kind     | Signature                                                                                                                                   | Purpose                        |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `default`              | plugin   | `defineServerPlugin(...)`                                                                                                                   | The server plugin to register. |
| `defaultAccess`        | function | `defaultAccess(options?: DefaultAccessOptions): AuthorizationPlugin<DefaultAccessAuthorizationApi<DatabaseConnection>, DatabaseConnection>` | The configuration factory.     |
| `DefaultAccessOptions` | type     | `{ store?: DefaultAccessStore<DatabaseConnection> }`                                                                                        | Replaces the bundled store.    |

## `@nocobase/app-plugin-authz-default-access/client`

### Exports

| Export    | Kind   | Signature                 | Purpose                        |
| --------- | ------ | ------------------------- | ------------------------------ |
| `default` | plugin | `defineClientPlugin(...)` | The client plugin to register. |

## `@nocobase/app-plugin-authz-default-access/client/plugin`

### Exports

| Export    | Kind   | Signature                | Purpose                    |
| --------- | ------ | ------------------------ | -------------------------- |
| `default` | plugin | `AppClientPluginFactory` | The client plugin factory. |

## `@nocobase/app-plugin-authz-default-access/client/routes`

### Exports

| Export    | Kind  | Signature                    | Purpose                                        |
| --------- | ----- | ---------------------------- | ---------------------------------------------- |
| `default` | const | `AppClientRouteContribution` | The settings route of the default-access page. |

## `@nocobase/app-plugin-authz-default-access/package.json`

The package manifest.
