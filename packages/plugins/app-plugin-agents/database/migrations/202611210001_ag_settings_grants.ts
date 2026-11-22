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
 * `down` removes every `agents.skills` grant, an item that did not exist before this migration, and the `agents.prices`
 * read this migration added: `up` records the sets it gave it in the plugin's own settings (`agSettings`, under the
 * migration's name), so a read an administrator gave stays.
 */
const TABLE = 'authorizationPermissionSets';
const SETTINGS = 'agSettings';
const NAME = '202611210001_ag_settings_grants';

interface GrantRecord {
  readonly resource: { readonly type: string; readonly id: string };
  readonly actions: readonly {
    readonly action: string;
    readonly policy?: unknown;
  }[];
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
          actions: [...grant.actions, ...missing.map((action) => ({ action }))],
        }
      : grant,
  );
}

/** The grants this migration gives a set, or null when it needs none; `prices` says whether it gave `agents.prices` read. */
function upgradeGrants(
  grants: readonly GrantRecord[],
): { grants: GrantRecord[]; prices: boolean } | null {
  let next: readonly GrantRecord[] = grants;
  let changed = false;
  let prices = false;
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
    if (added) [next, changed, prices] = [added, true, true];
  }
  return changed ? { grants: [...next], prices } : null;
}

/** `grants` without the `read` of `agents.prices`, dropping the grant when nothing else is left in it. */
function withoutPricesRead(grants: readonly GrantRecord[]): GrantRecord[] {
  return grants.flatMap((grant) => {
    if (!isSettings(grant, 'agents.prices')) return [grant];
    const actions = grant.actions.filter((entry) => entry.action !== 'read');
    return actions.length ? [{ ...grant, actions }] : [];
  });
}

function parseKeys(value: unknown): readonly string[] {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  const keys = (parsed as { pricesRead?: unknown } | null)?.pricesRead;
  return Array.isArray(keys)
    ? keys.filter((key): key is string => typeof key === 'string')
    : [];
}

async function rewrite(
  { builder, query }: MigrationContext,
  change: (key: string, grants: readonly GrantRecord[]) => GrantRecord[] | null,
): Promise<void> {
  if (!(await builder.hasCollection(TABLE))) return;
  const rows = await query
    .selectFrom(TABLE)
    .select(['key', 'grants'])
    .orderBy('key')
    .execute();
  for (const row of rows) {
    const grants = parseGrants(row.grants);
    if (!grants) continue;
    const next = change(row.key as string, grants);
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
  name: NAME,
  async up(context: MigrationContext): Promise<void> {
    const pricesRead: string[] = [];
    await rewrite(context, (key, grants) => {
      const next = upgradeGrants(grants);
      if (next?.prices) pricesRead.push(key);
      return next?.grants ?? null;
    });
    if (!pricesRead.length || !(await context.builder.hasCollection(SETTINGS)))
      return;
    await context.query
      .insertInto(SETTINGS)
      .values({
        key: NAME,
        value: JSON.stringify({ pricesRead }),
        updatedById: null,
        updatedAt: new Date(),
      })
      .execute();
  },
  async down(context: MigrationContext): Promise<void> {
    let pricesRead = new Set<string>();
    const hasSettings = await context.builder.hasCollection(SETTINGS);
    if (hasSettings) {
      const row = await context.query
        .selectFrom(SETTINGS)
        .select(['value'])
        .where('key', '=', NAME)
        .executeTakeFirst();
      pricesRead = new Set(parseKeys(row?.value));
    }
    await rewrite(context, (key, grants) => {
      const skills = grants.some((grant) => isSettings(grant, 'agents.skills'));
      if (!skills && !pricesRead.has(key)) return null;
      const next = grants.filter(
        (grant) => !isSettings(grant, 'agents.skills'),
      );
      return pricesRead.has(key) ? withoutPricesRead(next) : next;
    });
    if (hasSettings)
      await context.query
        .deleteFrom(SETTINGS)
        .where('key', '=', NAME)
        .execute();
  },
});

export default migration;
