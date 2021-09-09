import Server from '@nocobase/server';
import { registerActions } from '@nocobase/actions';
import dotenv from 'dotenv';
import path from 'path';

const start = Date.now();
console.log('starting... ', new Date().toUTCString());

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
  dataWrapping: true,
});

registerActions(api);

const file = `${__filename.endsWith('.ts') ? 'src' : 'lib'}/index`;

api.registerPlugin(
  '@nocobase/preset-nocobase',
  require(`@nocobase/preset-nocobase/${file}`).default,
);

if (process.argv.length < 3) {
  process.argv.push('start', '--port', '2000');
}

api.start(process.argv).then(() => {
  console.log(`Start-up time: ${(Date.now() - start) / 1000}s`);
});
