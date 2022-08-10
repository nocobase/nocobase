/*
# 国际化多语言设置

主要介绍 app.i18n 和 ctx.i18n 的区别

# 步骤：

Step 1:
yarn run:example app/context/ctx.i18n start

Step 2:
curl http://localhost:13000/?locale=en-US
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
  i18n: {
    defaultNS: 'test',
    resources: {
      'en-US': {
        test: {
          hello: 'Hello',
        },
      },
      'zh-CN': {
        test: {
          hello: '你好',
        },
      },
    },
  },
});

app.i18n.addResources('zh-CN', 'test', {
  world: '世界',
});

app.i18n.addResources('en-US', 'test', {
  world: 'World',
});

// 改变全局 app.i18n 的多语言，一般用于 cli 环境的多语言切换
app.i18n.changeLanguage('zh-CN');

app.use(async (ctx, next) => {
  // ctx.i18n 是 app.i18n 的 clone instance
  ctx.body = {
    'ctx.i18n': ctx.i18n.language,
    'app.i18n': app.i18n.language,
    'ctx.t': ctx.t('hello') + ' ' + ctx.t('world'),
    'app.i18n.t': app.i18n.t('hello') + ' ' + app.i18n.t('world'),
  };
  await next();
});

if (require.main === module) {
  app.runAsCLI();
}

export default app;
