---
name: nocobase-app-plugin-authz-default-access
description: Design, implement and verify default access for NocoBase 3 business operations, including named data scopes and production administration.
---

# Develop default access

Default access adds a shared record baseline for every identity that already holds an action. It does not grant the action, page access or additional fields. A baseline combines with permission-set data scopes and sharing, and restriction rules still narrow the result, so choose it as an intentional minimum range rather than a fallback for identities without a scope of their own.

Read the installed `nocobase-app-plugin-authorization` Skill first for composite resources, data scopes, fields, server policy enforcement and inherited subjects. The package README at `node_modules/@nocobase/app-plugin-authz-default-access/README.md` is the complete reference for the service, the HTTP routes and the exports; this Skill covers how to use them.

For a department-scoped baseline, read the application development Skill's `references/organization/permission-design.md` first. Its core works with permission sets alone, and its optional default-access section explains why a global default suits a department scope only when everyone holding the action belongs to a department.

## Development workflow

1. Identify which records every holder of a particular operation should receive by default. A read baseline can be broad while edit remains preparer-only; do not copy read defaults into write operations.
2. Confirm the composite, action and data scope exist and that the scope's grants target the intended collection. Reuse an applicable record access or define one through the main authorization Skill.
3. Save one rule per resource under a stable `key`; a second rule on the same resource is rejected, so extend the existing rule instead. A rule lists every action and data scope it widens; updating it replaces the whole rule, and deleting it removes the baseline, not the permission-set action.
4. Verify a holder receives the baseline, a person without the action remains denied, and restrictions still remove excluded rows. Also verify an explicit narrow data scope is not unexpectedly broadened by a permissive default.

For example, a quote view baseline can follow related-project ownership while editing follows the preparer, and a job's permission set can separately grant broad viewing that confidentiality restrictions narrow. A project's owner is not necessarily the author of every quote on that project.

## Install

Register the default export of `@nocobase/app-plugin-authz-default-access/client` in `client/plugins.ts` and of `@nocobase/app-plugin-authz-default-access/server` in `server/plugins.ts`, beside the main authorization plugin, and run the application's migrations. Add the factory to the `plugins` of `server/config/authorization.ts`, merged with the application's other rule factories:

```ts
import { defaultAccess } from '@nocobase/app-plugin-authz-default-access/server';
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AuthorizationConfig } from '@nocobase/app-plugin-authorization/server';

const authorization: AppConfigFactory<AuthorizationConfig> = defineAppConfig(
  () => ({ plugins: [defaultAccess()] }),
);
export default authorization;
```

During setup the factory registers the settings item `authorization.default-access` (group `authorization`, actions `read`, `create`, `update`, `delete`) and its routes under `/api/authorization/defaultAccess`. Without the factory in the configuration the plugin adds no API and no route.

## Service API

Resolve `authorizationToken` from `@nocobase/app-plugin-authorization/server` in the owning provider or route factory. The rule API exists only when the factory is configured, so narrow the service before using it. `quotes` is the application's own composite and `sales.prepared` its own record access, both defined as the main Skill describes.

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
    .scope('edit', 'quotes', selection.recordAccess('sales.prepared'))
    .build(),
);
```

A rule is `{ key, resource, actions }` and each action is `{ action, scopeKey?, selection }`, where `selection` is `selection.all()`, `selection.records(ids)` or `selection.recordAccess(key, params?)`. `create`, `update(key, rule)`, `delete(key)`, `get(key)`, `list()` and `withTransaction(connection)` validate before writing. A rule on a composite names the data scope in `scopeKey` and affects only that composite action's branch; a rule on a `database.collection` omits `scopeKey` and applies across every branch that reaches the collection. Neither form shares related records implicitly or replaces field and relation capabilities, and unrestricted identities skip every rule.

The service is a trusted provisioning API. A custom HTTP caller must check the settings item with `requireSettings(authorization, 'authorization.default-access', action)` and validate the rule with `validateDataScopeRule`, both from `@nocobase/app-plugin-authorization/server/extension`, as this plugin's own handler does. Through HTTP, a rule key may not be `options`, `subjects` or `records` (`RuleKeyInput`), and a create or rename to a key another rule already uses answers `409 RULE_ALREADY_EXISTS`; a handler of its own gets the same with `assertRuleKeyAvailable` and `rethrowRuleConflict`.

## Installation seeds

Use this only after confirming the plugin is installed, registered and configured and its migrations have run. Read the main authorization Skill's `references/code-and-seeds.md` for `defineSeed`, the restricted seed context and the code/configuration boundary. Seeded rules are ordinary configuration that administrators keep editing; do not protect or re-apply them.

Build the rule with `defineDefaultAccessRule` in a portable seed-data module and persist it as a row of `authorizationDefaultAccessRules`: `id` (a fresh seed may use the key), unique `key`, `resourceType` and `resourceId` from `rule.resource`, `actions` as `JSON.stringify(rule.actions)`, `createdAt` and `updatedAt`. The table is unique on `key` and on `(resourceType, resourceId)`: check both before inserting and preserve an existing rule. Default access has no subject assignments: it applies to every holder of the action.

## Administration and acceptance

Use the existing settings page, `/settings/authorization/default-access`, for ordinary configuration; its HTTP routes are listed in the package README and each checks `settings:authorization.default-access` with `read`, `create`, `update` or `delete`. Reading options never grants write access.

Run the owning feature's route and policy tests for allowed and denied records, multiple grants and rule removal. Verify changes with a new request and inspect the same operation in Settings → Authorization → Inspector; a client snapshot does not prove that a row operation is allowed. Report the rules changed and the observed allow and deny outcomes.
