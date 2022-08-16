/*
# ctx.action 的重要参数说明

# 步骤

Step 1:
yarn run:example app/context/ctx.action start

Step 2:
curl http://localhost:13000/api/test:list
curl http://localhost:13000/api/test/1/nest:get
curl http://localhost:13000/api/test:list?filter%5Ba%5D=a&fields=a,b&sort=a,b
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

app.resource({
  name: 'test',
  actions: {
    list,
    get,
  },
});

app.resource({
  name: 'test.nest',
  actions: {
    list,
    get,
  },
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
