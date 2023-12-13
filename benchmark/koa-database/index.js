const Koa = require('koa');
const { Database } = require('@nocobase/database');

const dotenv = require('dotenv');
dotenv.config();

const db = new Database({
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
});

db.collection({
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

const app = new Koa();

app.use(async (ctx, next) => {
  const repository = db.getRepository('users');
  ctx.body = await repository.findAndCount({
    limit: 20,
    offset: 0,
  });
  await next();
});

app.listen(13010, () => {
  console.log('koa-database: http://localhost:13010/');
});
