import {
  defineSeed,
  type SeedContext,
  type SeedDefinition,
} from '@nocobase/db';

/** The key prefix reserved for system keys' hidden Permission Sets. */
const PREFIX = 'system-key-';
/** How many new names to try for one role before giving up. */
const MAX_NAMES = 20;

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
 * System keys keep their hidden Permission Sets under `system-key-`, which this version reserves: a set named so is
 * hidden from the role pages and cannot be edited there. An application that already had a role named so keeps it under
 * `role-<old key>` (or `role-<old key>-2`, …), with every assignment moved along, before the reservation applies. Sets
 * that belong to system keys are left as they are. Running again renames nothing more.
 */
const seed: SeedDefinition = defineSeed({
  name: '202611210005_api_keys_release_reserved_sets',
  async run(context) {
    if (!(await hasRoles(context))) return;
    const { query } = context;
    const listed = new Set(
      (
        await query
          .selectFrom('apiKeySystemKeys')
          .select('identityId')
          .execute()
      ).map((row) => `${PREFIX}${String(row.identityId)}`),
    );
    const sets = (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('key')
        .execute()
    )
      .map((row) => String(row.key))
      .filter((key) => key.startsWith(PREFIX) && !listed.has(key));
    if (!sets.length) return;
    const taken = new Set(
      (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('key')
          .execute()
      ).map((row) => String(row.key)),
    );
    for (const key of sets) {
      const base = `role-${key}`;
      const newKey = [
        base,
        ...Array.from(
          { length: MAX_NAMES - 1 },
          (_, index) => `${base}-${index + 2}`,
        ),
      ].find((candidate) => !taken.has(candidate));
      if (!newKey)
        throw new Error(
          `Roles ${base} to ${base}-${MAX_NAMES} all exist; rename the role ${key} out of the prefix reserved for system keys and run the upgrade again.`,
        );
      taken.add(newKey);
      const now = new Date();
      await query
        .updateTable('authorizationPermissionSets')
        .set({ key: newKey, updatedAt: now })
        .where('key', '=', key)
        .execute();
      const assignments = await query
        .selectFrom('authorizationPermissionSetAssignments')
        .select(['id', 'subjectType', 'subjectId'])
        .where('permissionSetKey', '=', key)
        .execute();
      for (const assignment of assignments)
        await query
          .updateTable('authorizationPermissionSetAssignments')
          .set({
            // An assignment's id names its set.
            id: `${String(assignment.subjectType)}:${String(assignment.subjectId)}:${newKey}`,
            permissionSetKey: newKey,
            updatedAt: now,
          })
          .where('id', '=', String(assignment.id))
          .execute();
    }
  },
});

export default seed;
