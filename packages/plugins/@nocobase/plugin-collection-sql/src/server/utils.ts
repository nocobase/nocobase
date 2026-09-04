/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const checkSQL = (sql: string) => {
  const dangerKeywords = [
    // PostgreSQL
    'pg_',
    'current_setting',
    'set_config',
    'generate_series',
    'information_schema',

    // MySQL
    'LOAD_FILE',
    'BENCHMARK',
    '@@global.',
    '@@session.',

    // SQLite
    'sqlite3_load_extension',
    'load_extension',
  ];
  sql = sql.trim();
  if (sql.endsWith(';')) {
    sql = sql.slice(0, -1);
  }
  if (sql.includes(';')) {
    throw new Error('Only supports SELECT statements or WITH clauses');
  }
  if (!/^select/i.test(sql) && !/^with([\s\S]+)select([\s\S]+)/i.test(sql)) {
    throw new Error('Only supports SELECT statements or WITH clauses');
  }
  if (dangerKeywords.some((keyword) => sql.toLowerCase().includes(keyword.toLowerCase()))) {
    throw new Error('SQL statements contain dangerous keywords');
  }
};
