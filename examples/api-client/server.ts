/*
# 客户端请求

# 步骤

Step 1: 启动服务器
yarn run:example api-client/server start

Step 2: 客户端常规请求 —— api.request()
yarn run:example api-client/api.request

Step 3: 客户端资源请求 —— api.resource(name).action(params)
yarn run:example api-client/api.resource
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

// 定义了一个 test 资源，并提供了相对应的 list 方法
app.resource({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = 'test list';
      await next();
    },
  },
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
