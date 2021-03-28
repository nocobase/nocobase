import Database from '../database';
import { Dialect } from 'sequelize';

function getTestKey() {
  const { id } = require.main;
  const key = id
    // .replace(process.env.PWD, '')
    .replace(`${process.env.PWD}/packages`, '')
    .replace(/src\/__tests__/g, '')
    .replace('.test.ts', '')
    .replace(/[^\w]/g, '_');
  return key
}

const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT, 10),
  dialect: process.env.DB_DIALECT as Dialect,
  define: {
    hooks: {
      beforeCreate(model, options) {

      },
    },
  },
  logging: process.env.DB_LOG_SQL === 'on' ? console.log : false
};

export function getDatabase() {
  return new Database({
    ...config,
    sync: {
      force: true,
      alter: {
        drop: true,
      }
    },
    hooks: {
      beforeDefine(columns, model) {
        model.tableName = `${getTestKey()}_${model.tableName || model.name.plural}`;
      }
    }
  });
};
