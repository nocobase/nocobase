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
    'pg_read_file',
    'pg_read_binary_file',
    'pg_stat_file',
    'pg_ls_dir',
    'pg_logdir_ls',
    'pg_terminate_backend',
    'pg_cancel_backend',
    'current_setting',
    'set_config',
    'pg_reload_conf',
    'pg_sleep',
    'generate_series',

    // MySQL
    'LOAD_FILE',
    'BENCHMARK',
    '@@global.',
    '@@session.',

    // SQLite
    'sqlite3_load_extension',
    'load_extension',
  ];
  sql = sql.trim().split(';').shift();
  if (!/^select/i.test(sql) && !/^with([\s\S]+)select([\s\S]+)/i.test(sql)) {
    throw new Error('Only supports SELECT statements or WITH clauses');
  }
  if (dangerKeywords.some((keyword) => sql.toLowerCase().includes(keyword.toLowerCase()))) {
    throw new Error('SQL statements contain dangerous keywords');
  }
};
