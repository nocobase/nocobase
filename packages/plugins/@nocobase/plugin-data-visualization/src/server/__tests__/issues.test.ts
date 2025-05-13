/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Repository } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import compose from 'koa-compose';
import { parseFieldAndAssociations, queryData } from '../actions/query';
import { createQueryParser } from '../query-parser';

describe('api', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['data-visualization'],
    });
    db = app.db;
    db.collection({
      name: 'roles',
      createdBy: false,
      updatedBy: false,
      fields: [
        {
          name: 'name',
          type: 'string',
        },
      ],
    });
    db.collection({
      name: 'users',
      createdBy: false,
      updatedBy: false,
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'createdBy',
          type: 'belongsTo',
          target: 'users',
          foreignKey: 'createdById',
          targetKey: 'id',
        },
        {
          name: 'roles',
          type: 'belongsToMany',
          target: 'roles',
          through: 'rolesUsers',
        },
        {
          name: 'departments',
          type: 'belongsToMany',
          target: 'departments',
          through: 'departmentsUsers',
        },
      ],
    });
    db.collection({
      name: 'departments',
      createdBy: false,
      updatedBy: false,
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'owners',
          type: 'belongsToMany',
          target: 'users',
          through: 'departmentsUsers',
        },
      ],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  test('query with nested m2m filter 1', async () => {
    const ctx = {
      app,
      db,
      action: {
        params: {
          values: {
            collection: 'users',
            measures: [
              {
                field: ['id'],
                aggregation: 'count',
                alias: 'id',
              },
            ],
            filter: {
              $and: [
                {
                  createdBy: {
                    roles: {
                      name: {
                        $includes: 'member',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    } as any;
    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
  });

  test('query with nested m2m filter 2', async () => {
    const ctx = {
      app,
      db,
      action: {
        params: {
          values: {
            collection: 'users',
            measures: [
              {
                field: ['id'],
                aggregation: 'count',
                alias: 'id',
              },
            ],
            filter: {
              $and: [
                {
                  departments: {
                    owners: {
                      id: {
                        $eq: 1,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    } as any;
    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
  });
});
