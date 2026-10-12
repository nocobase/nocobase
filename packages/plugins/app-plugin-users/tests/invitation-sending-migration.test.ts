import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const sources = [
  {
    packageName: '@nocobase/app-plugin-authentication',
    directory: path.resolve(
      import.meta.dirname,
      '../../app-plugin-authentication/database/migrations',
    ),
  },
  {
    packageName: '@nocobase/app-plugin-users',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];
describeMigration('202610220001_user_invitation_sending', {
  sources,
  before: async ({ connection }) => {
    const now = new Date().toISOString();
    for (const id of ['sent', 'unknown'])
      await connection.repository('userInvitations').createOne({
        values: {
          id,
          email: `${id}@example.test`,
          tokenHash: id,
          roleScopes: {},
          data: {},
          summary: [],
          status: 'pending',
          invitedById: 'owner',
          expiresAt: now,
          sentAt: id === 'sent' ? now : null,
          sendError: null,
          acceptedUserId: null,
          acceptedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('userInvitations').toHaveField('sendClaim', {
      nullable: true,
    });
    await expectCollection('userInvitations').toHaveField('sendStatus', {
      nullable: false,
    });
    const rows = await connection.repository('userInvitations').findMany();
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sent',
          sendStatus: 'sent',
          sendClaim: 'sent',
        }),
        expect.objectContaining({
          id: 'unknown',
          sendStatus: 'unknown',
          sendClaim: 'unknown',
        }),
      ]),
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('userInvitations').not.toHaveField('sendClaim');
    await expectCollection('userInvitations').not.toHaveField('sendStatus');
  },
});
