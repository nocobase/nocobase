import {
  defineMigration,
  type MigrationDefinition,
  type QueryAdapter,
} from '@nocobase/db';

/**
 * Replaces the single `ai.settings` page grant with the AI settings items it used to stand for.
 *
 * Before this migration every AI settings page and management route checked `access` on `{ type: 'page', id:
 * 'ai.settings' }`. They now check one `settings` item per page, with `read` and, where the page changes anything,
 * `manage`. A Permission Set that held the page grant is given every item and action, so whoever managed AI before keeps
 * exactly that. A grant of every page (`id: '*'`) is left alone: it never meant AI administration, and the items are
 * granted explicitly from now on.
 *
 * The item ids and actions are written out here rather than read from the plugin, because the plugin's list will move
 * on and this migration must keep doing what it did when it was released.
 */

interface Grant {
  resource?: { type?: string; id?: string };
  actions?: { action?: string }[];
  [key: string]: unknown;
}

type PermissionSetRow = { key: string; grants: unknown };

const LEGACY_PAGE = { type: 'page', id: 'ai.settings' } as const;

const ITEMS: readonly (readonly [id: string, actions: readonly string[]])[] = [
  ['ai.employees', ['read', 'manage']],
  ['ai.skills', ['read']],
  ['ai.tools', ['read']],
  ['ai.llmServices', ['read', 'manage']],
  ['ai.mcpServers', ['read', 'manage']],
  ['ai.usage', ['read']],
  ['ai.conversations', ['read']],
];

const migration: MigrationDefinition = defineMigration({
  name: '202610070001_ai_employee_settings_permissions',

  async up({ query }) {
    for (const row of await readPermissionSets(query)) {
      const grants = parseGrants(row.grants);
      if (!grants.some(isLegacyPageGrant)) continue;
      const next = grants.filter((grant) => !isLegacyPageGrant(grant));
      for (const [id, actions] of ITEMS) addActions(next, id, actions);
      await writeGrants(query, row.key, next);
    }
  },

  // Restores the page grant only to a Permission Set that holds every item and action `up` gives, so a rollback never
  // widens what a set allows: a set granted some of the items afterwards loses them rather than gaining every page.
  async down({ query }) {
    for (const row of await readPermissionSets(query)) {
      const grants = parseGrants(row.grants);
      if (!grants.some(isItemGrant)) continue;
      const held = ITEMS.every(([id, actions]) =>
        actions.every((action) =>
          grants.some(
            (grant) =>
              isSettingsGrant(grant, id) &&
              grant.actions?.some((entry) => entry.action === action),
          ),
        ),
      );
      const next = grants.filter((grant) => !isItemGrant(grant));
      if (held && !next.some(isLegacyPageGrant))
        next.push({
          resource: { ...LEGACY_PAGE },
          actions: [{ action: 'access' }],
        });
      await writeGrants(query, row.key, next);
    }
  },
});

export default migration;

async function readPermissionSets(
  query: QueryAdapter,
): Promise<PermissionSetRow[]> {
  return query
    .selectFrom('authorizationPermissionSets')
    .select(['key', 'grants'])
    .execute<PermissionSetRow>();
}

async function writeGrants(
  query: QueryAdapter,
  key: string,
  grants: readonly Grant[],
): Promise<void> {
  await query
    .updateTable('authorizationPermissionSets')
    .set({ grants: JSON.stringify(grants), updatedAt: new Date() })
    .where('key', '=', key)
    .execute();
}

/** Drivers return a JSON column as text or as the parsed value. */
function parseGrants(value: unknown): Grant[] {
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? (parsed as Grant[]) : [];
}

function isLegacyPageGrant(grant: Grant): boolean {
  return (
    grant.resource?.type === LEGACY_PAGE.type &&
    grant.resource.id === LEGACY_PAGE.id
  );
}

function isSettingsGrant(grant: Grant, id: string): boolean {
  return grant.resource?.type === 'settings' && grant.resource.id === id;
}

function isItemGrant(grant: Grant): boolean {
  return ITEMS.some(([id]) => isSettingsGrant(grant, id));
}

/** Adds the missing actions to the set's grant of `id`, or adds the grant. */
function addActions(
  grants: Grant[],
  id: string,
  actions: readonly string[],
): void {
  const index = grants.findIndex((grant) => isSettingsGrant(grant, id));
  if (index === -1) {
    grants.push({
      resource: { type: 'settings', id },
      actions: actions.map((action) => ({ action })),
    });
    return;
  }
  const current = grants[index];
  const present = new Set((current.actions ?? []).map((entry) => entry.action));
  grants[index] = {
    ...current,
    actions: [
      ...(current.actions ?? []),
      ...actions
        .filter((action) => !present.has(action))
        .map((action) => ({ action })),
    ],
  };
}
