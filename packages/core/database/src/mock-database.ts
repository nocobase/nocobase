import { merge, uid } from '@nocobase/utils';
import { resolve } from 'path';
import { Database, IDatabaseOptions } from './database';
import fetch from 'node-fetch';
import path from 'path';
import { nanoid } from 'nanoid';
export class MockDatabase extends Database {
  constructor(options: IDatabaseOptions) {
    super({
      storage: ':memory:',
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

  if (process.env['DB_TEST_PREFIX']) {
    let configKey = 'database';
    if (dbOptions.dialect === 'sqlite') {
      configKey = 'storage';
    } else {
      configKey = 'database';
    }

    if (dbOptions[configKey] && !dbOptions[configKey].includes(process.env['DB_TEST_PREFIX'])) {
      const instanceId = nanoid();
      const databaseName = `${process.env['DB_TEST_PREFIX']}_${instanceId}`;

      if (dbOptions.dialect === 'sqlite') {
        dbOptions.storage = path.resolve(path.dirname(dbOptions.storage), databaseName);
      } else {
        dbOptions.database = databaseName;
      }
    }
  }

  const db = new MockDatabase(dbOptions);

  return db;
}
