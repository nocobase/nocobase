import Api from '@nocobase/api';
import dotenv from 'dotenv';

const sync = {
  force: true,
  alter: {
    drop: true,
  },
};

dotenv.config();

const api = Api.create({
  database: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.platform === 'linux' ? process.env.DB_HOST : 'localhost',
    port: process.platform === 'linux' ? process.env.DB_PORT : ( process.env.DB_DIALECT == 'postgres' ? 25432 : 23306 ),
    dialect: process.env.DB_DIALECT as any,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    // logging: false,
    define: {},
    sync,
  },
  resourcer: {
    prefix: '/api',
  },
});

api
  .plugins([
    [require('@nocobase/plugin-collections').default, {}],
  ])
  .then(() => {
    api.listen(23001, () => {
      console.log('http://localhost:23001/');
    });
  });
