import path from 'path';
import dotenv from 'dotenv';
import Api from '@nocobase/server/src';
import actions from '@nocobase/actions/src';
import { middlewares } from '@nocobase/actions/src';

// @ts-ignore
const sync = global.sync || {
  force: true,
  alter: {
    drop: true,
  },
};

console.log('process.env.NOCOBASE_ENV', process.env.NOCOBASE_ENV);

dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
});

const api = Api.create({
  database: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
    define: {},
    sync,
  },
  resourcer: {
    prefix: '/api',
  },
});

const plugins = [
  '@nocobase/plugin-collections',
  '@nocobase/plugin-action-logs',
  '@nocobase/plugin-pages',
  '@nocobase/plugin-users',
  '@nocobase/plugin-file-manager',
  '@nocobase/plugin-permissions',
  '@nocobase/plugin-automations',
  '@nocobase/plugin-china-region',
];

for (const plugin of plugins) {
  api.registerPlugin(plugin, [require(`${plugin}/src/server`).default]);
}

export default api;
