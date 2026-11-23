import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/** The prefix system keys' hidden Permission Sets are named in; `SYSTEM_KEY_SET_PREFIX` at run time. */
const PREFIX = 'system-key-';
/** Rows read and written per statement, so a long list never makes one oversized statement. */
const BATCH = 200;

/**
 * Whether a Collection another plugin's migrations register exists here. `query` cannot tell a missing table from
 * another failure in every dialect, so this asks the Collection registry, betting only on the Collection's name; only
 * the Collection being unknown means it does not exist, and any other failure is thrown.
 */
async function hasCollection(
  context: MigrationContext,
  name: string,
): Promise<boolean> {
  try {
    await context.repository(name).count();
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
 * The suffixes, of those given, that name a registered system key or (when `services`) a service account: a set named
 * after one is a system key's, never an application's role. `up` leaves those out, and `down` checks each listed name
 * against the same test, so a rollback is allowed only when applying this migration again lists the same names.
 */
async function ownedSuffixes(
  query: MigrationContext['query'],
  suffixes: readonly string[],
  services: boolean,
): Promise<Set<string>> {
  const owned = new Set<string>();
  if (!suffixes.length) return owned;
  for (const row of await query
    .selectFrom('apiKeySystemKeys')
    .select(['identityId'])
    .where('identityId', 'in', [...suffixes])
    .execute())
    owned.add(String(row.identityId));
  if (services)
    for (const row of await query
      .selectFrom('user')
      .select(['id'])
      .where('id', 'in', [...suffixes])
      .where('kind', '=', 'service')
      .execute())
      owned.add(String(row.id));
  return owned;
}

/**
 * `apiKeyPrefixExemptions`: the Permission Sets an application had already named in the `system-key-` prefix when the
 * prefix was reserved for system keys. Such a set keeps working as it was — visible, editable and assigned — and its
 * name is never given to a system key. The table is listed here, in the migration that creates it, so it is listed
 * whenever it is created: rolling this migration back and applying it again lists the same sets again.
 *
 * A set is a system key's, and left out, when its suffix names a registered system key or a service account: after a
 * rollback past the system keys' table, the service account a set is named after still tells it apart from an
 * application's role. Without the authorization plugin's roles there is nothing to list.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611220004_api_keys_prefix_exemptions',

  async up(context) {
    const { builder, query } = context;
    await builder.createCollection('apiKeyPrefixExemptions', (collection) => {
      collection.string('permissionSetKey', { length: 255 }).notNull();
      collection.datetime('createdAt').notNull();
      collection.primary('permissionSetKey', {
        name: 'pk_api_key_prefix_exemptions',
      });
    });
    if (!(await hasCollection(context, 'authorizationPermissionSets'))) return;
    const services = await hasCollection(context, 'user');
    const now = new Date();
    let after: string | null = null;
    for (;;) {
      let page = query
        .selectFrom('authorizationPermissionSets')
        .select(['key'])
        .where('key', 'like', `${PREFIX}%`);
      if (after !== null) page = page.where('key', '>', after);
      const rows = await page.orderBy('key', 'asc').limit(BATCH).execute();
      if (!rows.length) break;
      after = String(rows.at(-1)!.key);
      // `like` may ignore case.
      const keys = rows
        .map((row) => String(row.key))
        .filter((key) => key.startsWith(PREFIX));
      const owned = await ownedSuffixes(
        query,
        keys.map((key) => key.slice(PREFIX.length)),
        services,
      );
      const exempt = keys.filter((key) => !owned.has(key.slice(PREFIX.length)));
      if (exempt.length)
        await query
          .insertInto('apiKeyPrefixExemptions')
          .values(
            exempt.map((permissionSetKey) => ({
              permissionSetKey,
              createdAt: now,
            })),
          )
          .execute();
      if (rows.length < BATCH) break;
    }
  },

  /**
   * Drops the list only when applying this migration again lists the same names: every name in it still has its role
   * and still passes `up`'s test, its suffix naming no system key or service account. A name whose role was deleted, or
   * which a service account named the same since would leave out, stays reserved, and only this table remembers it, so
   * rolling back then is refused rather than giving that name to a system key later or hiding the role. A list that
   * cannot be checked, its tables unreadable, is kept the same way, with the database's error as the cause.
   */
  async down(context) {
    const { builder, query } = context;
    // Service accounts are checked exactly when `up` checks them: when their Collection is registered. Any failure to
    // find out is the database's error, kept as the cause.
    let services: boolean;
    try {
      services = await hasCollection(context, 'user');
    } catch (error) {
      throw new Error(
        `Could not check that applying ${migration.name} again lists the same reserved role names, so its list is kept: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    const lost: string[] = [];
    let after: string | null = null;
    for (;;) {
      let page = query
        .selectFrom('apiKeyPrefixExemptions')
        .select(['permissionSetKey']);
      if (after !== null) page = page.where('permissionSetKey', '>', after);
      const rows = await page
        .orderBy('permissionSetKey', 'asc')
        .limit(BATCH)
        .execute();
      if (!rows.length) break;
      const keys = rows.map((row) => String(row.permissionSetKey));
      after = keys.at(-1)!;
      let present: Set<string>;
      let owned: Set<string>;
      try {
        present = new Set(
          (
            await query
              .selectFrom('authorizationPermissionSets')
              .select(['key'])
              .where('key', 'in', keys)
              .execute()
          ).map((row) => String(row.key)),
        );
        owned = await ownedSuffixes(
          query,
          keys.map((key) => key.slice(PREFIX.length)),
          services,
        );
      } catch (error) {
        throw new Error(
          `Could not check that applying ${migration.name} again lists the same reserved role names, so its list is kept: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      lost.push(
        ...keys.filter(
          (key) => !present.has(key) || owned.has(key.slice(PREFIX.length)),
        ),
      );
      if (rows.length < BATCH) break;
    }
    if (lost.length)
      throw new Error(
        `Rolling back ${migration.name} would forget ${lost.length} name(s) reserved for roles that applying it again would not list, their role gone or a service account named the same (${lost.slice(0, 10).join(', ')}${lost.length > 10 ? ', …' : ''}); a system key could then take one, or the role be hidden. Keep this migration applied.`,
      );
    await builder.dropCollection('apiKeyPrefixExemptions');
  },
});

export default migration;
