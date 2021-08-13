import Api from '@nocobase/server';

// @ts-ignore
const sync = global.sync || {
  force: false,
  alter: {
    drop: false,
  },
};

console.log('process.env.NOCOBASE_ENV', process.env.NOCOBASE_ENV);

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
  '@nocobase/plugin-ui-router',
  '@nocobase/plugin-ui-schema',
  '@nocobase/plugin-users',
  '@nocobase/plugin-action-logs',
  '@nocobase/plugin-file-manager',
  '@nocobase/plugin-permissions',
  '@nocobase/plugin-export',
  '@nocobase/plugin-system-settings',
  // '@nocobase/plugin-automations',
  // '@nocobase/plugin-china-region',
];

for (const plugin of plugins) {
  api.registerPlugin(plugin, [require(`${plugin}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`).default]);
}

export default api;
