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
/** How many keys to try when an application already has roles named like this one. */
const MAX_KEYS = 20;

/** The id this seed gives a role it creates, so a later run recognizes it and never mistakes another for it. */
const ownId = (key: string) => `api-keys.seed:${key}`;

/**
 * Whether an error says the table does not exist, in any supported dialect: the authorization plugin is not installed.
 * Every other failure, such as a lost connection, is not this.
 */
function isMissingTable(error: unknown): boolean {
  for (let current = error; current;) {
    if (typeof current !== 'object') return false;
    const code: unknown = Reflect.get(current, 'code');
    const errno: unknown = Reflect.get(current, 'errno');
    const number: unknown = Reflect.get(current, 'number');
    const message: unknown = Reflect.get(current, 'message');
    if (
      code === '42P01' || // PostgreSQL: undefined_table
      code === 'ER_NO_SUCH_TABLE' || // MySQL and MariaDB
      errno === 1146 ||
      number === 208 || // SQL Server: invalid object name
      Reflect.get(current, 'errorNum') === 942 || // Oracle: ORA-00942
      (typeof message === 'string' && /no such table|ORA-00942/u.test(message)) // SQLite, Oracle
    )
      return true;
    current = Reflect.get(current, 'cause');
  }
  return false;
}

const parse = (value: unknown): unknown => {
  let parsed = value;
  while (typeof parsed === 'string') parsed = JSON.parse(parsed) as unknown;
  return parsed;
};

/**
 * Creating API keys of one's own now takes `settings:personalApiKeys/create` from a role, where before every signed-in
 * person could. So nobody loses it on upgrade, this creates a role holding only that permission and assigns it, user by
 * user, to every person the installation has now: never a service account, never every signed-in user at once, and
 * never through the built-in member role, which stays empty. People added later get it from an administrator.
 *
 * Only a role this seed created, still holding exactly that permission, is assigned: a role of the application's that
 * happens to have the same key is left as it is, with its assignments, and the seed uses the next free key. Without the
 * authorization plugin's tables there are no roles, and nothing to do; any other failure is thrown, so the upgrade is
 * not recorded as done and runs again. A run that stopped half way finishes on the next one, adding only what is missing.
 */
const seed: SeedDefinition = defineSeed({
  name: '202611210002_api_keys_personal_key_creators',
  transaction: false,

  async run({ query }) {
    const find = (key: string) =>
      query
        .selectFrom('authorizationPermissionSets')
        .select(['id', 'grants'])
        .where('key', '=', key)
        .executeTakeFirst<{ id: unknown; grants: unknown }>();
    let role: string | undefined;
    for (let index = 0; index < MAX_KEYS && !role; index += 1) {
      const key = index === 0 ? ROLE : `${ROLE}-${index + 1}`;
      let existing: { id: unknown; grants: unknown } | undefined;
      try {
        existing = await find(key);
      } catch (error) {
        if (isMissingTable(error)) return;
        throw error;
      }
      if (!existing) {
        const now = new Date();
        await query
          .insertInto('authorizationPermissionSets')
          .values({
            id: ownId(key),
            key,
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
        role = key;
      } else if (
        existing.id === ownId(key) &&
        JSON.stringify(parse(existing.grants)) === JSON.stringify(GRANTS)
      )
        // Made by an earlier run that stopped before it assigned everyone.
        role = key;
    }
    if (!role)
      throw new Error(
        `Roles ${ROLE} to ${ROLE}-${MAX_KEYS} all exist and are not this upgrade's; rename one and run it again.`,
      );
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
        .where('permissionSetKey', '=', role)
        .where('subjectId', 'in', people)
        .execute();
      const assigned = new Set(existing.map((row) => String(row.subjectId)));
      const now = new Date();
      const missing = people
        .filter((id) => !assigned.has(id))
        .map((id) => ({
          id: `user:${id}:${role}`,
          subjectType: 'user',
          subjectId: id,
          permissionSetKey: role,
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
