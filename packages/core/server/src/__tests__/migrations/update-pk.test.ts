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
    const collection1 = app.db.getCollection('departments');
    const field1 = collection1.getField('id');
    expect(field1.options.autoIncrement).toBe(true);
    const migration = new Migration({
      // @ts-ignore
      app,
      db: app.db,
    });
    await migration.up();
    const field2 = collection1.getField('id');
    expect(field2.options.autoIncrement).toBe(true);
  });
});
