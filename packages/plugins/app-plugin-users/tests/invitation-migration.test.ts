import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610100001_users_invitation_email_verification', {
  sources: ['app-plugin-authentication', 'app-plugin-users'].map((name) => ({
    packageName: `@nocobase/${name}`,
    directory: path.resolve(
      import.meta.dirname,
      `../../${name}/database/migrations`,
    ),
  })),
  before: async ({ connection }) => {
    await connection.repository('userInvitations').createOne({
      values: {
        id: 'legacy',
        email: 'legacy@example.test',
        tokenHash: 'a'.repeat(64),
        roleScopes: {},
        data: {},
        summary: [],
        status: 'pending',
        invitedById: 'inviter',
        expiresAt: '2026-10-17T00:00:00.000Z',
        createdAt: '2026-10-10T00:00:00.000Z',
        updatedAt: '2026-10-10T00:00:00.000Z',
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('userInvitationVerifications').toHaveIndex(
      ['tokenHash'],
      { unique: true },
    );
    await expectCollection('userInvitationVerifications').toHaveIndex([
      'invitationId',
    ]);
    await expectCollection('userInvitations').toHaveField('verificationSentAt');
    expect(
      await connection
        .repository('userInvitations')
        .findOne({ filter: { id: 'legacy' } }),
    ).toMatchObject({
      tokenHash: 'a'.repeat(64),
      status: 'pending',
      verificationSentAt: null,
      manualDelivery: false,
    });
  },
  down: async ({ connection }) => {
    expect(
      await connection
        .repository('userInvitations')
        .findOne({ filter: { id: 'legacy' } }),
    ).toMatchObject({
      tokenHash: 'a'.repeat(64),
      status: 'pending',
    });
  },
});
