import Server from '@nocobase/server';
import dotenv from 'dotenv';
import path from 'path';

const start = Date.now();
console.log('startAt', new Date().toUTCString());

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env'),
});

const api = new Server({
  database: {
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
    prefix: '/api',
  },
});

const plugins = [
  '@nocobase/plugin-collections',
  '@nocobase/plugin-ui-router',
  '@nocobase/plugin-ui-schema',
  '@nocobase/plugin-users',
  '@nocobase/plugin-action-logs',
  '@nocobase/plugin-file-manager',
  '@nocobase/plugin-permissions',
  '@nocobase/plugin-export',
  '@nocobase/plugin-system-settings',
  // '@nocobase/plugin-automations',
  '@nocobase/plugin-china-region',
];

for (const plugin of plugins) {
  api.registerPlugin(plugin, [
    require(`${plugin}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`)
      .default,
  ]);
}

if (process.argv.length < 3) {
  process.argv.push('start', '--port', '2000');
}

api.start(process.argv).then(() => {
  console.log(`Start-up time: ${(Date.now() - start) / 1000}s`);
});
