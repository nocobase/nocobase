import { merge } from '@nocobase/utils';
import { customAlphabet } from 'nanoid';
import fetch from 'node-fetch';
import path from 'path';
import { Database, IDatabaseOptions } from './database';

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
    storage: process.env.DB_STORAGE,
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

    const shouldChange = () => {
      if (dbOptions.dialect === 'sqlite') {
        return !dbOptions[configKey].includes(process.env['DB_TEST_PREFIX']);
      }

      return !dbOptions[configKey].startsWith(process.env['DB_TEST_PREFIX']);
    };

    if (dbOptions[configKey] && shouldChange()) {
      const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

      const instanceId = `d_${nanoid()}`;
      const databaseName = `${process.env['DB_TEST_PREFIX']}_${instanceId}`;

      if (dbOptions.dialect === 'sqlite') {
        dbOptions.storage = path.resolve(path.dirname(dbOptions.storage), databaseName);
      } else {
        dbOptions.database = databaseName;
      }
    }

    if (process.env['DB_TEST_DISTRIBUTOR_PORT']) {
      dbOptions.hooks = dbOptions.hooks || {};

      dbOptions.hooks.beforeConnect = async (config) => {
        const url = `http://127.0.0.1:${process.env['DB_TEST_DISTRIBUTOR_PORT']}/acquire?via=${db.instanceId}&name=${config.database}`;
        await fetch(url);
      };
    }
  }

  const db = new MockDatabase(dbOptions);

  return db;
}
