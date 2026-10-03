# Subjects, configuration and administration

## Inherited teams or departments

When the application has no organisation model yet, build it with the application development Skill's `references/organization.md`; this section covers only the subject registration contract. To decide which sets go to departments, to department heads as a derived fixed subject, or to people, and which department data scope each grant uses, read that Skill's `references/organization/permission-design.md`; it works with permission sets alone and marks what needs a rule plugin.

Register the type through `authz.subjects.add('org.team', { resolveFor, filterActive, administration })` in provider boot and call the function it returns on shutdown. `resolveFor(principal)` returns membership IDs from the authoritative team service; `filterActive(ids, transaction?)` excludes inactive/deleted teams. Use the passed transaction when reading validity during protected assignment changes. The registration below is a minimal flat team. It assumes the feature owns `teams` (id, title, active) and `teamMembers` (userId, teamId); adapt those table names to the customer model.

```ts
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import { buildFilter } from '@nocobase/repository-input';

export const TEAM_SUBJECT = 'org.team';
const TEAMS = 'teams';

export function registerTeams(
  authz: AppAuthorization,
  database: DatabaseManager,
): () => void {
  return authz.subjects.add<DatabaseConnection>(TEAM_SUBJECT, {
    async resolveFor(principal) {
      if (principal.type !== 'user') return [];
      const memberships = await database
        .connection()
        .query.selectFrom('teamMembers')
        .select('teamId')
        .where('userId', '=', principal.id)
        .execute();
      return memberships.map((row) => String(row.teamId));
    },
    async filterActive(ids, transaction) {
      if (!ids.length) return [];
      const rows = await (transaction ?? database.connection()).query
        .selectFrom(TEAMS)
        .select('id')
        .where('active', '=', true)
        .where('id', 'in', ids)
        .execute();
      return rows.map((row) => String(row.id));
    },
    administration: {
      title: 'Teams',
      selection: {
        type: 'collection',
        async list({ search, page, pageSize }) {
          const teams = database.repository<{
            id: string;
            title: string;
            active: boolean;
          }>(TEAMS);
          const filter = buildFilter((f) =>
            f.and([
              f.boolean('active').isTrue(),
              ...(search
                ? [f.string('title').includes(search, { mode: 'insensitive' })]
                : []),
            ]),
          );
          const [rows, total] = await Promise.all([
            teams.findMany({
              filter,
              select: (s) => s.fields('id', 'title'),
              sort: (s) => [s.field('title').asc(), s.field('id').asc()],
              offset: (page - 1) * pageSize,
              limit: pageSize,
            }),
            teams.count({ filter }),
          ]);
          return {
            items: rows.map((row) => ({
              id: row.id,
              title: row.title,
            })),
            total,
          };
        },
        async resolve(ids) {
          if (!ids.length) return [];
          const rows = await database
            .connection()
            .query.selectFrom(TEAMS)
            .select(['id', 'title'])
            .where('active', '=', true)
            .where('id', 'in', ids)
            .orderBy('id', 'asc')
            .execute();
          return rows.map((row) => ({
            id: String(row.id),
            title: String(row.title),
          }));
        },
      },
    },
  });
}
```

Store the returned unregister callback in the owning provider and call it on shutdown.

The App middleware adds `authenticated:*` and resolves active memberships for authenticated users. User inspection uses the resolver too. Background jobs/tests that call `authz.for(identity)` must explicitly supply verified subjects; never trust client-submitted memberships. Direct inspection of a team describes the team itself, not the union of its users.

Expose `administration: { title, selection }` for assignment and rule pickers. A collection selection implements `list({ search, page, pageSize }, { authz })` returning `{ items, total }`, and `resolve(ids, { authz })` returning `{ id, title, description? }[]`; `title` and `description` may be plain text or a `{ key, ns }` translation descriptor, rendered in the viewer's language. The calling endpoint checks the management permission. Enforce additional directory read authorization and row constraints in both callbacks only when the directory has those independent requirements; ordinary management pickers need no extra capability. Fixed audiences use `{ type: 'fixed', id: '*' }`. Picker access does not authorize saving assignments; preserve inaccessible stored subjects by ID instead of silently dropping them.

Test direct and inherited grants together. Removing a membership, disabling a team or revoking its permission set must stop inherited access on a new request while preserving independent direct grants. The server re-evaluates membership on each request, so membership changes affect only client freshness: call `authz.permissionSets.withTransaction(connection).notifyAssignmentsChanged({ type: 'user', id })` inside the membership transaction for each affected user; it refreshes that user's clients once the transaction commits. Outside a transaction, call the unbound `authz.permissionSets.notifyAssignmentsChanged` after the write. An assignment change on any non-user subject already refreshes every client.

## Choose scope mechanisms deliberately

The rule mechanisms below are optional. Follow [capability discovery](optional-capabilities.md) and read the owning installed Skill before choosing one; missing Skills mean separate development is required.

| Business requirement                               | Mechanism                      | Verify                                                                   |
| -------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| A job can submit quotes                            | Permission-set business action | A sharing-only user is still denied                                      |
| Every holder can consult public reference records  | Default access                 | Baseline does not unintentionally widen write scope                      |
| A selected team collaborates on a delegated record | Sharing rule                   | Grant each necessary action/scope, including parent access               |
| Confidential records must remain excluded          | Restriction rule               | Sharing and additional sets cannot reopen them at the protected boundary |
| A record's ownership follows its project           | Custom record access           | Actual parent/membership data determines scope                           |

Positive selections from permission sets, default access and sharing combine; restrictions intersect them. A grant whose data scope selects nothing can still obtain default access and sharing. A restriction is the set of records still allowed, not a list of records to deny. A rule on a composite matches one action and data scope branch; a rule on a `database.collection` covers every branch. Relation targets do not automatically inherit standalone target restrictions. Root/unrestricted users bypass these constraints, so they are unsuitable for testing ordinary boundaries.

Use each installed rule Skill for integration, APIs and initialization. Runtime routes use these services, not direct table writes. Controlled installation seeds follow [code and seeds](code-and-seeds.md). Do not add a parallel roles implementation or silently enable an absent plugin.

## Permission-set lifecycle

Use `create`, `update`, `assign`, `revoke` and `replaceSubjectAssignments`; updates contain the complete definition. For user-management editors, pass the explicit `managedPermissionSets` subset so unrelated assignments survive. Let ordinary administrators use the existing permission workspace rather than creating a second editor.

Code-owned sets can declare `authz.permissionSets.protect({ owner, keys, allow, requireActiveAssignment, assignableTo, unrestricted })`. Generic management enforces protection and forbids changing protected keys, including renaming another set onto a protected key. Default-set title and grant edits remain available when allowed. Trusted owner APIs intentionally bypass generic write protection; explicitly call `assertWritable` when exposing another management surface. Root is unrestricted and assignable only to user accounts in the App integration.

`revoke` and `replaceSubjectAssignments` run in the database store's transaction. For disabling or deleting a user, bind `authz.permissionSets.withTransaction(connection)`, call `assertSubjectRemovable(subject)`, and perform the user mutation in that same transaction. Call `notifyAssignmentsChanged(subject)` on the bound API in that transaction; it publishes only after a successful commit. Test simultaneous removals as well as the single remaining administrator; the invariant is at least one active assignment, not merely one stored row.

## Settings development

An administration surface is a settings item: register it with `authz.settings.add({ id, title, section?, actions })`, grant it with `authz.settings.grant(id, actions)`, declare `authz: { resource: { type: 'settings', id }, action }` on its settings route and check the matching action on every endpoint. Separate read from create, update, delete and other write actions according to actual operations. Registration makes the item grantable; a permission-set assignment grants it.

When building an authorization extension, such as a rule plugin, use the exported `@nocobase/app-plugin-authorization/client/management` components and `@nocobase/app-plugin-authorization/server/extension` helpers: `requireSettings(authorization, id, action)` with the full settings id, `createRuleSupportRoutes(authz, rule)` for options, subjects and records, and `authz.routes.add(path, createRouteHandler(router))`. Resolve the application API client inside hooks and components; never create a module-level fallback client. Keep the owner responsible for validation, translations, transactions and persistence.

Follow the bundled [client and settings workflow](client-development.md#settings-screens) and [settings items](runtime-api.md#settings-items).

## Diagnose and accept

1. Check installed plugins, collection and composite registration, and action and data scope spelling. A catalog item or action nobody registered is denied with `RESOURCE_ACTION_NOT_SUPPORTED`.
2. Inspect the verified principal, authenticated audience, active memberships and effective permission-set assignments.
3. Evaluate the same resource and action as the endpoint with the request context's `authorize`, including params when required, and read its `reasons`.
4. Inspect each collection's policy and the applied default/sharing/restriction sources. Confirm the endpoint binds those policies rather than recomputing broader ones.
5. Inspect workflow state and relation target constraints separately from the grant decision.

The Settings inspector requires `settings:authorization.inspector` `inspect`. It reports decisions and sources, not accessible-record counts. Client snapshots and configured-permission shields indicate visibility/configuration, not proof that a particular record can be changed. Include direct API denials, revocation, rollback, session switching and pending checks in acceptance evidence.
