import { Application } from '@nocobase/server';
import { resolve } from 'path';

require('dotenv').config({ path: resolve(process.cwd(), '.env') });

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
  '@nocobase/plugin-error-handler',
  '@nocobase/plugin-collection-manager',
  '@nocobase/plugin-ui-schema-storage',
  '@nocobase/plugin-ui-routes-storage',
  '@nocobase/plugin-file-manager',
  '@nocobase/plugin-system-settings',
  [
    '@nocobase/plugin-users',
    {
      jwt: {
        secret: process.env.JWT_SECRET || '09f26e402586e2faa8da4c98a35f1b20d6b033c60',
      },
      installing: {
        adminNickname: 'Super Admin',
        adminEmail: 'admin@nocobase.com',
        adminPassword: 'admin123',
      },
    },
  ],
  '@nocobase/plugin-acl',
  '@nocobase/plugin-china-region',
  '@nocobase/plugin-workflow',
  [
    '@nocobase/plugin-client',
    {
      dist: resolve(__dirname, '../../app/dist'),
    },
  ],
];

for (const plugin of plugins) {
  if (Array.isArray(plugin)) {
    api.plugin(require(plugin.shift() as string).default, plugin.shift());
  } else {
    api.plugin(require(plugin).default);
  }
}

// api.acl.use(async (ctx, next) => {
//   ctx.permission = {
//     skip: true,
//   };
//   await next();
// });

if (process.argv.length < 3) {
  // @ts-ignore
  process.argv.push('start', '--port', process.env.API_PORT || 12302);
}

api.parse(process.argv).then(() => {
  console.log(`${new Date().toLocaleTimeString()} Start-up time: ${(Date.now() - start) / 1000}s`);
});
