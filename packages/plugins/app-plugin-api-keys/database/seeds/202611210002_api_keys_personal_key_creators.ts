import { defineSeed, type SeedDefinition } from '@nocobase/db';

/** The role that lets a person create API keys of their own, and nothing else. */
const ROLE = 'personal-api-key-creators';
const GRANTS = [
  {
    resource: { type: 'settings', id: 'personalApiKeys' },
    actions: [{ action: 'create' }],
  },
];
const BATCH = 200;

/**
 * Creating API keys of one's own now takes `settings:personalApiKeys/create` from a role, where before every signed-in
 * person could. So nobody loses it on upgrade, this creates a role holding only that permission and assigns it, user by
 * user, to every person the installation has now: never a service account, never every signed-in user at once, and never
 * through the built-in member role, which stays empty. People added later get it from an administrator. Run again, it
 * adds only what is missing and keeps an administrator's changes to the role; without the authorization plugin's tables
 * there are no roles, and nothing to do.
 */
const seed: SeedDefinition = defineSeed({
  name: '202611210002_api_keys_personal_key_creators',
  transaction: false,

  async run({ query }) {
    let role: { key: unknown } | undefined;
    try {
      role = await query
        .selectFrom('authorizationPermissionSets')
        .select(['key'])
        .where('key', '=', ROLE)
        .executeTakeFirst<{ key: unknown }>();
    } catch {
      return;
    }
    const now = new Date();
    if (!role)
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: crypto.randomUUID(),
          key: ROLE,
          title: JSON.stringify({
            key: 'roles.personalKeyCreators',
            ns: '@nocobase/app-plugin-api-keys',
          }),
          grants: JSON.stringify(GRANTS),
          revision: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    let after = '';
    for (;;) {
      const users = await query
        .selectFrom('user')
        .select(['id', 'kind'])
        .where('deletedAt', 'is', null)
        .where('id', '>', after)
        .orderBy('id')
        .limit(BATCH)
        .execute();
      if (!users.length) break;
      after = String(users.at(-1)!.id);
      const people = users
        .filter((user) => user.kind !== 'service')
        .map((user) => String(user.id));
      if (!people.length) continue;
      const existing = await query
        .selectFrom('authorizationPermissionSetAssignments')
        .select('subjectId')
        .where('subjectType', '=', 'user')
        .where('permissionSetKey', '=', ROLE)
        .where('subjectId', 'in', people)
        .execute();
      const assigned = new Set(existing.map((row) => String(row.subjectId)));
      const missing = people
        .filter((id) => !assigned.has(id))
        .map((id) => ({
          id: `user:${id}:${ROLE}`,
          subjectType: 'user',
          subjectId: id,
          permissionSetKey: ROLE,
          createdAt: now,
          updatedAt: now,
        }));
      if (missing.length)
        await query
          .insertInto('authorizationPermissionSetAssignments')
          .values(missing)
          .execute();
    }
  },
});

export default seed;
