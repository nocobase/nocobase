// @vitest-environment node

import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { authenticationMigrations } from './support.js';

describeMigration('202608200001_create_authentication_tables', {
  sources: authenticationMigrations,
  up: async ({ connection, expectCollection }) => {
    for (const table of ['session', 'account']) {
      const { foreignKeys } = await expectCollection(table).toExist();
      expect(foreignKeys).toEqual([]);
    }
    const collection = await connection.collections.get('account');
    expect(collection?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'providerId', nullable: false }),
        expect.objectContaining({ name: 'accountId', nullable: false }),
      ]),
    );
    const now = new Date();
    const account = {
      accountId: 'subject-1',
      providerId: 'company-a',
      userId: 'user-1',
      createdAt: now,
      updatedAt: now,
    };
    await connection.query
      .insertInto('account')
      .values({ ...account, id: 'account-1' })
      .execute();
    await connection.query
      .insertInto('account')
      .values({ ...account, id: 'account-2', providerId: 'company-b' })
      .execute();
    await expect(
      connection.query
        .insertInto('account')
        .values({ ...account, id: 'duplicate', userId: 'user-2' })
        .execute(),
    ).rejects.toThrow();
    expect(
      await connection.query
        .selectFrom('account')
        .select(['providerId', 'accountId'])
        .execute(),
    ).toHaveLength(2);
  },
  down: async ({ connection, expectCollection }) => {
    for (const table of ['user', 'session', 'account', 'verification']) {
      await expectCollection(table).not.toExist();
      expect(await connection.collections.get(table)).toBeUndefined();
    }
  },
});

describeMigration('202609080001_add_user_disabled_at', {
  sources: authenticationMigrations,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('user').toHaveField('disabledAt');
    expect(
      (await connection.collections.get('user'))?.fields?.map(
        (field) => field.name,
      ),
    ).toContain('disabledAt');
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('user').not.toHaveField('disabledAt');
    expect(
      (await connection.collections.get('user'))?.fields?.map(
        (field) => field.name,
      ),
    ).not.toContain('disabledAt');
  },
});

describeMigration('202609170002_add_user_deletion_record', {
  sources: authenticationMigrations,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('user')
      .values({
        id: 'existing',
        name: 'Existing',
        email: 'existing@example.com',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('user').toHaveField('deletedAt');
    await expectCollection('user').toHaveField('deletedBy');
    expect(
      (await connection.collections.get('user'))?.fields?.map(
        (field) => field.name,
      ),
    ).toEqual(expect.arrayContaining(['deletedAt', 'deletedBy']));
    expect(
      await connection.query
        .selectFrom('user')
        .select(['id', 'deletedAt', 'deletedBy'])
        .execute(),
    ).toEqual([{ id: 'existing', deletedAt: null, deletedBy: null }]);
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('user').not.toHaveField('deletedAt');
    await expectCollection('user').not.toHaveField('deletedBy');
    expect(
      (await connection.collections.get('user'))?.fields?.map(
        (field) => field.name,
      ),
    ).not.toContain('deletedAt');
    expect(
      await connection.query.selectFrom('user').select('id').execute(),
    ).toEqual([{ id: 'existing' }]);
  },
});
