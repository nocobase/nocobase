---
name: nocobase-app-plugin-authz-sharing-rules
description: Design, implement and verify sharing rules for NocoBase 3 business operations, including named data scopes and production administration.
---

# Develop sharing rules

A sharing rule adds selected records, or a record access selection, for the subjects it lists, provided they already hold the action. Sharing does not grant the operation, fields, page access or related records, and it cannot select all records. Grants, default access and sharing combine first; restriction rules then narrow the result.

Read the installed `nocobase-app-plugin-authorization` Skill first for composite resources, data scopes, fields, server policy enforcement and inherited subjects. The package README at `node_modules/@nocobase/app-plugin-authz-sharing-rules/README.md` is the complete reference for the service, the HTTP routes and the exports; this Skill covers how to use them.

For sharing between departments, read the application development Skill's `references/organization/permission-design.md` first. A rule whose recipient is a department shares specific records with it; a viewer-relative department scope such as 本部门及下属部门 is computed for the viewer and cannot select another department's records. The guide's optional sharing section covers this plugin, and its core section says what remains with permission sets alone.

## Development workflow

1. Identify the real collaboration exception: who receives which records, for which actions, and why. Use explicit records for one handover; use a record access selection for a maintained region or team rule.
2. Grant the recipients the business action through a permission set first. Register inherited subjects and their active membership resolver through the main authorization Skill.
3. Inspect every data scope the operation requires. Quote submission needs the selected quote and its actual parent project. Add each action and data scope deliberately; view, edit and submit are different permissions.
4. Save a complete rule through the settings page or the service. Keep record ids tied to their data scope's collection and preserve the other entries on update.
5. Verify the handover works, an unshared parent still blocks the workflow, restrictions still exclude confidential records, and sharing alone cannot activate a missing operation.
6. Revoke the recipient or the team's permission set and verify the next request loses only that source. Independent direct-user sharing and direct assignments must survive.

For example, a quote handover shares quote edit and submit plus the parent project's submit scope with a delegated engineer. Use the real record ids, never sample ones.

## Install

Register the default export of `@nocobase/app-plugin-authz-sharing-rules/client` in `client/plugins.ts` and of `@nocobase/app-plugin-authz-sharing-rules/server` in `server/plugins.ts`, beside the main authorization plugin, and run the application's migrations. Add the factory to the `plugins` of `server/config/authorization.ts`, merged with the application's other rule factories:

```ts
import { sharingRules } from '@nocobase/app-plugin-authz-sharing-rules/server';
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AuthorizationConfig } from '@nocobase/app-plugin-authorization/server';

const authorization: AppConfigFactory<AuthorizationConfig> = defineAppConfig(
  () => ({ plugins: [sharingRules()] }),
);
export default authorization;
```

During setup the factory registers the settings item `authorization.sharing-rules` (group `authorization`, actions `read`, `create`, `update`, `delete`) and its routes under `/api/authorization/sharingRules`. Without the factory in the configuration the plugin adds no API and no route.

## Service API

Resolve `authorizationToken` from `@nocobase/app-plugin-authorization/server` in the owning provider or route factory. The rule API exists only when the factory is configured, so narrow the service before using it. `quotes` is the application's own composite and `org.team` its own subject type, both defined as the main Skill describes.

```ts
import { selection } from '@nocobase/authorization/core';
import {
  defineSharingRule,
  type SharingRulesAuthorizationApi,
} from '@nocobase/authorization/sharing-rules';
import type { DatabaseConnection } from '@nocobase/db';

if (!('sharingRules' in authz))
  throw new Error('Sharing rules is not configured');
const rules = (
  authz as typeof authz & SharingRulesAuthorizationApi<DatabaseConnection>
).sharingRules;

await rules.create(
  defineSharingRule('proposal-handover', quotes.reference())
    .title('Proposal handover')
    .subjects({ type: 'org.team', id: 'proposal' })
    .scope('edit', 'quotes', selection.records(['quote-7']))
    .scope('submit', 'quotes', selection.records(['quote-7']))
    .scope('submit', 'projects', selection.records(['project-3']))
    .reason('Delegate this proposal to the team')
    .build(),
);
```

A rule is `{ key, resource, actions, title?, subjects, reason? }` and each action is `{ action, scopeKey?, selection }`, where `selection` is `selection.records(ids)` or `selection.recordAccess(key, params?)`; `all` is refused. `create`, `update(key, rule)`, `delete(key)`, `get(key)`, `list()` and `withTransaction(connection)` validate before writing. A rule on a composite names the data scope in `scopeKey` and affects only that composite action's branch; a rule on a `database.collection` omits `scopeKey` and applies across every branch that reaches the collection. Neither form shares related records implicitly or replaces field and relation capabilities, and unrestricted identities skip every rule.

The service is a trusted provisioning API. A custom HTTP caller must check the settings item with `requireSettings(authorization, 'authorization.sharing-rules', action)` and validate the rule with `validateDataScopeRule`, both from `@nocobase/app-plugin-authorization/server/extension`, as this plugin's own handler does. Through HTTP, a rule key may not be `options`, `subjects` or `records` (`RuleKeyInput`) and `SubjectsInput`, which refuses a subject listed twice, and a create or rename to a key another rule already uses answers `409 RULE_ALREADY_EXISTS`; a handler of its own gets the same with `assertRuleKeyAvailable` and `rethrowRuleConflict`.

## Installation seeds

Use this only after confirming the plugin is installed, registered and configured and its migrations have run. Read the main authorization Skill's `references/code-and-seeds.md` for `defineSeed`, the restricted seed context and the code/configuration boundary. Seeded rules are ordinary configuration that administrators keep editing; do not protect or re-apply them.

Build the rule with `defineSharingRule` in a portable seed-data module and persist it in two tables:

| Table                                 | Columns                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `authorizationSharingRules`           | `id`, unique `key`, `title` (`encodeAuthorizationTitle`), `resourceType`, `resourceId`, JSON `actions`, `reason`, timestamps |
| `authorizationSharingRuleAssignments` | `id`, `sharingRuleId`, `subjectType`, `subjectId`, `createdAt`                                                               |

`sharingRuleId` references the rule row's `id`; a fresh seed may use the key as the id, but a rerun must use the existing row's id. Each `.subjects(...)` entry becomes an assignment row, not part of `actions`. Create the referenced principals, teams and business records first, check the key and each rule/subject pair before inserting, and write the rule with its assignments in one transaction.

## Administration and acceptance

Use the existing settings page, `/settings/authorization/sharing-rules`, and its subject and record pickers for ordinary configuration; its HTTP routes are listed in the package README and each checks `settings:authorization.sharing-rules` with `read`, `create`, `update` or `delete`. Reading options never grants write access.

Run the owning feature's route and policy tests for allowed and denied records, multiple grants and rule removal. Verify changes with a new request and inspect the same operation in Settings → Authorization → Inspector; a client snapshot does not prove that a row operation is allowed. Report the rules and subjects changed and the observed allow and deny outcomes.
