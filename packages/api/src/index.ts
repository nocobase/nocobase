import { Application } from '@nocobase/server';
import { resolve } from 'path';

const start = Date.now();

const api = new Application({
  database: {
    storage: resolve(process.cwd(), './db.sqlite'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
    dialect: process.env.DB_DIALECT as any,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
    define: {},
    sync: {
      force: false,
      alter: {
        drop: false,
      },
    },
  },
  resourcer: {
    prefix: process.env.API_BASE_PATH || '/api/',
  },
});

const plugins = [
  '@nocobase/plugin-collection-manager',
  '@nocobase/plugin-ui-schema-storage',
  '@nocobase/plugin-ui-routes-storage',
  '@nocobase/plugin-client',
  '@nocobase/plugin-file-manager',
  '@nocobase/plugin-system-settings',
  '@nocobase/plugin-users',
  // '@nocobase/plugin-acl',
  '@nocobase/plugin-china-region',
];

for (const plugin of plugins) {
  api.plugin(require(plugin).default);
}

if (process.argv.length < 3) {
  // @ts-ignore
  process.argv.push('start', '--port', process.env.API_PORT || 12302);
}

console.log(process.argv);

api.parse(process.argv).then(() => {
  console.log(`${new Date().toLocaleTimeString()} Start-up time: ${(Date.now() - start) / 1000}s`);
});
