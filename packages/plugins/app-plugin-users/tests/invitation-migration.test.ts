import { fileURLToPath } from 'node:url';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import { createMigrator } from '@nocobase/db';
import { expect } from 'vitest';

const test = createDatabaseTest();

test('upgrades existing invitations and reverses only the verification schema', async ({
  database,
  connection,
  expectCollection,
}) => {
  await createMigrator({
    database,
    packageName: '@nocobase/app-plugin-authentication',
    directory: fileURLToPath(
      new URL(
        '../../app-plugin-authentication/database/migrations',
        import.meta.url,
      ),
    ),
  }).latest();
  const migrator = createMigrator({
    database,
    packageName: '@nocobase/app-plugin-users',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  });
  await migrator.upTo('202610020201_create_user_preferences');
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
  await migrator.latest();
  await expectCollection('userInvitationVerifications').toExist();
  await expectCollection('userInvitations').toHaveField('verificationSentAt');
  expect(
    await connection
      .repository('userInvitations')
      .findOne({ filter: { id: 'legacy' } }),
  ).toMatchObject({
    tokenHash: 'a'.repeat(64),
    status: 'pending',
    verificationSentAt: null,
  });
  await expect(migrator.rollback()).resolves.toMatchObject({
    rolledBack: ['202610100001_invitation_email_verification'],
  });
  await expectCollection('userInvitationVerifications').not.toExist();
  await expectCollection('userInvitations').not.toHaveField(
    'verificationSentAt',
  );
  expect(
    await connection
      .repository('userInvitations')
      .findOne({ filter: { id: 'legacy' } }),
  ).toMatchObject({ tokenHash: 'a'.repeat(64), status: 'pending' });
  await migrator.latest();
  await expectCollection('userInvitationVerifications').toExist();
});
