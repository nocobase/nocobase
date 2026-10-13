import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610120002_ag_add_queue_entered_at', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    for (const [id, status, availableAt] of [
      ['queued-now', 'queued', null],
      ['queued-later', 'queued', '2026-10-12T12:05:00Z'],
      ['held', 'running', null],
    ] as const) {
      await connection.repository('agRuns').createOne({
        values: {
          id,
          agentId: 'manager',
          subjectKind: 'sample',
          subjectId: id,
          threadScope: 'main',
          actorUserId: 'owner',
          status,
          availableAt,
          createdAt: new Date('2026-10-12T12:00:00Z'),
          updatedAt: new Date('2026-10-12T12:00:00Z'),
        },
      });
    }
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('agRuns').toHaveField('queueEnteredAt', {
      type: 'datetimeTz',
      nullable: true,
    });
    for (const [id, expected] of [
      ['queued-now', '2026-10-12T12:00:00.000Z'],
      ['queued-later', '2026-10-12T12:05:00.000Z'],
    ] as const) {
      const row = await connection
        .repository('agRuns')
        .findOne({ filter: { id } });
      expect(new Date(row!.queueEnteredAt as string).toISOString()).toBe(
        expected,
      );
    }
    expect(
      (await connection
        .repository('agRuns')
        .findOne({ filter: { id: 'held' } }))!.queueEnteredAt,
    ).toBeNull();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('queueEnteredAt');
  },
});
