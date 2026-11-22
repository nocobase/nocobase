# Organisation subjects, sync and seeds

Part of [the organisation dimension](overview.md). The code calls [the organisation service](model-and-service.md#the-organisation-service).

## Register the department subject type

Register in the same provider's `boot` and call the returned function in `shutdown`. `label` is the descriptor helper from [one localized name](settings-page.md#one-localized-name).

```ts
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { DatabaseConnection } from '@nocobase/db';

export const DEPARTMENT_SUBJECT = 'org.department';

export function registerDepartments(
  authz: AppAuthorization,
  organization: OrganizationService,
): () => void {
  return authz.subjects.add<DatabaseConnection>(DEPARTMENT_SUBJECT, {
    // Every request recomputes this from the database.
    resolveFor: async (principal) =>
      principal.type === 'user' ? organization.departmentsOf(principal.id) : [],
    // Protected assignment checks pass their transaction; read through it.
    filterActive: (ids, transaction) =>
      organization.filterActive(ids, transaction),
    administration: {
      title: label('departments'),
      selection: {
        type: 'collection',
        list: (query) => organization.listDepartments(query),
        resolve: (ids) => organization.resolveDepartments(ids),
      },
    },
  });
}
```

- `resolveFor` returns the ids of the user's active memberships whose whole ancestor chain is active, together with those ancestors, deduplicated. A permission set assigned to a parent department therefore reaches members of its children.
- `filterActive` keeps an id only while its whole chain is active, reading through the transaction it receives.
- A department subject can hold permission sets and, when those optional plugins are installed, sharing rules and restriction rules; each reaches the members of the department and of every active department below it.
- Department heads are a second, fixed subject type registered beside this one: [department scopes and heads](scopes.md#department-heads).

## Scope business records by department

This is the record-carried scope: the record stays with its department when people move. For scopes by the owner's department, which follow the person, and for when to use each, read [department scopes and heads](scopes.md) and [permission design](permission-design.md#owner-based-or-record-carried-department).

When business records carry a `departmentId` and a data scope should follow the organisation, define a record access whose resolver reads the principal's departments from the organisation service (`authz.recordAccess.define`, see the authorization Skill's `references/business-module.md`). A resolver receives the principal, never client input. There is no `$in` operator; match a list of ids as a union of equality conditions:

```ts
import { anyScope, condition } from '@nocobase/app-plugin-authorization/server';
import { defineRecordAccess } from '@nocobase/authorization/core';

authz.recordAccess.define(
  defineRecordAccess('org.ownDepartments', (access) =>
    access
      .title('My departments')
      .collections('projects')
      .resolver(async ({ principal }) => {
        if (principal.type !== 'user') return false;
        const ids = await organization.departmentsOf(principal.id);
        // No department selects nothing, never every record.
        return ids.length
          ? anyScope(ids.map((id) => condition('departmentId', '$eq', id)))
          : false;
      }),
  ),
);
```

When the resolver answers `false` for a caller who holds the action, the policy's scope matches no rows, so the bound Repository returns an empty result; only a caller without the grant is denied. A department scope is computed for the viewer, so it never reaches another department's records. To let one department see another's records, share those specific records with the receiving department through the optional sharing-rules plugin, or, without it, grant a set that names the records, as [permission design](permission-design.md#cross-department-work-with-permission-sets-alone) describes.

## Organisation attributes feed business data scopes

A business module often scopes records by an attribute of the person, such as the region a salesperson works in, stored in its own table and read by a record access resolver. Let the organisation be the source of truth for that attribute, the way an HR sync would be: keep it on the department, and in the same transaction as every membership, primary, enable or disable, and department attribute change, re-derive it for each user the write touches and write, update or delete the business module's row. The business module stays unaware of departments; its data scope simply follows the organisation.

The helper below lives inside the organisation service and runs on the write's transaction. `regionOf` is the service's own rule: the region of the user's primary department when it has one, else that of another active department in tree order, else `null`. `salesMembers` (`id` is the user id, `region`) is the business module's table.

```ts
async function syncRegions(
  connection: DatabaseConnection,
  userIds: readonly string[],
): Promise<void> {
  for (const userId of new Set(userIds)) {
    const region = await regionOf(userId, connection);
    const existing = await connection.query
      .selectFrom('salesMembers')
      .select('region')
      .where('id', '=', userId)
      .executeTakeFirst();
    if (region === null) {
      if (existing)
        await connection.query
          .deleteFrom('salesMembers')
          .where('id', '=', userId)
          .execute();
    } else if (!existing) {
      await connection.query
        .insertInto('salesMembers')
        .values({ id: userId, region })
        .execute();
    } else if (String(existing.region) !== region) {
      await connection.query
        .updateTable('salesMembers')
        .set({ region })
        .where('id', '=', userId)
        .execute();
    }
  }
}
```

Call it with the users each write returns: the member for `addMember`, `removeMember` and `setPrimary`, every member of the subtree for `setActive`, and the department's members when `updateDepartment` changes the attribute.

## Refresh sessions after membership changes

The server resolves membership on every request, so a membership change takes effect on the next request without anything else. Clients cache their permission snapshot, so after the transaction commits, notify each affected user; never notify from inside the transaction, and never after a rollback.

```ts
async function refreshUsers(userIds: readonly string[]): Promise<void> {
  for (const id of new Set(userIds))
    await authz.permissionSets.notifyAssignmentsChanged({ type: 'user', id });
}
```

Assigning or revoking a permission set on a department needs nothing from you: an assignment change on any subject other than a user refreshes every signed-in client.

## Seeds

A seed writes an idempotent department tree and memberships, keyed on the fixed ids, parents before children, and skips rows that already exist so an administrator's later changes survive. Store seeded titles as descriptors, as [seeded titles](settings-page.md#seeded-titles-are-translation-descriptors) describes. Follow the authorization Skill's `references/code-and-seeds.md` for the permission-set rows and [migrations and seeds](../../../nocobase-app-development/references/migrations.md) for where seeds run; the permission sets themselves must already exist, created by an earlier seed.

Assign existing permission sets to departments for the access everyone there shares, and grant job roles, such as an engineer set that a department's assistant must not hold, to the people directly. Seed the business attributes the sync maintains in the same step as the memberships that imply them.

Seed only real users you know; memberships of demonstration accounts belong to demonstration data, not to production initialization. When a demonstration needs accounts, seed them with the seed's `query`: a `user` row and a `credential` `account` row whose `accountId` is the user id and whose `password` comes from `hashPassword` in `better-auth/crypto`, declared in `dependencies`. Write an account only when no user has its email, and write its memberships, direct assignments and business attributes in the same step, so a replay never re-adds what an administrator removed.

```ts
import { randomUUID } from 'node:crypto';

import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { defineSeed, type SeedDefinition } from '@nocobase/db';
import { hashPassword } from 'better-auth/crypto';

const ns = 'my-app';
const DEPARTMENTS = [
  { id: 'sales', parentId: null, region: null, sortOrder: 0 },
  { id: 'sales-east', parentId: 'sales', region: 'east', sortOrder: 0 },
];
// Access everyone in a department shares.
const DEPARTMENT_SETS = [{ departmentId: 'sales', key: 'sales-assistant' }];
// Demonstration data only.
const ACCOUNTS = [
  {
    name: 'Alice',
    email: 'alice@demo.test',
    memberships: [{ departmentId: 'sales-east', primary: true }],
    permissionSets: ['sales-engineer'], // a job role, granted directly
    region: 'east',
  },
];

const seed: SeedDefinition = defineSeed({
  name: '202610010002_seed_organization',
  transaction: true,
  async run({ query }) {
    const now = new Date();
    async function assign(
      permissionSetKey: string,
      subjectType: string,
      subjectId: string,
    ): Promise<void> {
      const set = await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', permissionSetKey)
        .executeTakeFirst();
      if (!set) return; // Never write a dangling assignment.
      const existing = await query
        .selectFrom('authorizationPermissionSetAssignments')
        .select('id')
        .where('permissionSetKey', '=', permissionSetKey)
        .where('subjectType', '=', subjectType)
        .where('subjectId', '=', subjectId)
        .executeTakeFirst();
      if (existing) return;
      await query
        .insertInto('authorizationPermissionSetAssignments')
        .values({
          id: randomUUID(),
          permissionSetKey,
          subjectType,
          subjectId,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }

    for (const department of DEPARTMENTS) {
      const existing = await query
        .selectFrom('departments')
        .select('id')
        .where('id', '=', department.id)
        .executeTakeFirst();
      if (existing) continue;
      await query
        .insertInto('departments')
        .values({
          ...department,
          title: encodeAuthorizationTitle({
            key: `departments.${department.id}`,
            ns,
          }),
          active: true,
        })
        .execute();
    }
    for (const { departmentId, key } of DEPARTMENT_SETS)
      await assign(key, 'org.department', departmentId);

    let password: string | undefined;
    for (const account of ACCOUNTS) {
      const existing = await query
        .selectFrom('user')
        .select('id')
        .where('email', '=', account.email)
        .executeTakeFirst();
      if (existing) continue; // Leave an existing account and its access alone.
      const userId = randomUUID();
      password ??= await hashPassword('demo-password');
      await query
        .insertInto('user')
        .values({
          id: userId,
          name: account.name,
          email: account.email,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      await query
        .insertInto('account')
        .values({
          id: randomUUID(),
          accountId: userId,
          providerId: 'credential',
          userId,
          password,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      for (const membership of account.memberships)
        await query
          .insertInto('departmentMembers')
          .values({ id: randomUUID(), userId, ...membership, active: true })
          .execute();
      for (const key of account.permissionSets)
        await assign(key, 'user', userId);
      if (account.region)
        await query
          .insertInto('salesMembers')
          .values({ id: userId, region: account.region })
          .execute();
    }
  },
});

export default seed;
```

Seeding sharing or restriction rule assignments to a department follows the same check-then-insert shape against the rule plugin's assignment table, as its installed Skill describes, with `subjectType: 'org.department'`. Those plugins are optional: probe their Collection first and skip the rows when it is missing, as [provision with optional rule plugins](scopes.md#provision-with-optional-rule-plugins) shows.

## Positions and roles

When access also follows a position or a role, model it like departments: its own table, memberships with `active`, and its own subject type such as `org.position`, flat and without ancestors, registered the same way. What a role may do is expressed only by permission sets assigned to that subject type. Never build a separate role-to-permission table; it would bypass the workspace, the inspector and the rule plugins.
