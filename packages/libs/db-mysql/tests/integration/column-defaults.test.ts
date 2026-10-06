import { createDatabaseManager } from '@nocobase/db';
import type { Knex } from 'knex';
import { describe, expect, it } from 'vitest';
import mysql from '../../src/index.js';

/**
 * The inspector reads a column's default as the value it was declared with, and an expression default as no value,
 * on MySQL and on MariaDB alike, although the two report `column_default` in different forms. The table is created in
 * SQL because the Builder declares neither a temporal default nor an expression one.
 */
describe('MySQL column defaults', () => {
  it('reads temporal and character literals as values and expressions as none', async () => {
    const database = createDatabaseManager({
      connections: {
        main: mysql({
          host: process.env.MYSQL_HOST ?? '127.0.0.1',
          port: Number(process.env.MYSQL_PORT ?? 13306),
          username: process.env.MYSQL_USER ?? 'nocobase',
          password: process.env.MYSQL_PASSWORD ?? 'nocobase',
          database: process.env.MYSQL_DATABASE ?? 'nocobase_collection_builder',
        }),
      },
    });
    const tableName = 'inspector_column_defaults';
    try {
      const client = await database.connection().client<Knex>();
      await client.raw('drop table if exists ??', [tableName]);
      await client.raw(
        `
          create table ?? (
            id int primary key,
            day date not null default '2026-01-02',
            span time not null default '-01:30:00',
            stamp datetime(3) not null default current_timestamp(3),
            today date default (curdate()),
            token varchar(36) default (uuid()),
            status varchar(20) not null default 'draft',
            quoted varchar(20) not null default 'it''s \\\\ x',
            word varchar(20) default 'NULL',
            optional varchar(20)
          )
        `,
        [tableName],
      );

      const collection = await database
        .connection()
        .schemaInspector.getPhysicalCollection({ tableName });
      const defaults = Object.fromEntries(
        (collection?.columns ?? []).map((column) => [
          column.columnName,
          column.default,
        ]),
      );
      expect(defaults.day).toMatchObject({ value: '2026-01-02' });
      expect(defaults.span).toMatchObject({ value: '-01:30:00' });
      expect(defaults.status).toMatchObject({ value: 'draft' });
      expect(defaults.quoted).toMatchObject({ value: String.raw`it's \ x` });
      expect(defaults.word).toMatchObject({ value: 'NULL' });
      expect(
        Object.fromEntries(
          ['stamp', 'today', 'token'].map((name) => [
            name,
            defaults[name] !== undefined && !('value' in defaults[name]),
          ]),
        ),
      ).toEqual({ stamp: true, today: true, token: true });
      expect(defaults.optional).toBeUndefined();
    } finally {
      const client = await database.connection().client<Knex>();
      await client.raw('drop table if exists ??', [tableName]);
      await database.destroy();
    }
  });
});
