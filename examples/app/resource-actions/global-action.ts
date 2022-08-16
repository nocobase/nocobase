/*
# 使用全局 Action

全局 action 可用于任意 resource 中

# 步骤

Step 1:
yarn run:example app/resource-actions/global-action start

Step 2: test:export 的 action.params 带 fields
curl http://localhost:13000/api/test:export

Step 3: test:import 有效
curl http://localhost:13000/api/test:import
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

app.resourcer.registerActionHandlers({
  async import(ctx, next) {
    ctx.body = {
      'ctx.action.params': ctx.action.params,
    };
    await next();
  },
  async export(ctx, next) {
    ctx.body = {
      'ctx.action.params': ctx.action.params,
    };
    await next();
  },
});

app.resource({
  name: 'test',
  // 全局的 actions 如果有默认参数可以在 actions 里配置
  actions: {
    export: {
      fields: ['field1', 'field2'],
    },
    // 如果没有默认参数，可以不配置，如 import action
  },
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
