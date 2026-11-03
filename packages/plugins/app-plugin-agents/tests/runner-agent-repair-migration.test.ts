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
    for (const [
      id,
      source,
      status,
      tool,
      model,
      modelEntries,
      archivedAt,
      deletedAt,
    ] of [
      [
        'deleted-runner',
        'runner',
        'enabled',
        'claude',
        'claude-sonnet-5',
        [{ tool: 'claude', model: 'claude-sonnet-5', effort: 'high' }],
        null,
        now,
      ],
      [
        'archived-runner',
        'runner',
        'disabled',
        'codex',
        'gpt-5-codex',
        [{ tool: 'codex', model: 'gpt-5-codex', effort: 'xhigh' }],
        now,
        null,
      ],
      ['empty-runner', 'runner', 'pending', 'claude', null, [], null, null],
      [
        'combined-runner',
        'runner',
        'disabled',
        'pi',
        'claude-sonnet-5',
        [],
        now,
        now,
      ],
      ['archived-system', 'system', 'enabled', null, null, [], now, null],
      ['archived-legacy', null, 'disabled', null, null, [], now, now],
    ] as const) {
      await connection.repository('agAgents').createOne({
        values: {
          id,
          name: `Keep ${id}`,
          description: `Description for ${id}`,
          type: 'runner',
          source,
          status,
          tool,
          model,
          modelEntries,
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
        agentId: 'deleted-runner',
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
      await agents.findOne({ filter: { id: 'deleted-runner' } }),
    ).toMatchObject({
      status: 'enabled',
      deletedAt: null,
      archivedAt: null,
      modelEntries: [
        { tool: 'claude', model: 'claude-sonnet-5', effort: 'high' },
      ],
    });
    expect(
      await agents.findOne({ filter: { id: 'archived-runner' } }),
    ).toMatchObject({
      status: 'disabled',
      deletedAt: null,
      archivedAt: null,
      modelEntries: [{ tool: 'codex', model: 'gpt-5-codex', effort: 'xhigh' }],
    });
    expect(
      await agents.findOne({ filter: { id: 'empty-runner' } }),
    ).toMatchObject({
      status: 'pending',
      modelEntries: [{ tool: 'claude', model: null, effort: 'medium' }],
    });
    expect(
      await agents.findOne({ filter: { id: 'combined-runner' } }),
    ).toMatchObject({
      status: 'disabled',
      deletedAt: null,
      archivedAt: null,
      modelEntries: [
        { tool: 'pi', model: 'claude-sonnet-5', effort: 'medium' },
      ],
    });
    expect(
      await agents.findOne({ filter: { id: 'archived-system' } }),
    ).toMatchObject({ status: 'enabled', archivedAt: expect.anything() });
    expect(
      await agents.findOne({ filter: { id: 'archived-legacy' } }),
    ).toMatchObject({
      status: 'disabled',
      archivedAt: expect.anything(),
      deletedAt: expect.anything(),
    });
    expect(
      await connection
        .repository('agAgentChanges')
        .findMany({ filter: { agentId: 'deleted-runner' } }),
    ).toHaveLength(1);
  },
  down: async ({ connection }) => {
    // Rolling back the release leaves repaired data and every original status in place.
    expect(
      await connection
        .repository('agAgents')
        .findOne({ filter: { id: 'combined-runner' } }),
    ).toMatchObject({
      status: 'disabled',
      archivedAt: null,
      deletedAt: null,
      modelEntries: [
        { tool: 'pi', model: 'claude-sonnet-5', effort: 'medium' },
      ],
    });
  },
});
