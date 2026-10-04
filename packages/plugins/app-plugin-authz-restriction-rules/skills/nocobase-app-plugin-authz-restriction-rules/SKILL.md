---
name: nocobase-app-plugin-authz-restriction-rules
description: Design, implement and verify restriction rules for NocoBase 3 business operations, including named data scopes and production administration.
---

# Develop restriction rules

A restriction rule intersects the records an action reaches with the rule's selection, for the subjects it lists. The selection describes the records still allowed, not the records to hide. Several matching restrictions all apply; none can grant an action or widen a range.

Read the installed `nocobase-app-plugin-authorization` Skill first for composite resources, data scopes, fields, server policy enforcement and inherited subjects. The package README at `node_modules/@nocobase/app-plugin-authz-restriction-rules/README.md` is the complete reference for the service, the HTTP routes and the exports; this Skill covers how to use them.

For a restriction assigned to a department, or to the root department for the whole company, read the application development Skill's `references/organization/permission-design.md` first. Its core works with permission sets alone and says how to keep excluded records out without this plugin; its optional restriction section covers this one.

## Development workflow

1. State the invariant positively, for example "this team may access only non-confidential projects". Define who it applies to and whether it covers one operation or every path to a collection.
2. Use a rule on a composite, with `scopeKey`, for an operation-specific limit. For a limit across every business branch, create a rule on the `database.collection` with its CRUD actions; the settings page offers declared business data scopes, and collection-wide invariants can be provisioned through the service.
3. Register a suitable record access and save the complete rule. Apply the restriction directly to a user as well when it must remain after that person's team membership is removed.
4. Bind policies on all protected reads and writes. For relation targets, declare relation record access explicitly; a standalone collection restriction is not inherited by nested relation writes.
5. Verify the excluded row stays inaccessible after adding broad sharing and another permission set, across each protected operation, and that unrelated actors keep their intended access.

For example, a confidentiality restriction assigned directly to each account holds whichever permission set grants the action. Test with ordinary users: unrestricted identities skip every rule.

## Install

Register the default export of `@nocobase/app-plugin-authz-restriction-rules/client` in `client/plugins.ts` and of `@nocobase/app-plugin-authz-restriction-rules/server` in `server/plugins.ts`, beside the main authorization plugin, and run the application's migrations. Add the factory to the `plugins` of `server/config/authorization.ts`, merged with the application's other rule factories:

```ts
import { restrictionRules } from '@nocobase/app-plugin-authz-restriction-rules/server';
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AuthorizationConfig } from '@nocobase/app-plugin-authorization/server';

const authorization: AppConfigFactory<AuthorizationConfig> = defineAppConfig(
  () => ({ plugins: [restrictionRules()] }),
);
export default authorization;
```

During setup the factory registers the settings item `authorization.restriction-rules` (group `authorization`, actions `read`, `create`, `update`, `delete`) and its routes under `/api/authorization/restrictionRules`. Without the factory in the configuration the plugin adds no API and no route.

## Service API

Resolve `authorizationToken` from `@nocobase/app-plugin-authorization/server` in the owning provider or route factory. The rule API exists only when the factory is configured, so narrow the service before using it. `quotes` is the application's own composite, `sales.public` its own record access and `org.team` its own subject type, all defined as the main Skill describes.

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
    .subjects({ type: 'org.team', id: 'proposal' })
    .scope('submit', 'quotes', selection.recordAccess('sales.public'))
    .reason('Proposal collaboration excludes confidential work')
    .build(),
);
```

A rule is `{ key, resource, actions, title?, subjects, reason? }` and each action is `{ action, scopeKey?, selection }`, where `selection` is `selection.all()`, `selection.records(ids)` or `selection.recordAccess(key, params?)`. `create`, `update(key, rule)`, `delete(key)`, `get(key)`, `list()` and `withTransaction(connection)` validate before writing. A rule on a composite names the data scope in `scopeKey` and narrows only that composite action's branch; a rule on a `database.collection` omits `scopeKey` and narrows every branch that reaches the collection.

The service is a trusted provisioning API. A custom HTTP caller must check the settings item with `requireSettings(authorization, 'authorization.restriction-rules', action)` and validate the rule with `validateDataScopeRule`, both from `@nocobase/app-plugin-authorization/server/extension`, as this plugin's own handler does. Through HTTP, a rule key may not be `options`, `subjects` or `records` (`RuleKeyInput`) and `SubjectsInput`, which refuses a subject listed twice, and a create or rename to a key another rule already uses answers `409 RULE_ALREADY_EXISTS`; a handler of its own gets the same with `assertRuleKeyAvailable` and `rethrowRuleConflict`.

## Installation seeds

Use this only after confirming the plugin is installed, registered and configured and its migrations have run. Read the main authorization Skill's `references/code-and-seeds.md` for `defineSeed`, the restricted seed context and the code/configuration boundary. Seeded rules are ordinary configuration that administrators keep editing; do not protect or re-apply them.

Build the rule with `defineRestrictionRule` in a portable seed-data module and persist it in two tables:

| Table                                     | Columns                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `authorizationRestrictionRules`           | `id`, unique `key`, `title` (`encodeAuthorizationTitle`), `resourceType`, `resourceId`, JSON `actions`, `reason`, timestamps |
| `authorizationRestrictionRuleAssignments` | `id`, `restrictionRuleId`, `subjectType`, `subjectId`, `createdAt`                                                           |

`restrictionRuleId` references the rule row's `id`; a fresh seed may use the key as the id, but a rerun must use the existing row's id. Each `.subjects(...)` entry becomes an assignment row, not part of `actions`. Create the referenced principals and teams first, check the key and each rule/subject pair before inserting, and write the rule with its assignments in one transaction.

## Administration and acceptance

Use the existing settings page, `/settings/authorization/restriction-rules`, and its subject and record pickers for ordinary configuration; its HTTP routes are listed in the package README and each checks `settings:authorization.restriction-rules` with `read`, `create`, `update` or `delete`. Reading options never grants write access.

Run the owning feature's route and policy tests for allowed and denied records, multiple grants and rule removal. Verify changes with a new request and inspect the same operation in Settings → Authorization → Inspector; a client snapshot does not prove that a row operation is allowed. Report the rules and subjects changed and the observed allow and deny outcomes.
