import { merge, uid } from '@nocobase/utils';
import { resolve } from 'path';
import { Database, IDatabaseOptions } from './database';

export class MockDatabase extends Database {
  constructor(options: IDatabaseOptions) {
    super({
      storage: ':memory:',
      tablePrefix: `mock_${uid(6)}_`,
      dialect: 'sqlite',
      ...options,
    });
  }
}

export function getConfigByEnv() {
  const options = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'sqlite',
    logging: process.env.DB_LOGGING === 'on' ? customLogger : false,
    storage:
      process.env.DB_STORAGE && process.env.DB_STORAGE !== ':memory:'
        ? resolve(process.cwd(), process.env.DB_STORAGE)
        : ':memory:',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    timezone: process.env.DB_TIMEZONE,
    underscored: process.env.DB_UNDERSCORED === 'true',
    schema: process.env.DB_SCHEMA !== 'public' ? process.env.DB_SCHEMA : undefined,
    dialectOptions: {},
  };

  if (process.env.DB_DIALECT == 'postgres') {
    options.dialectOptions['application_name'] = 'nocobase.main';
  }

  return options;
}

function customLogger(queryString, queryObject) {
  console.log(queryString); // outputs a string
  if (queryObject.bind) {
    console.log(queryObject.bind); // outputs an array
  }
}

export function mockDatabase(options: IDatabaseOptions = {}): MockDatabase {
  const dbOptions = merge(getConfigByEnv(), options) as any;
  return new MockDatabase(dbOptions);
}
