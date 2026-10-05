# @nocobase/app-plugin-authz-restriction-rules

Adds restriction rules: for the subjects a rule lists, the records an action reaches are intersected with the rule's selection. The selection describes the records still allowed, not the records to hide. Several matching restrictions all apply; none can grant an action or widen a range.

## Terminology

| Term             | Meaning                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Restriction rule | `RestrictionRule { key, resource, actions, title?, subjects, reason? }`, stored by this plugin.                              |
| Rule action      | `RuleAction { action, scopeKey?, selection }`: one action of the rule and the records still allowed.                         |
| Record selection | `all`, `records` with ids, or `recordAccess` with a key and params. Every kind is accepted.                                  |
| Data scope       | A named slot on a composite action; `scopeKey` names it when the rule targets a composite.                                   |
| Subject          | Who the rule applies to, `{ type, id }`.                                                                                     |
| Settings item    | `settings:authorization.restriction-rules`, whose `read`, `create`, `update` and `delete` actions gate this plugin's routes. |

## Layers

```text
 storage                       judgement                                                    use
 ────────────────────────      ────────────────────────────────────────────────────         ────────────────────────────
 restriction rules ──────────▶ `restrict` constraint for the rule's subjects ─┐             context.authorize(...)
                                grants, default access, sharing ──────────────┴▶ type       authz.database.policyFor(...)
 display: the "Restriction rules" settings page; its settings item is placed in the authorization subsection through authz.ui
```

## Entry points

| Import                                                       | Contents                                          |
| ------------------------------------------------------------ | ------------------------------------------------- |
| `@nocobase/app-plugin-authz-restriction-rules/server`        | Server plugin and the `restrictionRules` factory. |
| `@nocobase/app-plugin-authz-restriction-rules/client`        | Client plugin.                                    |
| `@nocobase/app-plugin-authz-restriction-rules/client/plugin` | The client plugin factory alone.                  |
| `@nocobase/app-plugin-authz-restriction-rules/client/routes` | The settings route contribution.                  |
| `@nocobase/app-plugin-authz-restriction-rules/package.json`  | The package manifest.                             |

## Install

Register the default exports of `./client` and `./server` beside the main authorization plugin and run the application's migrations. Then add the factory to the application's authorization configuration:

```ts
import { restrictionRules } from '@nocobase/app-plugin-authz-restriction-rules/server';

export default { plugins: [restrictionRules()] };
```

`restrictionRules({ store? })` wraps `restrictionRulesPlugin` from `@nocobase/authorization/restriction-rules` with the bundled database store; a replacement store implements `RestrictionRuleStore<DatabaseConnection>`. During setup it registers the settings item `authorization.restriction-rules`, placed in the `authorization` subsection with `authz.ui.place`, with actions `read`, `create`, `update` and `delete`, and registers its HTTP handler with `authz.routes.add('/restrictionRules', createRouteHandler(router))`, so its routes are served at `/api/authorization/restrictionRules` and documented in the application's API document automatically. Without the factory in the configuration the plugin adds no API and no route.

## Service API

```ts
import { selection } from '@nocobase/authorization/core';
import {
  defineRestrictionRule,
  type RestrictionRulesAuthorizationApi,
} from '@nocobase/authorization/restriction-rules';
import type { DatabaseConnection } from '@nocobase/db';

if (!('restrictionRules' in authz))
  throw new Error('Restriction rules is not configured');
const rules = (
  authz as typeof authz & RestrictionRulesAuthorizationApi<DatabaseConnection>
).restrictionRules;

await rules.create(
  defineRestrictionRule('public-proposals', quotes.reference())
    .title('Exclude confidential proposals')
    .subjects({ type: 'sales.team', id: 'proposal' })
    .scope('submit', 'quotes', selection.recordAccess('sales.public'))
    .reason('Proposal collaboration excludes confidential work')
    .build(),
);
await rules.create({
  key: 'interns-orders',
  resource: { type: 'database.collection', id: 'orders' },
  subjects: [{ type: 'team', id: 'interns' }],
  actions: [
    { action: 'update', selection: selection.records(['order-1', 'order-2']) },
  ],
});
```

| `authz.restrictionRules` method     | Contract                                                        |
| ----------------------------------- | --------------------------------------------------------------- |
| `create(rule)`                      | Stores a new rule after validating it.                          |
| `update(key, rule)`                 | Replaces a rule with a complete definition; the key may change. |
| `delete(key)`, `get(key)`, `list()` | Remove and read rules.                                          |
| `withTransaction(transaction)`      | An API bound to a caller-owned transaction.                     |

A rule on a composite names the data scope in `scopeKey` and narrows that composite action's branch only. A rule on a `database.collection` omits `scopeKey` and narrows every branch that reaches the collection. The service is a trusted provisioning API: a custom HTTP caller must check the settings item itself and validate the rule with `validateDataScopeRule`, as this plugin's handler does.

## Check access

Rules take effect through the ordinary checks; nothing calls them directly.

```ts
const policy = await authz.database.policyFor('orders', c.get('authz')); // interns update order-1 and order-2 at most
```

An unrestricted identity skips every rule.

## HTTP API

Paths are under `/api/authorization` and require a signed-in user. Every route checks `{ resource: { type: 'settings', id: 'authorization.restriction-rules' }, action }` before it validates the request. A rule key may not be `options`, `subjects` or `records`, the fixed segments beside `/restrictionRules/:key`, and a rule may not list a subject twice; both are refused as `INVALID_INPUT` naming the field (`key`, or the repeated `subjects.<index>`). Responses wrap results in `{ data }`, and the rule list adds `meta: { total }`; the records list pages by `page` (default 1) and `pageSize` (default 20, at most 100); creation answers `201` and deletion `204` with no body. A `PATCH` changes only the fields it names; `title: null` or `reason: null` clears that field. Failures use the standard error body with domain `authorization`, except `INVALID_INPUT`, whose domain is `app`; branch on `error.reason`. Errors answer `403 PERMISSION_DENIED` (`AUTHORIZATION_DENIED`), `400 INVALID_ARGUMENT` for a body that does not match the schema (`INVALID_INPUT`) or a rule the registered model does not accept (`INVALID_AUTHORIZATION_INPUT`, whose `fieldViolations` name the offending field, such as `resource.id` or `actions.0.scopeKey`), `404 NOT_FOUND` (`RULE_NOT_FOUND`) for an unknown key, `404 COLLECTION_NOT_FOUND` for a `records/:collection` name the database holds no Collection for, `409 ALREADY_EXISTS` (`RULE_ALREADY_EXISTS`, with `metadata.key`) when a create or rename asks for a key another rule already uses, and `404 UNKNOWN_SUBJECT_TYPE` for a subject type without a directory.

Every route is described, with its parameters, request and response schemas and error statuses, in the application's API document at `/api/swagger/docs` (JSON at `/api/swagger`, served to a signed-in user or a valid API key), under the `Authorization` tag.

| Method and path                                 | Required action | Request                        | Response `data`                                                         |
| ----------------------------------------------- | --------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `GET /restrictionRules`                         | `read`          |                                | `RestrictionRule[]`, with `meta: { total }`                             |
| `POST /restrictionRules`                        | `create`        | a complete `RestrictionRule`   | the rule                                                                |
| `PATCH /restrictionRules/:key`                  | `update`        | the fields that change         | the rule                                                                |
| `DELETE /restrictionRules/:key`                 | `delete`        |                                | none                                                                    |
| `GET /restrictionRules/options`                 | `read`          |                                | `AuthorizationOptions`                                                  |
| `GET /restrictionRules/subjects/:type`          | `read`          | query `q?`, `page`, `pageSize` | `SubjectOption[]`, with `meta: { page, pageSize, total }`               |
| `POST /restrictionRules/subjects/:type/resolve` | `read`          | `{ ids: string[] }`            | `SubjectOption[]`                                                       |
| `GET /restrictionRules/records/:collection`     | `read`          | query `page`, `pageSize`       | `[{ id, label, description? }]`, with `meta: { page, pageSize, total }` |

The settings page is `/settings/authorization/restriction-rules`; its route declares `authz: { resource: { type: 'settings', id: 'authorization.restriction-rules' }, action: 'read' }`.

## `@nocobase/app-plugin-authz-restriction-rules/server`

### Exports

| Export                    | Kind     | Signature                                                                                                                                            | Purpose                        |
| ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `default`                 | plugin   | `defineServerPlugin(...)`                                                                                                                            | The server plugin to register. |
| `restrictionRules`        | function | `restrictionRules(options?: RestrictionRulesOptions): AuthorizationPlugin<RestrictionRulesAuthorizationApi<DatabaseConnection>, DatabaseConnection>` | The configuration factory.     |
| `RestrictionRulesOptions` | type     | `{ store?: RestrictionRuleStore<DatabaseConnection> }`                                                                                               | Replaces the bundled store.    |

## `@nocobase/app-plugin-authz-restriction-rules/client`

### Exports

| Export    | Kind   | Signature                 | Purpose                        |
| --------- | ------ | ------------------------- | ------------------------------ |
| `default` | plugin | `defineClientPlugin(...)` | The client plugin to register. |

## `@nocobase/app-plugin-authz-restriction-rules/client/plugin`

### Exports

| Export    | Kind   | Signature                | Purpose                    |
| --------- | ------ | ------------------------ | -------------------------- |
| `default` | plugin | `AppClientPluginFactory` | The client plugin factory. |

## `@nocobase/app-plugin-authz-restriction-rules/client/routes`

### Exports

| Export    | Kind  | Signature                    | Purpose                                           |
| --------- | ----- | ---------------------------- | ------------------------------------------------- |
| `default` | const | `AppClientRouteContribution` | The settings route of the restriction-rules page. |

## `@nocobase/app-plugin-authz-restriction-rules/package.json`

The package manifest.
