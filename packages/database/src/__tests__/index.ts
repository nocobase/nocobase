import { uid } from '@nocobase/utils';
import merge from 'deepmerge';
import { Sequelize } from 'sequelize';
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

export function getConfig(config: any = {}, options?: any): DatabaseOptions {
  if (process.env.DB_DIALECT === 'sqlite') {
    const defaults = {
      dialect: process.env.DB_DIALECT as any,
      storage: ':memory:',
      logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
      // sync: {
      //   force: true,
      // },
      hooks: {
        beforeDefine(model, options) {
          options.tableName = `${generatePrefixByPath()}_${
            options.tableName || options.modelName || options.name.plural
          }`;
        },
      },
    };
    return merge(defaults, config, options);
  }
  const database = `mock_${uid()}`;
  let dbExists = false;
  const defaults = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
    dialect: process.env.DB_DIALECT as any,
    logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    hooks: {
      beforeDefine(model, options) {
        options.tableName = `${generatePrefixByPath()}_${
          options.tableName || options.modelName || options.name.plural
        }`;
      },
      async beforeSync({ sequelize }: any) {
        if (config.database) {
          return;
        }
        if (dbExists) {
          return;
        }
        return;
        const db = new Sequelize({
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT as any,
          dialect: process.env.DB_DIALECT as any,
          logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
          dialectOptions: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
          },
        });
        await db.query(`CREATE DATABASE "${database}";`);
        await db.close();
        sequelize.options.database = database;
        sequelize.config.database = database;
        const ConnectionManager = sequelize.dialect.connectionManager.constructor;
        const connectionManager = new ConnectionManager(sequelize.dialect, sequelize);
        sequelize.dialect.connectionManager = connectionManager;
        sequelize.connectionManager = connectionManager;
        dbExists = true;
      },
    },
  };
  return merge(defaults, config, options);
}

export function mockDatabase(options?: DatabaseOptions): Database {
  return new Database(getConfig(options));
}
