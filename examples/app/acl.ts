/*
Step 1:
yarn run:example app/acl start

Step 2:
curl http://localhost:13000/api/test:export
curl --location --request GET 'http://localhost:13000/api/test:export' --header 'X-Role: admin'
curl --location --request GET 'http://localhost:13000/api/test:import' --header 'X-Role: admin'
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

app.resourcer.use(async (ctx, next) => {
  ctx.state.currentRole = ctx.get('X-Role');
  await next();
});

app.resourcer.use(app.acl.middleware());

app.resource({
  name: 'test',
  actions: {
    async export(ctx, next) {
      ctx.body = {
        'ctx.action.params': ctx.action.params,
      };
      await next();
    },
    async import(ctx, next) {
      ctx.body = {
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
