# Design application permissions

Use this reference when a feature distinguishes people, jobs, teams, pages, operations, fields or records. Model access while designing the feature; hiding buttons over unrestricted endpoints leaves the system incomplete. The [authorization plugin Skill](../../nocobase-app-plugin-authorization/SKILL.md) owns the permission model: the responsibility matrix, model versus configuration changes, declarations, route enforcement, client checks, the permission editor, the operation-to-permission map and verification. This page keeps only what is specific to an application.

## Discover the capability

Inspect `package.json`, `client/plugins.ts`, `server/plugins.ts` and `server/config/authorization.ts`, then read the installed `.agents/skills/nocobase-app-plugin-authorization/SKILL.md`. If installed Skills are stale, run `pnpm nocobase skills sync`; do not edit generated copies. Check registration separately from dependency presence.

Default access, sharing rules and restriction rules are optional plugins; read their installed Skills when the requirement calls for a common baseline, collaboration exception or record exclusion ([optional capabilities](../../nocobase-app-plugin-authorization/references/optional-capabilities.md)). If the Skill is absent, the capability is unsupported in this App: say so, and do not assume its APIs, tables or seed format, or install it without asking.

## Where the pieces live in the application

| Piece                                                                      | Application location                                                                             | Contract                                                                                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collection, composite, record-access, settings and workspace registrations | The feature's provider in `server/providers/`, resolving `authorizationToken`                    | [Implement in this order](../../nocobase-app-plugin-authorization/SKILL.md#implement-in-this-order), [fluent declarations](../../nocobase-app-plugin-authorization/references/fluent-registration.md) |
| Endpoint enforcement                                                       | Every endpoint in `server/routes/` installs authentication and authorization                     | [Repository route integration](../../nocobase-app-plugin-authorization/references/repository-routes.md)                                                                                               |
| Page grants                                                                | `authz` on the first page of every path in `client/routes.ts`; `useCan` for buttons              | [Client development](../../nocobase-app-plugin-authorization/references/client-development.md)                                                                                                        |
| Role editor catalog                                                        | `client/pages/settings/permission-workspace.ts`, composed with the permission UI Registry        | [Three-tab role editor](#configure-the-three-tab-role-editor), [role list presentation](system-settings.md#role-list-presentation)                                                                    |
| Initial configuration                                                      | Idempotent seeds for fresh installs, authorized services for existing ones; schema in migrations | [Code versus seeds](../../nocobase-app-plugin-authorization/references/code-and-seeds.md)                                                                                                             |
| Departments or teams as inherited subjects                                 | Application-owned organisation model                                                             | [Organisation dimension](../../nocobase-app-plugin-authorization/references/organization/overview.md)                                                                                                 |

Keep permission declarations with the feature that owns them: in the App for application-owned features, or in the plugin when the feature is a plugin. For an executable application-owned example of scoped relation choices and batch assignments, see the [customer/contact reference](frontend/references/executable-relation-batch.md).

## Configure the three-tab role editor

When you add business permissions, update the application's `permissionWorkspaceSelection` in `client/pages/settings/permission-workspace.ts`. Follow the authorization Skill's [three-tab role editor setup](../../nocobase-app-plugin-authorization/references/client-development.md#configure-the-three-tab-role-editor) for menu-to-object mappings, View scope limits, action descriptions and scope titles. The [waybill example](../../nocobase-app-plugin-authorization/references/client-development.md#example-create-a-waybill-with-scoped-related-records) covers Create with existing related records. Use `filterFieldTitles` for localized filter captions keyed by collection and field, as in the templates' workspace selection.

Test with an ordinary user: confirm menu access, each operation and its effective scope independently. Save and reload the role to verify hidden grants survive a name-only edit. Exercise direct API denials as described in the [authorization verification guide](../../nocobase-app-plugin-authorization/references/business-module.md#7-client-and-verification).

## Seed parameterized Custom Filter scopes

Use `buildFilter(...).root` as `params.filter` when seeding a [parameterized Custom Filter scope](../../nocobase-app-plugin-authorization/references/core-api.md#parameterized-record-scopes-in-administration).

Declare the value in `database/seed-data/permission-sets.ts` using the `waybills` resource from the linked example. Its provider registers the resource at app boot. The role below grants View for one origin site. When applying the same filter to additional actions, use their declared scope slots and retain all existing related-object grants and scope selections.

```ts
import { selection } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { buildFilter } from '@nocobase/repository-input';
import { waybills } from '../../server/waybill-resources.js';

const params = {
  filter: buildFilter((f) => f.string('originSiteId').eq('north-site')).root,
};
const northSiteWaybills = selection.recordAccess('customFilter', params);

export const northDispatcher = definePermissionSet('tms-north-dispatcher')
  .title('North dispatcher')
  .grant(waybills.reference().grant({ view: { waybills: northSiteWaybills } }))
  .build();
```

Persist the value through the [permission-set seed lifecycle](../../nocobase-app-plugin-authorization/references/code-and-seeds.md). Rename the role, reload it and verify its filter parameters survive. Sign in as the assigned dispatcher and verify that View returns only the selected site's waybills and that any other configured actions still enforce their scopes.

## Verify write refusals

Use the [standard API errors](http-api.md#errors) and the [lifecycle route's error conversion](lifecycle.md#4-the-record-routes). For duplicate creation, declare a unique constraint on the business key in a migration. Catch `isUniqueConstraintViolation` from `@nocobase/db` outside the write transaction and answer with `ApiError` (`ALREADY_EXISTS`). Test duplicate creation, stale expected versions and invalid lifecycle states against the running application. Verify that each refusal leaves records, versions, transition history and effects intact.

## Initial administrator

For a custom initial administrator, configure `users.initialAdmin` before the first seed run; see the authentication plugin Skill for its username/password contract. Omitting the node preserves the legacy account. The authentication seed creates the account only in an empty user table, and the authorization seed assigns root using the same configured username. Do not reset credentials at startup.

## Visible and manageable assignments

Default to named users selected through User management → Assign roles. Do not infer that all signed-in users should inherit a new business role. In particular, never seed a business permission set onto `authenticated:*`, add business grants to the platform member role, or reapply assignments at startup to make a feature accessible. A role editor lists that role's grants; unchecked actions are not denials of grants inherited from other sources. Inspect effective assignments before interpreting a permission test.

A global default is supported only when the user explicitly requests it and the application delivers an authorized administration control to inspect its recipient population, change the default role and revoke that assignment. User access details must distinguish direct roles from inherited roles and link to the source. If those controls are unavailable, explain the limitation and use explicit user assignments instead. Never invent a configuration flag, seed-only setting or undocumented SQL instruction as the administrator's normal adjustment interface.

Retain and run `pnpm exec vitest run tests/server/authorization-assignment-safety.test.ts` from the template. The test starts the real application on an isolated database, including registered migrations/seeds, and checks actual global assignments and member grants rather than searching source literals. When adding a genuinely requested global default, extend the expected baseline narrowly only after delivering the management UI and testing its visibility, update, revocation and authorization. Record that deliberate exception with the feature's tests; never delete or skip the guard. This test covers initialized state, not every later administrative write or custom subject resolver; also test effective access and direct API denials with ordinary identities.

## Explain the result

Explain to the user which business decisions were implemented, which settings they can maintain and which changes require development. Use the authorization Skill’s bundled quote/project/delivery workflow as the implementation reference, but do not copy demo credentials, fixed record IDs or reset endpoints into the App.
