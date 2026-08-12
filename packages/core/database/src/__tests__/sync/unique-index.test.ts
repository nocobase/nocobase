/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import { waitSecond } from '@nocobase/test';

describe('unique index', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should sync multiple column unique index', async () => {
    const User = db.collection({
      name: 'users',
      indexes: [
        {
          unique: true,
          fields: ['userName', 'userEmail'],
        },
      ],
      fields: [
        { type: 'string', name: 'userName', defaultValue: 0 },
        { type: 'string', name: 'userEmail' },
      ],
    });

    await db.sync();

    expect(async () => {
      await User.repository.create({
        values: {
          userName: 'test',
          userEmail: 'test@nocobase.com',
        },
      });
    }).not.toThrow();

    await waitSecond(1000);
    expect(async () => {
      await User.repository.create({
        values: {
          userName: 'test',
          userEmail: 'test123@nocobase.com',
        },
      });
    }).not.toThrow();

    await waitSecond(1000);

    await expect(
      User.repository.create({
        values: {
          userName: 'test',
          userEmail: 'test@nocobase.com',
        },
      }),
    ).rejects.toThrow();
  });

  it('should preserve named unique indexes without materializing field uniqueness', async () => {
    if (!db.inDialect('sqlite')) {
      return;
    }

    const User = db.collection({
      name: 'users',
      indexes: [
        {
          name: 'users_scope_name_uq',
          unique: true,
          fields: ['scope', 'name'],
        },
        {
          name: 'users_token_uq',
          unique: true,
          fields: ['token'],
        },
      ],
      fields: [
        { type: 'string', name: 'scope' },
        { type: 'string', name: 'name' },
        { type: 'string', name: 'token' },
      ],
    });

    await db.sync();
    await db.sync();

    const indexes = await db.sequelize.getQueryInterface().showIndex(User.getTableNameWithSchema());
    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'users_scope_name_uq', unique: true }),
        expect.objectContaining({ name: 'users_token_uq', unique: true }),
      ]),
    );
    expect(User.model.rawAttributes.name.unique).not.toBe(true);
    expect(User.model.rawAttributes.token.unique).not.toBe(true);

    await User.repository.create({ values: { scope: 'main', name: 'shared', token: 'main-token' } });
    await expect(
      User.repository.create({ values: { scope: 'support', name: 'shared', token: 'support-token' } }),
    ).resolves.toBeTruthy();
    await expect(
      User.repository.create({ values: { scope: 'main', name: 'duplicate', token: 'main-token' } }),
    ).rejects.toThrow();
    await expect(
      User.repository.create({ values: { scope: 'main', name: 'shared', token: 'distinct-token' } }),
    ).rejects.toThrow();
  });

  it('should sync unique index', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'userName', unique: true },
        { type: 'string', name: 'userEmail' },
      ],
    });

    await db.sync();

    const findFieldIndex = (indexes, fieldName) => {
      const columnName = User.model.rawAttributes[fieldName].field;

      return indexes.find((index) => {
        const indexField = index.fields;
        if (!indexField) {
          return false;
        }

        if (typeof indexField == 'string') {
          return indexField === columnName;
        }

        return indexField.length == 1 && indexField[0].attribute === columnName;
      });
    };

    const userTableInfo: any = await db.sequelize.getQueryInterface().showIndex(User.getTableNameWithSchema());

    const nameUniqueIndex = findFieldIndex(userTableInfo, 'userName');
    expect(nameUniqueIndex).toBeDefined();
    const emailUniqueIndex = findFieldIndex(userTableInfo, 'userEmail');
    expect(emailUniqueIndex).toBeUndefined();

    User.setField('userName', { type: 'string', name: 'userName' });
    User.setField('userEmail', { type: 'string', name: 'userEmail', unique: true });

    await db.sync();

    const userTableInfo2: any = await db.sequelize.getQueryInterface().showIndex(User.getTableNameWithSchema());

    const nameUniqueIndex2 = findFieldIndex(userTableInfo2, 'userName');
    expect(nameUniqueIndex2).toBeUndefined();
    const emailUniqueIndex2 = findFieldIndex(userTableInfo2, 'userEmail');
    expect(emailUniqueIndex2).toBeDefined();
  });
});
