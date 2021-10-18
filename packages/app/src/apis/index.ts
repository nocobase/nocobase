import Server from '@nocobase/server';
import path from 'path';

const start = Date.now();

const api = new Server({
  database: process.env.DB_DIALECT === 'sqlite' ? {
    dialect: process.env.DB_DIALECT as any,
    storage: path.resolve(process.cwd(), './db.sqlite'),
    logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
    define: {},
    sync: {
      force: false,
      alter: {
        drop: false,
      },
    },
  } : {
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
  '@nocobase/plugin-ui-router',
  '@nocobase/plugin-ui-schema',
  '@nocobase/plugin-collections',
  '@nocobase/plugin-users',
  '@nocobase/plugin-action-logs',
  '@nocobase/plugin-file-manager',
  '@nocobase/plugin-permissions',
  '@nocobase/plugin-export',
  '@nocobase/plugin-system-settings',
  '@nocobase/plugin-china-region',
];

const libDir = __filename.endsWith('.ts') ? 'src' : 'lib';

for (const plugin of plugins) {
  api.plugin(
    require(`${plugin}/${libDir}/server`).default,
  );
}

api.plugin(
  require(`@nocobase/plugin-client/${libDir}/server`).default, {
  dist: path.resolve(process.cwd(), './dist'),
  // importDemo: true,
});

if (process.argv.length < 3) {
  // @ts-ignore
  process.argv.push('start', '--port', process.env.API_PORT);
}


api.parse(process.argv).then(() => {
  console.log(`Start-up time: ${(Date.now() - start) / 1000}s`);
});
