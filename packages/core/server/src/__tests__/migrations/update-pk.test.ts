/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20250902230900-update-primary-keys';

describe('update pk', () => {
  let app: MockServer;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      version: '1.9.0-alpha.1',
      plugins: ['data-source-main', 'data-source-manager', 'error-handler', 'field-sort'],
    });
  });

  afterEach(async () => {
    // await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('update primary keys', async () => {
    const collectionRepo = app.db.getRepository('collections');
    const collection = app.db.collection({
      name: 'departments',
      fields: [
        {
          name: 'id',
          type: 'bigInt',
          autoIncrement: true,
          primaryKey: true,
        },
      ],
    });
    await collection.sync();
    // @ts-ignore
    await collectionRepo.db2cm('departments');
    const fieldRepo = app.db.getRepository('fields');
    const field1 = await fieldRepo.findOne({
      filter: {
        collectionName: 'departments',
        name: 'id',
      },
    });
    expect(field1.options.autoIncrement).toBe(true);
    expect(field1.type).toBe('bigInt');
    const migration = new Migration({
      // @ts-ignore
      app,
      db: app.db,
    });
    await migration.up();
    const field2 = await fieldRepo.findOne({
      filter: {
        collectionName: 'departments',
        name: 'id',
      },
    });
    expect(field2.options.autoIncrement).toBeUndefined();
    expect(field2.type).toBe('snowflakeId');
  });
});
