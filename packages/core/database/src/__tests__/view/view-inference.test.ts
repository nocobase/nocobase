/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { ViewFieldInference } from '../../view/view-inference';

describe('view inference', function () {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should infer field with alias', async () => {
    if (db.options.dialect !== 'postgres') return;

    const UserCollection = db.collection({
      name: 'users',
      fields: [
        {
          name: 'id',
          type: 'bigInt',
          interface: 'bigInt',
        },
        {
          name: 'name',
          type: 'string',
          interface: 'test',
        },
      ],
    });

    await db.sync();

    const viewName = 'test_view';

    const dropViewSQL = `DROP VIEW IF EXISTS ${viewName}`;
    await db.sequelize.query(dropViewSQL);

    const viewSQL = `
       CREATE VIEW ${viewName} as SELECT 1 as const_field, users.id as user_id_field, users.name FROM ${UserCollection.quotedTableName()} as users
    `;

    await db.sequelize.query(viewSQL);

    const inferredFields = await ViewFieldInference.inferFields({
      db,
      viewName,
      viewSchema: 'public',
    });

    expect(inferredFields['user_id_field'].source).toBe('users.id');
    expect(inferredFields['name'].source).toBe('users.name');
  });

  it('should infer collection fields', async () => {
    const UserCollection = db.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
          interface: 'test',
        },
        {
          name: 'age',
          type: 'integer',
          interface: 'test',
        },
        {
          name: 'profile',
          type: 'json',
          interface: 'test',
        },
        {
          name: 'posts',
          type: 'hasMany',
          interface: 'test',
        },
      ],
    });

    const PostCollection = db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
          interface: 'test',
        },
        {
          name: 'user',
          type: 'belongsTo',
          interface: 'test',
        },
      ],
    });

    await db.sync();

    const viewName = 'user_posts';

    const dropViewSQL = `DROP VIEW IF EXISTS ${viewName}`;
    await db.sequelize.query(dropViewSQL);

    const viewSQL = `
       CREATE VIEW ${viewName} as SELECT 1 as const_field, users.* FROM ${UserCollection.quotedTableName()} as users
    `;

    await db.sequelize.query(viewSQL);

    const inferredFields = await ViewFieldInference.inferFields({
      db,
      viewName,
      viewSchema: 'public',
    });

    const createdAt = UserCollection.model.rawAttributes['createdAt'].field;
    expect(inferredFields[createdAt]['field']).toBeDefined();

    if (db.isMySQLCompatibleDialect()) {
      expect(inferredFields[createdAt]['type']).toBe('datetimeNoTz');
    } else {
      expect(inferredFields[createdAt]['type']).toBe('datetimeTz');
    }

    if (db.options.dialect == 'sqlite') {
      expect(inferredFields['name']).toMatchObject({
        name: 'name',
        type: 'string',
      });
    } else {
      expect(inferredFields['name']).toMatchObject({
        name: 'name',
        type: 'string',
        source: 'users.name',
      });

      expect(inferredFields['const_field']).toMatchObject({
        name: 'const_field',
        type: 'integer',
      });
    }

    await db.sequelize.query(dropViewSQL);
  });
});
