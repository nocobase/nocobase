/*
# ctx.action.mergeParams 的用法

一般是在中间件里通过 ctx.action.mergeParams() 方法合并参数

# 步骤：

Step 1:
yarn run:example app/context/ctx.action.mergeParams start

Step 2:
curl http://localhost:13000/api/test:list?filter%5Ba%5D=a2&fields=col1
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
});

async function list(ctx, next) {
  ctx.body = {
    'action.resourceName': ctx.action.resourceName,
    'action.resourceOf': ctx.action.resourceOf,
    'action.actionName': ctx.action.actionName,
    'action.params': ctx.action.params,
  };
  await next();
}

async function get(ctx, next) {
  ctx.body = {
    'action.resourceName': ctx.action.resourceName,
    'action.resourceOf': ctx.action.resourceOf,
    'action.actionName': ctx.action.actionName,
    'action.params': ctx.action.params,
  };
  await next();
}

app.resourcer.use(async (ctx, next) => {
  // 在 middleware 里修改 action.params
  ctx.action.mergeParams({
    filter: {
      a: 'a1',
    },
    fields: ['col1', 'col2'],
  });
  await next();
});

app.resource({
  name: 'test',
  actions: {
    list,
    get,
  },
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
