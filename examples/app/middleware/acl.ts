/*
# app.acl.use 用法

# 步骤

Step 1:
yarn run:example app/middleware/acl start

Step 2:
curl http://localhost:13000/api/test:export
curl http://localhost:13000/api/test:export?skip=1
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

app.acl.define({
  role: 'admin',
  actions: {
    'test:export': {
      fields: ['a1', 'b1'],
    },
  },
});

app.acl.use(async (ctx, next) => {
  ctx.permission = {
    // 是否跳过 acl 判断
    skip: !!ctx.request.query.skip,
    // 如果 skip=true 不处理
    // 如果 skip=false，can.params 会通过 ctx.action.mergeParams() 合并到 ctx.action.params
    can: {
      params: {
        fields: ['a1', 'b1', 'b3'],
      },
    },
  };
  // acl 中间件里也可以直接给 body 赋值
  ctx.body = {
    test: 'test',
  };
  await next();
});

app.resourcer.use(async (ctx, next) => {
  // 当前角色
  ctx.state.currentRole = ctx.get('X-Role');
  await next();
});

app.resourcer.use(app.acl.middleware());

app.resource({
  name: 'test',
  actions: {
    async export(ctx, next) {
      ctx.body = {
        ...ctx.body,
        'ctx.action.params': ctx.action.params,
      };
      await next();
    },
  },
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
