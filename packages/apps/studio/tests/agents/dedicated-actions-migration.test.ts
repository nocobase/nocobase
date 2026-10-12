// @vitest-environment node
/** Agents that could edit issues keep opening pull requests and managing previews once those are actions of their own. */
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  describeMigration,
  type MigrationTestContext,
} from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const require = createRequire(import.meta.url);
const AGENTS = path.dirname(
  require.resolve('@nocobase/app-plugin-agents/package.json'),
);

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-agents',
    directory: path.join(AGENTS, 'database/migrations'),
  },
  {
    packageName: 'studio',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const actions = async ({ connection }: MigrationTestContext) =>
  Object.fromEntries(
    (
      await connection.query
        .selectFrom('agAgents')
        .select(['id', 'actions'])
        .orderBy('id')
        .execute()
    ).map((row) => [
      row.id,
      typeof row.actions === 'string'
        ? (JSON.parse(row.actions) as string[])
        : row.actions,
    ]),
  );

// Gives agents that edit issues the pull request and preview actions, and takes them back.
describeMigration('202610060010_studio_agent_dedicated_actions', {
  sources,
  before: async ({ connection }) => {
    const now = new Date().toISOString();
    for (const [id, granted] of [
      ['editor', ['pm.issues/view', 'pm.issues/edit']],
      ['reader', ['pm.issues/view']],
    ] as const)
      await connection.query
        .insertInto('agAgents')
        .values({
          id,
          name: id,
          type: 'runner',
          modelEntries: JSON.stringify([{ tool: 'claude', model: null }]),
          ownerUserId: 'u1',
          actions: JSON.stringify(granted),
          createdAt: now,
          updatedAt: now,
        } as never)
        .execute();
  },
  up: async (context) => {
    expect(await actions(context)).toEqual({
      editor: [
        'pm.issues/view',
        'pm.issues/edit',
        'studio.git/open-pr',
        'studio.previews/manage',
      ],
      reader: ['pm.issues/view'],
    });
  },
  down: async (context) => {
    expect(await actions(context)).toEqual({
      editor: ['pm.issues/view', 'pm.issues/edit'],
      reader: ['pm.issues/view'],
    });
  },
});
