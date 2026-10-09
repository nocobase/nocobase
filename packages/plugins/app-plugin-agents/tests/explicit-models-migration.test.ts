// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const at = new Date('2026-10-01T00:00:00Z');
const configs = [
  { id: 'empty', entries: [{ tool: 'claude', model: null }] },
  { id: 'blank', entries: [{ tool: 'claude', model: '  ' }] },
  { id: 'explicit', entries: [{ tool: 'claude', model: 'opus' }] },
  {
    id: 'mixed',
    entries: [
      { tool: 'claude', model: null },
      { tool: 'codex', model: 'gpt-test' },
    ],
  },
];
function run(
  id: string,
  agentId: string,
  status = 'queued',
  agentType = 'runner',
): Record<string, unknown> {
  return {
    id,
    agentId,
    agentType,
    status,
    priority: 0,
    attempt: 1,
    maxAttempts: 3,
    subjectKind: 'sample',
    subjectId: id,
    threadScope: 'main',
    actorUserId: 'alice',
    requires: '[]',
    acceptsInput: false,
    claimFailures: 0,
    createdAt: at,
    updatedAt: at,
    executionHistory: [{ attempt: 1, model: null }],
  };
}

describeMigration('202610210002_ag_wait_for_explicit_models', {
  reversible: false,
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    for (const config of configs)
      await connection.repository('agAgents').createOne({
        values: {
          id: config.id,
          name: config.id,
          type: 'runner',
          modelEntries: config.entries,
          ownerUserId: 'alice',
          createdAt: at,
          updatedAt: at,
        },
      });
    await connection.query
      .insertInto('agRuns')
      .values([
        run('empty-queued', 'empty'),
        run('blank-queued', 'blank'),
        run('explicit-queued', 'explicit'),
        run('mixed-queued', 'mixed'),
        run('empty-dispatched', 'empty', 'dispatched'),
        run('empty-running', 'empty', 'running'),
        run('empty-history', 'empty', 'completed'),
        run('online-queued', 'empty', 'queued', 'online'),
      ])
      .execute();
    await connection.repository('agRunInputs').createOne({
      values: {
        id: 'input',
        runId: 'empty-queued',
        type: 'message',
        actorKind: 'user',
        actorId: 'alice',
        actorName: 'Alice',
        text: 'Retain this input',
        createdAt: at,
      },
    });
  },
  up: async ({ database, connection, expectCollection }) => {
    await expectCollection('agRuns').toHaveField('modelPending', {
      type: 'boolean',
      nullable: false,
    });
    const rows = await connection
      .repository('agRuns')
      .findMany({ sort: (sort) => sort.field('id').asc() });
    expect(rows.filter((row) => row.modelPending).map((row) => row.id)).toEqual(
      ['blank-queued', 'empty-queued'],
    );
    for (const row of rows)
      expect(row.executionHistory).toEqual([{ attempt: 1, model: null }]);
    for (const config of configs)
      expect(
        (
          await connection
            .repository('agAgents')
            .findOne({ filter: { id: config.id } })
        )?.modelEntries,
      ).toEqual(config.entries);
    expect(
      await connection
        .repository('agRunInputs')
        .findOne({ filter: { id: 'input' } }),
    ).toMatchObject({ text: 'Retain this input', deliveredAt: null });
    const migrator = database.createMigrator({
      sources: [
        {
          packageName: '@nocobase/app-plugin-agents',
          directory: path.resolve(
            import.meta.dirname,
            '../database/migrations',
          ),
        },
      ],
    });
    await expect(migrator.rollback()).rejects.toThrow(
      'while run records exist',
    );
    await expectCollection('agRuns').toHaveField('modelPending');
    expect(await connection.repository('agRunInputs').count()).toBe(1);
  },
  // Populated histories refuse rollback before any schema or child data can be removed.
});

describeMigration('202610210002_ag_wait_for_explicit_models', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRuns').toHaveField('modelPending', {
      type: 'boolean',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('modelPending');
    await expectCollection('agRuns').toHaveField('executionHistory');
  },
});
