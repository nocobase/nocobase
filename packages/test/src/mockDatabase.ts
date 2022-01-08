import merge from 'deepmerge';
import Database, { DatabaseOptions } from '@nocobase/database';

export function generatePrefixByPath() {
  const { id } = require.main;
  const key = id
    .replace(`${process.env.PWD}/packages`, '')
    .replace(/src\/__tests__/g, '')
    .replace('.test.ts', '')
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_');
  return key;
}

export function getConfig(config = {}, options?: any): DatabaseOptions {
  return merge(
    {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      storage: process.env.DB_STORAGE,
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: process.env.DB_DIALECT,
      logging: process.env.DB_LOG_SQL === 'on',
      sync: {
        force: true,
        alter: {
          drop: true,
        },
      },
      hooks: {
        beforeDefine(model, options) {
          options.tableName = `${generatePrefixByPath()}_${options.tableName || options.name.plural}`;
        },
      },
    },
    config || {},
    options,
  ) as any;
}

export function mockDatabase(options?: DatabaseOptions): Database {
  return new Database(getConfig(options));
}
