import {
  defineSeed,
  type SeedContext,
  type SeedDefinition,
} from '@nocobase/db';

/** The prefix system keys' hidden Permission Sets are named in; `SYSTEM_KEY_SET_PREFIX` at run time. */
const PREFIX = 'system-key-';

/**
 * Whether the authorization plugin's roles exist here: their Collection is registered, as its migrations register it.
 * Only the Collection being unknown means they do not; any other failure is thrown.
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

/**
 * Lists, once, the Permission Sets an application had already named in the `system-key-` prefix, which system keys now
 * reserve: such a set keeps working as it was, visible, editable and assigned, and its name is never given to a system
 * key. Done once, as the prefix is reserved, rather than at every boot: a list read while a key was being created could
 * take that key's set for an application's role, and processes reading at different times would disagree. Sets of
 * system keys already listed are left out. Without the authorization plugin's roles there is nothing to list.
 */
const seed: SeedDefinition = defineSeed({
  name: '202611210005_api_keys_prefix_exemptions',

  async run(context) {
    if (!(await hasRoles(context))) return;
    const { query } = context;
    const keys = new Set(
      (
        await query
          .selectFrom('authorizationPermissionSets')
          .select(['key'])
          .where('key', 'like', `${PREFIX}%`)
          .execute()
      )
        .map((row) => String(row.key))
        // `like` may ignore case.
        .filter((key) => key.startsWith(PREFIX)),
    );
    for (const row of await query
      .selectFrom('apiKeySystemKeys')
      .select(['identityId'])
      .execute())
      keys.delete(`${PREFIX}${String(row.identityId)}`);
    const listed = new Set(
      (
        await query
          .selectFrom('apiKeyPrefixExemptions')
          .select(['permissionSetKey'])
          .execute()
      ).map((row) => String(row.permissionSetKey)),
    );
    const now = new Date();
    const missing = [...keys]
      .filter((key) => !listed.has(key))
      .map((permissionSetKey) => ({ permissionSetKey, createdAt: now }));
    if (missing.length)
      await query
        .insertInto('apiKeyPrefixExemptions')
        .values(missing)
        .execute();
  },
});

export default seed;
