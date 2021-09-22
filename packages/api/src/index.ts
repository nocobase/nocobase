import Server from '@nocobase/server';

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
  '@nocobase/plugin-china-region',
];

for (const plugin of plugins) {
  api.plugin(require(`${plugin}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`).default);
}

(async () => {
  const start = Date.now();

  if (process.argv.length < 3) {
    process.argv.push('start', '--port', process.env.API_PORT);
  }

  console.log(process.argv);

  await api.parse(process.argv);
  console.log(api.db.getTables().map(t => t.getName()));
  console.log(`Start-up time: ${(Date.now() - start) / 1000}s`);
  // console.log(`http://localhost:${process.env.API_PORT}/`);
})();
