import { describe, expect, it } from 'vitest';

import { classifySql } from '../../server/sql.js';

describe('classifySql', () => {
  it.each([
    'select * from "users" where "id" = ?',
    'SELECT 1 FOR UPDATE',
    'with recent as (select * from runs) select * from recent',
    'begin',
    'COMMIT',
    'rollback to savepoint trx1',
    'release savepoint trx1',
    'PRAGMA foreign_keys = ON',
    "set local statement_timeout = '5s'",
    "select 'delete from users' as text",
    'select 1 -- delete from users',
    '(select 1) union (select 2)',
  ])('treats %j as a read', (sql) => {
    expect(classifySql(sql)).toEqual([]);
  });

  it.each([
    ['insert into "session" ("id") values (?)', 'insert', 'session'],
    ['INSERT OR REPLACE INTO `user_prefs` VALUES (?)', 'insert', 'user_prefs'],
    ['update "public"."session" set "expiresAt" = ?', 'update', 'session'],
    ['delete from [dbo].[Notes] where 1 = 1', 'delete', 'notes'],
    ['truncate table items', 'truncate', 'items'],
    ['replace into items values (1)', 'replace', 'items'],
    [
      'with gone as (delete from runs returning id) select * from gone',
      'with',
      'runs',
    ],
  ])('names the table %j writes', (sql, statement, table) => {
    expect(classifySql(sql)).toEqual([{ statement, table }]);
  });

  it.each([
    ['create table items (id int)', 'create'],
    ['ALTER TABLE items ADD COLUMN name text', 'alter'],
    ['drop table items', 'drop'],
    ['vacuum', 'vacuum'],
    ['call refresh_stats()', 'call'],
  ])('treats %j as a write without a table', (sql, statement) => {
    expect(classifySql(sql)).toEqual([{ statement }]);
  });

  it('finds a write hidden after a read in the same text', () => {
    expect(classifySql('select 1; delete from users')).toEqual([
      { statement: 'delete', table: 'users' },
    ]);
  });
});
