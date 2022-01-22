import { resolve } from 'path';
import { Application } from '@nocobase/server';

const start = Date.now();

const api = new Application({
  database:
    process.env.DB_DIALECT === 'sqlite'
      ? {
          dialect: process.env.DB_DIALECT as any,
          storage: resolve(process.cwd(), './db.sqlite'),
          logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
          define: {},
          sync: {
            force: false,
            alter: {
              drop: false,
            },
          },
        }
      : {
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: 'postgres',
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

api.plugin(require('@nocobase/plugin-collection-manager').default);
api.plugin(require('@nocobase/plugin-ui-schema-storage').default);
// api.plugin(require('@nocobase/plugin-acl'));

if (process.argv.length < 3) {
  // @ts-ignore
  process.argv.push('start', '--port', process.env.API_PORT || 12302);
}

console.log(process.argv);

api.parse(process.argv).then(() => {
  console.log(`Start-up time: ${(Date.now() - start) / 1000}s`);
});
