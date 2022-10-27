/*
# Action 参数的多来源合并

# 步骤：

Step 1:
yarn run:example app/resource-actions/action-merge-params start

Step 2: 客户端请求时提供参数也是一种来源
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

// 来源1：resourcer.use 中间件里直接 action.mergeParams
app.resourcer.use(async (ctx, next) => {
  // 在 middleware 里修改 action.params
  ctx.action.mergeParams({
    filter: {
      col1: 'val1',
    },
    fields: ['col1', 'col2', 'col4'],
  });
  await next();
});

// 来源2：app.acl.use 中间件里的 ctx.permission.can.params
app.acl.use(async (ctx, next) => {
  ctx.permission = {
    // 是否跳过 acl 判断
    skip: !!ctx.request.query.skip,
    // 如果 skip=true 不处理
    // 如果 skip=false，can.params 会通过 ctx.action.mergeParams() 合并到 ctx.action.params
    can: {
      params: {
        filter: {
          col1: 'val2',
        },
        fields: ['col1', 'col2', 'col3'],
      },
    },
  };
  await next();
});

app.resourcer.use(app.acl.middleware());

app.resource({
  name: 'test',
  actions: {
    // 来源 3：直接配置在 resource 的 action 里
    list: {
      filter: {
        col1: 'val3',
      },
      fields: ['col1', 'col2', 'col3', 'col4', 'col5'],
      handler: async (ctx, next) => {
        ctx.body = {
          'action.resourceName': ctx.action.resourceName,
          'action.resourceOf': ctx.action.resourceOf,
          'action.actionName': ctx.action.actionName,
          'action.params': ctx.action.params,
        };
        await next();
      },
    },
  },
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
