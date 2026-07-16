/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '../../database';
import MysqlQueryInterface from '../../query-interface/mysql-query-interface';
import PostgresQueryInterface from '../../query-interface/postgres-query-interface';
import SqliteQueryInterface from '../../query-interface/sqlite-query-interface';

const viewName = "x.v1' UNION SELECT 1,2,3,4,5,6,7--";

describe('view definition query interface', () => {
  it('should parameterize PostgreSQL view metadata queries', async () => {
    const query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('view_column_usage')) {
        return [];
      }

      return [{ definition: 'SELECT 1 AS safe_field' }];
    });
    const db = {
      options: {},
      sequelize: {
        getQueryInterface: () => ({}),
        query,
      },
    } as unknown as Database;
    const queryInterface = new PostgresQueryInterface(db);
    vi.spyOn(queryInterface, 'parseSQL').mockReturnValue({
      ast: [{ columns: [] }],
    });

    await queryInterface.viewColumnUsage({
      schema: 'public',
      viewName,
    });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.not.stringContaining(viewName),
      expect.objectContaining({
        replacements: {
          schema: 'public',
          viewName,
        },
      }),
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.not.stringContaining(viewName),
      expect.objectContaining({
        replacements: {
          schema: 'public',
          viewName,
        },
      }),
    );
  });

  it('should quote MySQL view identifiers', async () => {
    const query = vi.fn().mockResolvedValue([
      {
        'Create View': 'CREATE VIEW `safe-view` AS SELECT 1 AS safe_field',
      },
    ]);
    const quoteTable = vi.fn().mockReturnValue('`safe-view`');
    const db = {
      sequelize: {
        getQueryInterface: () => ({}),
        query,
      },
      utils: {
        quoteTable,
      },
    } as unknown as Database;
    const queryInterface = new MysqlQueryInterface(db);

    await queryInterface.viewDef({
      schema: 'tenant',
      viewName,
    });

    expect(quoteTable).toHaveBeenCalledWith({
      schema: 'tenant',
      tableName: viewName,
    });
    expect(query).toHaveBeenCalledWith('SHOW CREATE VIEW `safe-view`', { type: 'SELECT' });
  });

  it('should parameterize SQLite view definition queries', async () => {
    const query = vi.fn().mockResolvedValue([
      {
        sql: 'CREATE VIEW "safe-view" AS SELECT 1 AS safe_field',
      },
    ]);
    const db = {
      sequelize: {
        getQueryInterface: () => ({}),
        query,
      },
    } as unknown as Database;
    const queryInterface = new SqliteQueryInterface(db);

    await queryInterface.viewDef({ viewName });

    expect(query).toHaveBeenCalledWith(expect.not.stringContaining(viewName), {
      replacements: {
        viewName,
      },
      type: 'SELECT',
    });
  });
});
