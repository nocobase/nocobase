import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610110001_ag_add_fresh_sessions', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    const now = new Date();
    await connection.repository('agRuns').createOne({
      values: {
        id: 'existing-run',
        agentId: 'agent',
        subjectKind: 'sample',
        subjectId: '1',
        threadScope: 'main',
        actorUserId: 'owner',
        createdAt: now,
        updatedAt: now,
      },
    });
    await connection.repository('agRunRequests').createOne({
      values: {
        id: 'existing-request',
        agentId: 'agent',
        subjectKind: 'sample',
        subjectId: '1',
        threadScope: 'main',
        responsibleUserId: 'owner',
        requestedByUserId: 'other',
        inputType: 'comment',
        inputActorKind: 'user',
        inputActorId: 'other',
        inputActorName: 'Other',
        inputText: 'Review',
        expiresAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    for (const name of ['agRuns', 'agRunRequests'])
      await expectCollection(name).toHaveField('freshSession', {
        type: 'boolean',
        nullable: false,
      });
    for (const name of ['agRuns', 'agRunRequests'])
      expect(
        (
          await connection.repository(name).findOne({
            filter: {
              id: name === 'agRuns' ? 'existing-run' : 'existing-request',
            },
          })
        )?.freshSession,
      ).toBe(false);
    await expectCollection('agRuns').toHaveField('gitCredentialUrls');
  },
  down: async ({ expectCollection }) => {
    for (const name of ['agRuns', 'agRunRequests'])
      await expectCollection(name).not.toHaveField('freshSession');
    await expectCollection('agRuns').toHaveField('gitCredentialUrls');
  },
});
