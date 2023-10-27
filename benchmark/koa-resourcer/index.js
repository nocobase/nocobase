const Koa = require('koa');
const { Database } = require('@nocobase/database');
const { middlewares } = require('@nocobase/server');
const { Resourcer } = require('@nocobase/resourcer');

const dotenv = require('dotenv');
const { list, get } = require('@nocobase/actions/lib/actions');
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
const resourcer = new Resourcer({
  prefix: '/api',
});

resourcer.define({
  name: 'users',
  actions: {
    list,
    get,
    // async list(ctx, next) {
    //   const repository = db.getRepository('users');
    //   ctx.body = await repository.find();
    //   await next();
    // },
  },
});

// resourcer.registerActionHandlers({ list });

app.use(async (ctx, next) => {
  ctx.db = db;
  await next();
});
app.use(resourcer.restApiMiddleware());
// app.use(middlewares.db2resource);
app.listen(13040, () => {
  console.log('koa-resourcer: http://localhost:13040/api/users');
});
