import path from 'path';
import { DatabaseOptions } from '@nocobase/database';

export default {
  sqlite: {
    dialect: 'sqlite',
    dialectModule: require('sqlite3'),
    storage: process.env.DB_STORAGE || path.resolve(process.cwd(), './db.sqlite'),
    logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
  },
  postgres: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
    dialect: 'postgres',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
    sync: {
      force: false,
      alter: {
        drop: false,
      },
    },
  },
} as {
  [key: string]: DatabaseOptions,
};
