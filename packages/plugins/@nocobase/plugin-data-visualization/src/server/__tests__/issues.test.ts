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

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth', 'data-visualization', 'data-source-manager', 'acl', 'error-handler', 'field-sort'],
    });
    db = app.db;
  });

  afterAll(async () => {
    await app.destroy();
  });

  test('query with nested m2m filter', async () => {
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
});
