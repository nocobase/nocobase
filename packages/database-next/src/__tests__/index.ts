import merge from 'deepmerge';
import { Database, DatabaseOptions } from '../database';

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
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      hooks: {
        beforeDefine(model, options) {
          options.tableName = `${generatePrefixByPath()}_${
            options.tableName || options.modelName || options.name.plural
          }`;
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
