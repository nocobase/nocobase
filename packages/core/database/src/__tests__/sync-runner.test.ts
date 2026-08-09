/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '../database';
import { SyncRunner } from '../sync-runner';

describe('SyncRunner', () => {
  let db: Database;

  afterEach(async () => {
    await db?.close();
  });

  test('filters indexes that already exist by name before sync', async () => {
    db = new Database({
      dialect: 'postgres',
      database: 'nocobase',
      username: 'nocobase',
      password: 'nocobase',
      host: '127.0.0.1',
      port: 5432,
      underscored: true,
      logging: false,
    });

    const collection = db.collection({
      name: 'rolesUsers',
      fields: [
        {
          type: 'bigInt',
          name: 'userId',
          index: true,
        },
      ],
    });

    const queryInterface = db.sequelize.getQueryInterface();
    vi.spyOn(queryInterface, 'showIndex').mockResolvedValue([
      {
        name: 'roles_users_user_id',
        fields: [{ attribute: 'user_id' }],
      },
    ]);

    // @ts-ignore
    expect(collection.model._indexes).toHaveLength(1);

    const runner = new SyncRunner(collection.model);
    await runner['filterExistingIndexesBeforeSync']({});

    // @ts-ignore
    expect(collection.model._indexes).toHaveLength(0);
  });

  test('deduplicates model indexes before sync', async () => {
    db = new Database({
      dialect: 'postgres',
      database: 'nocobase',
      username: 'nocobase',
      password: 'nocobase',
      host: '127.0.0.1',
      port: 5432,
      underscored: true,
      logging: false,
    });

    const collection = db.collection({
      name: 'rolesUsers',
      fields: [
        {
          type: 'bigInt',
          name: 'userId',
        },
      ],
    });

    // @ts-ignore
    collection.model._indexes = [
      { fields: ['user_id'], name: 'roles_users_user_id' },
      { fields: ['user_id'], name: 'roles_users_user_id' },
    ];

    const queryInterface = db.sequelize.getQueryInterface();
    vi.spyOn(queryInterface, 'showIndex').mockResolvedValue([]);

    const runner = new SyncRunner(collection.model);
    await runner['filterExistingIndexesBeforeSync']({});

    // @ts-ignore
    expect(collection.model._indexes).toHaveLength(1);
  });
});
