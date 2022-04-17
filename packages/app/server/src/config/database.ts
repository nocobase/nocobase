import { IDatabaseOptions } from '@nocobase/database';
import { resolve } from 'path';

const dialect = process.env.DB_DIALECT as any;

let databaseConfig: IDatabaseOptions = {
  dialect,
  logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
};

if (dialect === 'sqlite') {
  databaseConfig = {
    ...databaseConfig,
    storage: resolve(process.cwd(), process.env.DB_STORAGE || 'db.sqlite'),
  };
} else {
  databaseConfig = {
    ...databaseConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
  };
}

export default databaseConfig;
