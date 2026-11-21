import { randomUUID } from 'node:crypto';

import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * The agents' System settings pages now stand behind settings items rather than page grants, and skills got an item of
 * their own (`agents.skills`, until now part of `agents.agents`). So that every role keeps what it could do:
 *
 * - a permission set holding `agents.agents` read or manage gets `agents.skills` at the same actions;
 * - a permission set holding the usage page (`page` `usage`, `access`) gets `agents.prices` read, which now opens the
 *   Usage page and shows every run's usage.
 *
 * The page grants themselves stay: a page id is an application-wide name another page may share, and nothing checks
 * the agents' ones any more. Sets are rewritten one by one (there are few), each with a new revision so an editor open
 * on an old one reloads. Without the authorization plugin's table there is nothing to change.
 *
 * `down` removes every `agents.skills` grant, an item that did not exist before this migration. The `agents.prices`
 * read added for the usage page cannot be told apart from one an administrator gave, so it stays.
 */
const TABLE = 'authorizationPermissionSets';

interface GrantRecord {
  readonly resource: { readonly type: string; readonly id: string };
  readonly actions: readonly {
    readonly action: string;
    readonly policy?: unknown;
  }[];
}

interface SetRow {
  readonly key: string;
  readonly grants: unknown;
}

function parseGrants(value: unknown): GrantRecord[] | null {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(
    (grant): grant is GrantRecord =>
      typeof grant === 'object' &&
      grant !== null &&
      typeof (grant as GrantRecord).resource?.type === 'string' &&
      typeof (grant as GrantRecord).resource?.id === 'string' &&
      Array.isArray((grant as GrantRecord).actions),
  ).length === parsed.length
    ? (parsed as GrantRecord[])
    : null;
}

const isSettings = (grant: GrantRecord, id: string): boolean =>
  grant.resource.type === 'settings' && grant.resource.id === id;

function actionsOf(grants: readonly GrantRecord[], type: string, id: string) {
  return new Set(
    grants
      .filter(
        (grant) => grant.resource.type === type && grant.resource.id === id,
      )
      .flatMap((grant) => grant.actions.map((entry) => entry.action)),
  );
}

/** `grants` with `actions` added to the settings item `id`, or null when it already holds them all. */
function withSettings(
  grants: readonly GrantRecord[],
  id: string,
  actions: readonly string[],
): GrantRecord[] | null {
  const held = actionsOf(grants, 'settings', id);
  const missing = actions.filter((action) => !held.has(action));
  if (!missing.length) return null;
  const index = grants.findIndex((grant) => isSettings(grant, id));
  if (index === -1)
    return [
      ...grants,
      {
        resource: { type: 'settings', id },
        actions: missing.map((action) => ({ action })),
      },
    ];
  return grants.map((grant, current) =>
    current === index
      ? {
          ...grant,
          actions: [
            ...grant.actions,
            ...missing.map((action) => ({ action })),
          ],
        }
      : grant,
  );
}

/** The grants this migration gives a set, or null when it needs none. */
function upgradeGrants(
  grants: readonly GrantRecord[],
): GrantRecord[] | null {
  let next: readonly GrantRecord[] = grants;
  let changed = false;
  const agents = actionsOf(grants, 'settings', 'agents.agents');
  const skillActions = ['read', 'manage'].filter((action) =>
    agents.has(action),
  );
  if (skillActions.length) {
    const added = withSettings(next, 'agents.skills', skillActions);
    if (added) [next, changed] = [added, true];
  }
  if (actionsOf(grants, 'page', 'usage').has('access')) {
    const added = withSettings(next, 'agents.prices', ['read']);
    if (added) [next, changed] = [added, true];
  }
  return changed ? [...next] : null;
}

async function rewrite(
  { builder, query }: MigrationContext,
  change: (grants: readonly GrantRecord[]) => GrantRecord[] | null,
): Promise<void> {
  if (!(await builder.hasCollection(TABLE))) return;
  const rows = (await query
    .selectFrom(TABLE)
    .select(['key', 'grants'])
    .orderBy('key')
    .execute()) as SetRow[];
  for (const row of rows) {
    const grants = parseGrants(row.grants);
    if (!grants) continue;
    const next = change(grants);
    if (!next) continue;
    await query
      .updateTable(TABLE)
      .set({
        grants: JSON.stringify(next),
        revision: randomUUID(),
        updatedAt: new Date(),
      })
      .where('key', '=', row.key)
      .execute();
  }
}

const migration: MigrationDefinition = defineMigration({
  name: '202611210001_ag_settings_grants',
  async up(context: MigrationContext): Promise<void> {
    await rewrite(context, upgradeGrants);
  },
  async down(context: MigrationContext): Promise<void> {
    await rewrite(context, (grants) =>
      grants.some((grant) => isSettings(grant, 'agents.skills'))
        ? grants.filter((grant) => !isSettings(grant, 'agents.skills'))
        : null,
    );
  },
});

export default migration;
