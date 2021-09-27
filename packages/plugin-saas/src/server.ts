import compose from 'koa-compose';
import { Application, PluginOptions } from '@nocobase/server';
import Koa from 'koa';

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
      pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
      logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
      define: {},
      sync: {
        force: false,
        alter: {
          drop: false,
        },
      },
    },
    // dataWrapping: false,
    resourcer: {
      prefix: `/api/saas/${name}`,
    },
  };
  const app = new Application(options);

  app.db.sequelize.beforeDefine((model, options) => {
    options.tableName = `saas_${name}_${
      options.tableName || options.name.plural
    }`;
  });

  app.resource({
    name: 'saas',
    actions: {
      async getInfo(ctx, next) {
        ctx.body = {
          m: Object.values(ctx.db.sequelize.models).map((m: any) => m.tableName),
        };
        await next();
      },
    },
  });

  const plugins = [
    '@nocobase/plugin-collections',
    '@nocobase/plugin-ui-router',
    '@nocobase/plugin-ui-schema',
    '@nocobase/plugin-users',
    '@nocobase/plugin-action-logs',
    '@nocobase/plugin-file-manager',
    '@nocobase/plugin-permissions',
    '@nocobase/plugin-export',
    '@nocobase/plugin-system-settings',
    '@nocobase/plugin-china-region',
  ];

  for (const plugin of plugins) {
    app.plugin(
      require(`${plugin}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`)
        .default,
    );
  }

  return app;
}

function multiApps({ getAppName }) {
  return async function (ctx: Koa.Context, next) {
    const appName = getAppName(ctx);
    if (!appName) {
      return next();
    }
    const App = ctx.db.getModel('applications');
    const model = await App.findOne({
      where: { name: appName },
    });
    if (!model) {
      return next();
    }
    const apps = ctx.app['apps'];
    if (!apps.has(appName)) {
      const app = createApp({
        name: appName,
      });
      await app.load();
      apps.set(appName, app);
    }
    const app = apps.get(appName);
    // 完全隔离的做法
    const handleRequest = app.callback();
    await handleRequest(ctx.req, ctx.res);
  };
}

export default {
  name: 'saas',
  async load() {
    this.app['apps'] = new Map<string, Application>();
    this.app.collection({
      name: 'applications',
      fields: [
        { type: 'string', name: 'name', unique: true },
        { type: 'belongsTo', name: 'user' },
      ],
    });
    this.app.use(
      multiApps({
        getAppName(ctx) {
          return ctx.path.split('/')[3];
        },
      }),
    );
    this.app
      .command('app:create')
      .argument('<appName>')
      .action(async (appName) => {
        const App = this.app.db.getModel('applications');
        const model = await App.findOne({
          where: {
            name: appName,
          },
        });
        if (!model) {
          await App.create({
            name: appName,
          });
        }
        await this.app.destroy();
      });
  },
} as PluginOptions;
