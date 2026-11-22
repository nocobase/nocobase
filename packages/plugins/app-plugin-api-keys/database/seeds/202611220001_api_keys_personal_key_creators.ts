import {
  defineSeed,
  type SeedContext,
  type SeedDefinition,
} from '@nocobase/db';

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
 * Whether the authorization plugin's roles exist here: their Collection is registered, as its migrations register it.
 * Only the Collection being unknown means they do not; any failure to find out, such as a lost connection or a missing
 * privilege, is thrown.
 */
async function hasRoles(context: SeedContext): Promise<boolean> {
  try {
    await context.repository('authorizationPermissionSets').count();
    return true;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      Reflect.get(error, 'code') === 'COLLECTION_NOT_FOUND'
    )
      return false;
    throw error;
  }
}

/** Whether stored grants are exactly `GRANTS`, whatever the order of their keys and actions. */
function onlyCreate(stored: unknown): boolean {
  if (!Array.isArray(stored) || stored.length !== 1) return false;
  const [grant] = stored as unknown[];
  if (typeof grant !== 'object' || grant === null) return false;
  const resource: unknown = Reflect.get(grant, 'resource');
  const actions: unknown = Reflect.get(grant, 'actions');
  if (
    typeof resource !== 'object' ||
    resource === null ||
    Reflect.get(resource, 'type') !== GRANTS[0].resource.type ||
    Reflect.get(resource, 'id') !== GRANTS[0].resource.id ||
    !Array.isArray(actions) ||
    actions.length !== 1
  )
    return false;
  const [entry] = actions as unknown[];
  return (
    typeof entry === 'object' &&
    entry !== null &&
    Reflect.get(entry, 'action') === 'create' &&
    Reflect.get(entry, 'policy') === undefined
  );
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
 * authorization plugin's roles, whose Collection is then unknown, there is nothing to do; any other failure is thrown, so the upgrade is
 * not recorded as done and runs again. A run that stopped half way finishes on the next one, adding only what is missing.
 */
const seed: SeedDefinition = defineSeed({
  name: '202611220001_api_keys_personal_key_creators',
  transaction: false,

  async run(context) {
    if (!(await hasRoles(context))) return;
    const { query } = context;
    const find = (key: string) =>
      query
        .selectFrom('authorizationPermissionSets')
        .select(['id', 'grants'])
        .where('key', '=', key)
        .executeTakeFirst<{ id: unknown; grants: unknown }>();
    let role: string | undefined;
    for (let index = 0; index < MAX_KEYS && !role; index += 1) {
      const key = index === 0 ? ROLE : `${ROLE}-${index + 1}`;
      const existing = await find(key);
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
        onlyCreate(parse(existing.grants))
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
