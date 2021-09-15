import { Application } from '@nocobase/server/src';
import path from 'path';
import mount from 'koa-mount';
import compose from 'koa-compose';

const keys = __dirname.split(path.sep);
const slug = keys[keys.length - 2];

const apps = new Map<string, Application>();

function createApp(opts) {
  const { name, prefix } = opts;
  
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
      hooks: {
        beforeDefine(model, options) {
          options.tableName = `examples_${slug}_${name}_${options.tableName || options.name.plural}`;
        },
      },
    },
    resourcer: {
      prefix,
    },
  };
  console.log(options);
  const app = new Application(options);
  if (name) {
    apps.set(name, app);
  }
  app.resource({
    name: 'server',
    actions: {
      async getInfo(ctx, next) {
        ctx.body = name;
        await next();
      }
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

const app = createApp({
  name: 'main',
  prefix: `/api/examples/${slug}/main`
});

app.collection({
  name: 'applications',
  fields: [
    { type: 'string', name: 'name', unique: true },
  ],
});

app.command('app-create').argument('<appName>').action(async (appName) => {
  const App = app.db.getModel('applications');
  const server = await App.create({
    name: appName,
  });
  const api = createApp({
    name: appName,
    prefix: `/api/examples/${slug}/${appName}`,
  });
  await api.db.sync();
  await api.destroy();
  console.log(server.toJSON());
  await app.destroy();
});

app.command('dbsync')
  .option('-f, --force')
  .option('--app [app]')
  .action(async (...args) => {
    const cli = args.pop();
    const force = cli.opts()?.force;
    const appName = cli.opts()?.app;
    console.log('ac ac', cli.opts());
    const api = apps.get(appName) || app;
    await api.load();
    await api.db.sync(
      force
        ? {
          force: true,
          alter: {
            drop: true,
          },
        }
        : {},
    );
    await api.destroy();
  });

app.use(async function(ctx, next) {
  const appName = ctx.path.split('/')[4];
  if (appName === 'main') {
    return next();
  }
  const App = ctx.db.getModel('applications');
  const model = await App.findOne({
    where: { name: appName },
  });
  console.log({ appName, model })
  if (!model) {
    return next();
  }
  if (!apps.has(appName)) {
    const app1 = createApp({
      name: appName,
      prefix: `/api/examples/${slug}/${appName}`
    });
    apps.set(appName, app1);
  }
  const server = apps.get(appName);
  await compose(server.middleware)(ctx, next);
});

app.parse(process.argv);
