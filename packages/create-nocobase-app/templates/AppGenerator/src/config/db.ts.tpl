import { DatabaseOptions } from '@nocobase/database';
{{#quickstart}}
export default {
  dialect: 'sqlite',
  dialectModule: require('sqlite3'),
  storage: 'db.sqlite',
} as DatabaseOptions;
{{/quickstart}}
{{^quickstart}}
export default {
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
} as DatabaseOptions;
{{/quickstart}}
