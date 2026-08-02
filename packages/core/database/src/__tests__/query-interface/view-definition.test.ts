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

describe('view query interfaces', () => {
  it('should parameterize the PostgreSQL view list schema', async () => {
    const schema = "public' UNION SELECT current_database(),current_user,version()--";
    const query = vi.fn().mockResolvedValue([]);
    const db = {
      options: {},
      sequelize: {
        getQueryInterface: () => ({}),
        query,
      },
    } as unknown as Database;
    const queryInterface = new PostgresQueryInterface(db);

    await queryInterface.listViews({ schema });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE schemaname = :targetSchema'), {
      replacements: {
        targetSchema: schema,
      },
      type: 'SELECT',
    });
    expect(query.mock.calls[0][0]).not.toContain(schema);
  });

  it('should parameterize PostgreSQL view metadata queries with the configured schema', async () => {
    const query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('view_column_usage')) {
        return [];
      }

      return [{ definition: 'SELECT 1 AS safe_field' }];
    });
    const db = {
      options: {
        schema: 'tenant',
      },
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
      viewName,
    });

    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE view_schema = :schema'), {
      replacements: {
        schema: 'tenant',
        viewName,
      },
      type: 'SELECT',
    });
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining("format('%I.%I', :schema, :viewName)"), {
      replacements: {
        schema: 'tenant',
        viewName,
      },
      type: 'SELECT',
    });
    expect(query.mock.calls[0][0]).not.toContain(viewName);
    expect(query.mock.calls[1][0]).not.toContain(viewName);
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

    expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE name = :viewName'), {
      replacements: {
        viewName,
      },
      type: 'SELECT',
    });
    expect(query.mock.calls[0][0]).not.toContain(viewName);
  });
});
