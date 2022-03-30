import path from 'path';
import Application from '@nocobase/server';
import dbConfig from './config/db';

const start = Date.now();

const api = new Application({
  database: dbConfig[process.env.DB_DIALECT || 'sqlite'],
  resourcer: {
    prefix: process.env.API_BASE_PATH || '/api/',
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

for (const plugin of plugins) {
  api.plugin(require(`${plugin}/lib/server`).default);
}

api.plugin(require(`@nocobase/plugin-client/lib/server`).default, {
  dist: path.resolve(process.cwd(), './dist'),
  // importDemo: true,
});

if (process.argv.length < 3) {
  // @ts-ignore
  process.argv.push('start', '--port', process.env.API_PORT || '13001');
}

api.parse(process.argv).then(() => {
  console.log(`Start-up time: ${(Date.now() - start) / 1000}s`);
});
