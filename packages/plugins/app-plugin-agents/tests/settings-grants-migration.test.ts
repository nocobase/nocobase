import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { DatabaseConnection } from '@nocobase/db';
import { expect } from 'vitest';

interface Grant {
  readonly resource: { readonly type: string; readonly id: string };
  readonly actions: readonly { readonly action: string }[];
}

const settings = (id: string, ...actions: string[]): Grant => ({
  resource: { type: 'settings', id },
  actions: actions.map((action) => ({ action })),
});
const page = (id: string): Grant => ({
  resource: { type: 'page', id },
  actions: [{ action: 'access' }],
});

const SETS: Record<string, readonly Grant[]> = {
  'agent-reader': [settings('agents.agents', 'read'), page('agents')],
  'agent-manager': [settings('agents.agents', 'read', 'manage')],
  'usage-reader': [page('usage'), settings('agents.prices', 'manage')],
  'usage-only': [page('usage')],
  'price-reader': [page('usage'), settings('agents.prices', 'read')],
  unrelated: [settings('agents.runners', 'read'), page('runtimes')],
  'already-upgraded': [
    settings('agents.agents', 'read'),
    settings('agents.skills', 'read'),
  ],
};

async function grantsOf(
  connection: DatabaseConnection,
): Promise<Record<string, { grants: Grant[]; revision: string }>> {
  const rows = await connection.query
    .selectFrom('authorizationPermissionSets')
    .select(['key', 'grants', 'revision'])
    .execute();
  return Object.fromEntries(
    rows.map((row) => [
      row.key as string,
      {
        grants: (typeof row.grants === 'string'
          ? JSON.parse(row.grants)
          : row.grants) as Grant[],
        revision: row.revision as string,
      },
    ]),
  );
}

const actions = (grants: readonly Grant[], type: string, id: string) =>
  grants
    .filter((grant) => grant.resource.type === type && grant.resource.id === id)
    .flatMap((grant) => grant.actions.map((entry) => entry.action))
    .sort();

describeMigration('202611210001_ag_settings_grants', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-authorization',
      directory: path.resolve(
        import.meta.dirname,
        '../../app-plugin-authorization/database/migrations',
      ),
    },
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    for (const [key, grants] of Object.entries(SETS))
      await connection.query
        .insertInto('authorizationPermissionSets')
        .values({
          id: key,
          key,
          title: null,
          grants: JSON.stringify(grants),
          revision: 'before',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
  },
  up: async ({ connection }) => {
    const sets = await grantsOf(connection);
    // Skills follow agents at the same actions.
    expect(
      actions(sets['agent-reader'].grants, 'settings', 'agents.skills'),
    ).toEqual(['read']);
    expect(
      actions(sets['agent-manager'].grants, 'settings', 'agents.skills'),
    ).toEqual(['manage', 'read']);
    // Opening the usage page becomes reading usage, added to the prices grant the set holds.
    expect(
      actions(sets['usage-reader'].grants, 'settings', 'agents.prices'),
    ).toEqual(['manage', 'read']);
    expect(
      sets['usage-reader'].grants.filter(
        (grant) => grant.resource.id === 'agents.prices',
      ),
    ).toHaveLength(1);
    expect(
      actions(sets['usage-only'].grants, 'settings', 'agents.prices'),
    ).toEqual(['read']);
    expect(sets['price-reader']).toEqual({
      grants: SETS['price-reader'],
      revision: 'before',
    });
    // The page grants stay; sets with nothing to add are left alone, revision included.
    expect(
      actions(sets['already-upgraded'].grants, 'settings', 'agents.skills'),
    ).toEqual(['read']);
    expect(actions(sets['agent-reader'].grants, 'page', 'agents')).toEqual([
      'access',
    ]);
    expect(sets.unrelated).toEqual({
      grants: SETS.unrelated,
      revision: 'before',
    });
    expect(sets['agent-reader'].revision).not.toBe('before');
  },
  down: async ({ connection }) => {
    const sets = await grantsOf(connection);
    for (const key of ['agent-reader', 'agent-manager', 'already-upgraded'])
      expect(actions(sets[key].grants, 'settings', 'agents.skills')).toEqual(
        [],
      );
    expect(
      actions(sets['agent-manager'].grants, 'settings', 'agents.agents'),
    ).toEqual(['manage', 'read']);
    expect(sets.unrelated.grants).toEqual(SETS.unrelated);
    // Only the prices read it added goes: what a set held before stays as it was.
    expect(sets['usage-only'].grants).toEqual(SETS['usage-only']);
    expect(sets['usage-reader'].grants).toEqual(SETS['usage-reader']);
    expect(sets['price-reader'].grants).toEqual(SETS['price-reader']);
    expect(
      await connection.query
        .selectFrom('agSettings')
        .select(['key'])
        .where('key', '=', '202611210001_ag_settings_grants')
        .execute(),
    ).toEqual([]);
  },
});
