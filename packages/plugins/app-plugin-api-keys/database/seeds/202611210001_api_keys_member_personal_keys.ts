import { defineSeed, type SeedDefinition } from '@nocobase/db';

const MEMBER = 'member';
const RESOURCE = { type: 'settings', id: 'personalApiKeys' } as const;
const ACTION = 'create';

interface StoredGrant {
  resource?: { type?: unknown; id?: unknown };
  actions?: { action?: unknown }[];
}

/**
 * Lets every member keep creating keys of their own now that a role grants it (`settings:personalApiKeys/create`):
 * the built-in `member` Permission Set, which every person holds, gets that action once. An administrator may take it
 * away afterwards; this runs once, so it is not given back. Without the authorization plugin's tables there is no role
 * to grant it, and nothing to do.
 */
const seed: SeedDefinition = defineSeed({
  name: '202611210001_api_keys_member_personal_keys',
  transaction: false,

  async run({ query }) {
    let row: { grants: unknown } | undefined;
    try {
      row = await query
        .selectFrom('authorizationPermissionSets')
        .select(['grants'])
        .where('key', '=', MEMBER)
        .executeTakeFirst<{ grants: unknown }>();
    } catch {
      return;
    }
    if (!row) return;
    const parsed: unknown =
      typeof row.grants === 'string'
        ? (JSON.parse(row.grants) as unknown)
        : row.grants;
    const grants: StoredGrant[] = Array.isArray(parsed)
      ? (parsed as StoredGrant[])
      : [];
    const existing = grants.find(
      (grant) =>
        grant.resource?.type === RESOURCE.type &&
        grant.resource.id === RESOURCE.id,
    );
    if (existing?.actions?.some((entry) => entry.action === ACTION)) return;
    const next = existing
      ? grants.map((grant) =>
          grant === existing
            ? {
                ...grant,
                actions: [...(grant.actions ?? []), { action: ACTION }],
              }
            : grant,
        )
      : [...grants, { resource: RESOURCE, actions: [{ action: ACTION }] }];
    await query
      .updateTable('authorizationPermissionSets')
      .set({
        grants: JSON.stringify(next),
        revision: crypto.randomUUID(),
        updatedAt: new Date(),
      })
      .where('key', '=', MEMBER)
      .execute();
  },
});

export default seed;
