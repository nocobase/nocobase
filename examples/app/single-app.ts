/*
# 最简单的单应用

# 步骤

Step 1:
yarn run:example app/single-app start

Step 2:
curl http://localhost:13000/api/test:list
*/
import { Application } from '@nocobase/server';
import { uid } from '@nocobase/utils';

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
    tablePrefix: `t_${uid()}_`,
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
      process.stdout.write('rs');
    },
  },
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
