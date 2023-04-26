/*
# app.resourcer.use 用法

# 步骤

Step 1:
yarn run:example app/middleware/resourcer start

Step 2:
curl http://localhost:13000/api/test:list
*/
import { Application } from '@nocobase/server';

const app = new Application({
  database: {
    logging: process.env.DB_LOGGING === 'on' ? console.log : false,
    dialect: process.env.DB_DIALECT as any,
    storage: process.env.DB_STORAGE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
    timezone: process.env.DB_TIMEZONE,
    tablePrefix: process.env.DB_TABLE_PREFIX,
  },
  resourcer: {
    prefix: '/api',
  },
  plugins: [],
});

app.resource({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push('test list');
      await next();
    },
  },
});

app.resourcer.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push('resourcer middleware');
  await next();
});

app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push('app middleware');
  await next();
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
