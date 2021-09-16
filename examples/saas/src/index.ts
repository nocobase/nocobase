import { Application } from '@nocobase/server/src';
import path from 'path';
import compose from 'koa-compose';

const keys = __dirname.split(path.sep);
const slug = keys[keys.length - 2];

function createApp(opts) {
  const { name } = opts;
  const options = {
    database: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT as any,
      dialect: process.env.DB_DIALECT as any,
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
      appName: name,
      hooks: {
        beforeDefine(model, options) {
          options.tableName = `examples_${slug}_${name}_${
            options.tableName || options.name.plural
          }`;
        },
      },
    },
    resourcer: {
      prefix: `/api/examples/${slug}/${name}`,
    },
  };
  const app = new Application(options);
  app.resource({
    name: 'saas',
    actions: {
      async getInfo(ctx, next) {
        ctx.body = ctx.db.options;
        await next();
      },
    },
  });
  app.collection({
    name: 'users',
    fields: [
      { type: 'string', name: 'username' },
      { type: 'password', name: 'password' },
    ],
  });
  return app;
}

const saas = createApp({
  name: 'main',
});

saas['apps'] = new Map<string, Application>();

saas.collection({
  name: 'applications',
  fields: [
    { type: 'string', name: 'name', unique: true },
  ],
});

saas
  .command('app:create')
  .argument('<appName>')
  .action(async (appName) => {
    const App = saas.db.getModel('applications');
    const model = await App.create({
      name: appName,
    });
    const app = createApp({
      name: appName,
    });
    await app.db.sync();
    await app.destroy();
    await saas.destroy();
    console.log(model.toJSON());
  });

saas
  .command('db:sync')
  .option('-f, --force')
  .option('--app [app]')
  .action(async (...args) => {
    const cli = args.pop();
    const force = cli.opts()?.force;
    const appName = cli.opts()?.app;
    const app = !appName
      ? saas
      : createApp({
          name: appName,
        });
    await app.load();
    await app.db.sync(
      force
        ? {
            force: true,
            alter: {
              drop: true,
            },
          }
        : {},
    );
    await app.destroy();
    await saas.destroy();
  });

function multiApps({ getAppName }) {
  return async function (ctx, next) {
    const appName = getAppName(ctx);
    if (!appName) {
      return next();
    }
    const App = ctx.db.getModel('applications');
    const model = await App.findOne({
      where: { name: appName },
    });
    console.log({ appName, model });
    if (!model) {
      return next();
    }
    const apps = ctx.app.apps;
    if (!apps.has(appName)) {
      const app = createApp({
        name: appName,
      });
      apps.set(appName, app);
    }
    const saas = apps.get(appName);
    await compose(saas.middleware)(ctx, async () => {});
  };
}

saas.use(
  multiApps({
    getAppName(ctx) {
      const appName = ctx.path.split('/')[4];
      return appName === 'main' ? null : appName;
    },
  }),
);

// saas.use(async (ctx, next) => {
//   ctx.body = 'aaaaa';
//   console.log(ctx.db.options);
//   await next();
// });

saas.parse(process.argv);
