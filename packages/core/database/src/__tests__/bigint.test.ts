/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe.skipIf(process.env['DB_DIALECT'] === 'sqlite')('collection', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({
      logging: console.log,
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should using bigint for id field', async () => {
    const collection = db.collection({
      name: 'users',
      fields: [{ type: 'hasOne', name: 'profile' }],
    });

    await db.sync();
    const tableInfo = await db.sequelize.getQueryInterface().describeTable(collection.model.tableName);

    if (db.inDialect('mariadb')) {
      expect(tableInfo['id'].type).toBe('BIGINT(20)');
    } else {
      expect(tableInfo['id'].type).toBe('BIGINT');
    }

    const profile = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    await db.sync();

    const profileTableInfo = await db.sequelize.getQueryInterface().describeTable(profile.model.tableName);

    if (db.inDialect('mariadb')) {
      expect(profileTableInfo[profile.model.rawAttributes['userId'].field].type).toBe('BIGINT(20)');
    } else {
      expect(profileTableInfo[profile.model.rawAttributes['userId'].field].type).toBe('BIGINT');
    }
  });

  it('should handle with number bigger than javascript MAX_SAFE_INTEGER ', async () => {
    const Test = db.collection({
      name: 'test',
      autoGenId: false,
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
        },
      ],
    });

    await db.sync();

    await Test.repository.create({
      values: {
        id: '35809622393264128',
      },
    });

    const item = await Test.repository.findOne();

    expect(item.toJSON()['id']).toBe('35809622393264128');
  });

  it('should return number type when bigint is less than MAX_SAFE_INTEGER', async () => {
    const Test = db.collection({
      name: 'test',
      autoGenId: false,
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
        },
        {
          type: 'bigInt',
          name: 'id2',
        },
      ],
    });

    await db.sync();

    await Test.repository.create({
      values: [
        {
          id: '123456',
          id2: '35809622393264128',
        },
        {
          id: '35809622393264128',
          id2: '123456',
        },
      ],
    });

    const item = await Test.repository.findOne();

    expect(item.toJSON()['id']).toBe(123456);
    expect(item.id).toBe(123456);
    expect(item['id']).toBe(123456);

    const items = await Test.repository.find({
      raw: true,
    });

    expect(items[0]['id']).toBe(123456);
  });
});
