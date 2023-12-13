const { Application } = require('@nocobase/server');
const dotenv = require('dotenv');
const { PerformanceObserver, createHistogram } = require('perf_hooks');

dotenv.config();

const app = new Application({
  database: {
    logging: false,
    dialect: process.env.DB_DIALECT,
    storage: process.env.DB_STORAGE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    timezone: process.env.DB_TIMEZONE,
    tablePrefix: process.env.DB_TABLE_PREFIX,
    schema: process.env.DB_SCHEMA,
    underscored: process.env.DB_UNDERSCORED === 'true',
  },
  resourcer: {
    prefix: '/api',
  },
  logger: {
    // skip: () => true,
    // transports: ['console'],
    // level: 'error',
  },
  acl: false,
  plugins: [],
  perfHooks: true,
});

app.db.collection({
  name: 'users',
  sortable: 'sort',
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'nickname',
    },
    {
      type: 'string',
      name: 'username',
      unique: true,
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
    },
    {
      type: 'string',
      name: 'phone',
      unique: true,
    },
    {
      type: 'password',
      name: 'password',
      hidden: true,
    },
    {
      type: 'string',
      name: 'appLang',
    },
    {
      type: 'string',
      name: 'resetToken',
      unique: true,
      hidden: true,
    },
    {
      type: 'json',
      name: 'systemSettings',
      defaultValue: {},
    },
  ],
});

// const obs = new PerformanceObserver((items) => {
//   items.getEntries().forEach((item) => {
//     console.log(item);
//   });
// });
// obs.observe({ entryTypes: ['measure'] });

app.listen(13030, (err) => {
  console.log('nocobase-server: http://localhost:13030/api/users');
});
