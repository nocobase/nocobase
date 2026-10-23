import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const migration = '202610290001_ag_repair_runner_agents';
const now = '2026-10-22T00:00:00.000Z';

describeMigration(migration, {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    for (const [id, source, status, archivedAt, deletedAt] of [
      ['archived-runner', 'runner', 'enabled', now, null],
      ['deleted-runner', 'runner', 'disabled', now, now],
      ['already-restored-runner', 'runner', 'pending', null, null],
      ['archived-system', 'system', 'enabled', now, null],
      ['archived-legacy', null, 'disabled', now, now],
    ] as const) {
      await connection.repository('agAgents').createOne({
        values: {
          id,
          name: `Keep ${id}`,
          description: `Description for ${id}`,
          type: 'runner',
          source,
          status,
          tool: source === 'runner' ? 'claude' : null,
          model: source === 'runner' ? id : null,
          modelEntries:
            source === 'runner'
              ? [{ tool: 'claude', model: id, effort: 'medium' }]
              : [],
          instructions: `Instructions for ${id}`,
          ownerUserId: 'system',
          archivedAt,
          deletedAt,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await connection.repository('agAgentChanges').createOne({
      values: {
        id: 'prior-history',
        agentId: 'archived-runner',
        revision: 1,
        action: 'created',
        actorUserId: null,
        changes: [],
        createdAt: now,
      },
    });
  },
  up: async ({ connection }) => {
    const agents = connection.repository('agAgents');
    expect(
      await agents.findOne({ filter: { id: 'archived-runner' } }),
    ).toMatchObject({
      name: 'Keep archived-runner',
      description: 'Description for archived-runner',
      instructions: 'Instructions for archived-runner',
      status: 'pending',
      archivedAt: null,
      deletedAt: null,
      modelEntries: [
        { tool: 'claude', model: 'archived-runner', effort: 'medium' },
      ],
    });
    expect(
      await agents.findOne({ filter: { id: 'deleted-runner' } }),
    ).toMatchObject({
      status: 'pending',
      archivedAt: null,
      deletedAt: expect.anything(),
    });
    expect(
      await agents.findOne({ filter: { id: 'already-restored-runner' } }),
    ).toMatchObject({
      status: 'pending',
      archivedAt: null,
      deletedAt: null,
    });
    expect(
      await agents.findOne({ filter: { id: 'archived-system' } }),
    ).toMatchObject({
      source: 'system',
      status: 'enabled',
      archivedAt: expect.anything(),
    });
    expect(
      await agents.findOne({ filter: { id: 'archived-legacy' } }),
    ).toMatchObject({
      source: null,
      status: 'disabled',
      archivedAt: expect.anything(),
      deletedAt: expect.anything(),
    });
    expect(
      await connection
        .repository('agAgentChanges')
        .findOne({ filter: { id: 'prior-history' } }),
    ).toMatchObject({ agentId: 'archived-runner', revision: 1 });
  },
  down: async ({ connection }) => {
    // A rollback intentionally leaves the repair in place; it never re-archives a runner agent.
    expect(
      await connection
        .repository('agAgents')
        .findOne({ filter: { id: 'archived-runner' } }),
    ).toMatchObject({ status: 'pending', archivedAt: null });
  },
});
