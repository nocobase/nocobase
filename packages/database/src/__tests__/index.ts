import Database from '../database';
import { Options } from 'sequelize';

export const config: {
  [key: string]: Options;
} = {
  mysql: {
    username: 'test',
    password: 'test',
    database: 'test',
    host: '127.0.0.1',
    port: 43306,
    dialect: 'mysql',
  },
  postgres: {
    username: 'test',
    password: 'test',
    database: 'test',
    host: '127.0.0.1',
    port: 45432,
    dialect: 'postgres',
    define: {
      hooks: {
        beforeCreate(model, options) {
          
        },
      },
    },
    // logging: false,
  },
};

export function getDatabase(options: Options = {}) {
  // console.log(process.env.DIALECT);
  const db = new Database({...config[process.env.DIALECT||'postgres'], ...options});
  return db;
};
