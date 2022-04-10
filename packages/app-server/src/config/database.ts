import { IDatabaseOptions } from '@nocobase/database';

const dialect = process.env.DB_DIALECT as any;

let databaseConfig: IDatabaseOptions = {
  dialect,
  logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
};

if (dialect === 'sqlite') {
  databaseConfig = {
    ...databaseConfig,
    storage: process.env.DB_STORAGE,
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
