import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const NOW = new Date('2026-10-20T00:00:00.000Z');

describeMigration('202610240020_ag_runner_agents', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    for (const [id, type] of [
      ['lead', 'runner'],
      ['assistant', 'online'],
    ] as const)
      await connection.repository('agAgents').createOne({
        values: {
          id,
          name: id,
          type,
          ownerUserId: 'owner',
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
    for (const [id, status] of [
      ['queued-run', 'queued'],
      ['done-run', 'completed'],
    ])
      await connection.repository('agRuns').createOne({
        values: {
          id,
          agentId: 'lead',
          status,
          subjectKind: 'issue',
          subjectId: '1',
          threadScope: 'main',
          actorUserId: 'owner',
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
    await connection.repository('agRunRequests').createOne({
      values: {
        id: 'pending-request',
        agentId: 'lead',
        subjectKind: 'issue',
        subjectId: '1',
        threadScope: 'main',
        responsibleUserId: 'owner',
        requestedByUserId: 'other',
        inputType: 'comment',
        inputActorKind: 'user',
        inputActorId: 'other',
        inputActorName: 'Other',
        inputText: 'Review',
        expiresAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
    await connection.repository('agChatPreferences').createOne({
      values: { userId: 'owner', defaultAgentId: 'assistant', updatedAt: NOW },
    });
    await connection.repository('agSettings').createOne({
      values: {
        key: 'chat',
        value: {
          defaultAgentId: 'assistant',
          onlineFallbackAgentId: 'assistant',
        },
        updatedAt: NOW,
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    for (const field of [
      'source',
      'status',
      'tool',
      'model',
      'lastReportedAt',
      'deletedAt',
    ])
      await expectCollection('agAgents').toHaveField(field);
    await expectCollection('agRunners').toHaveField('unavailableModels');
    // Every agent kept so far is removed, its row kept for the names runs show.
    for (const id of ['lead', 'assistant']) {
      const agent = await connection
        .repository('agAgents')
        .findOne({ filter: { id } });
      expect(agent).toMatchObject({ name: id, status: 'disabled' });
      expect(agent?.deletedAt).toBeTruthy();
    }
    expect(
      await connection.repository('agRuns').findOne({
        filter: { id: 'queued-run' },
      }),
    ).toMatchObject({ status: 'cancelled', failureReason: 'cancelled' });
    expect(
      await connection.repository('agRuns').findOne({
        filter: { id: 'done-run' },
      }),
    ).toMatchObject({ status: 'completed' });
    expect(
      await connection.repository('agRunRequests').findOne({
        filter: { id: 'pending-request' },
      }),
    ).toMatchObject({ status: 'withdrawn' });
    expect(
      await connection.repository('agChatPreferences').findOne({
        filter: { userId: 'owner' },
      }),
    ).toMatchObject({ defaultAgentId: null });
    const settings = await connection
      .repository('agSettings')
      .findOne({ filter: { key: 'chat' } });
    const value =
      typeof settings?.value === 'string'
        ? JSON.parse(settings.value)
        : settings?.value;
    expect(value).toEqual({ defaultAgentId: null });
  },
  down: async ({ expectCollection }) => {
    for (const field of ['source', 'status', 'deletedAt'])
      await expectCollection('agAgents').not.toHaveField(field);
    await expectCollection('agRunners').not.toHaveField('unavailableModels');
  },
});
