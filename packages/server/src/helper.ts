import { DefaultContext, DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { Command } from 'commander';
import Application, { ApplicationOptions } from './application';
import { dataWrapping } from './middlewares/data-wrapping';
import { table2resource } from './middlewares/table2resource';
import i18next from 'i18next';

export function createDatabase(options: ApplicationOptions) {
  if (options.database instanceof Database) {
    return options.database;
  } else {
    return new Database(options.database);
  }
}

export function createResourcer(options: ApplicationOptions) {
  return new Resourcer({ ...options.resourcer });
}

export function createI18n(options: ApplicationOptions) {
  const instance = i18next.createInstance();
  instance.init({
    lng: 'en-US',
    resources: {},
    ...options.i18n,
  });
  return instance;
}

export function createCli(app, options: ApplicationOptions) {
  const cli = new Command();

  cli
    .command('db:sync')
    .option('-f, --force')
    .action(async (...args) => {
      console.log('db sync...');
      const cli = args.pop();
      const force = cli.opts()?.force;
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
    });

  cli
    .command('init')
    .option('-f, --force')
    .action(async (...args) => {
      await app.db.sync({
        force: true,
      });
      await app.emitAsync('db.init', ...args);
      await app.destroy();
    });
  cli
    .command('start')
    .option('-p, --port [port]')
    .action(async (...args) => {
      const cli = args.pop();
      const opts = cli.opts();
      await app.emitAsync('beforeStart');
      app.listen(opts.port || 3000);
      console.log(`http://localhost:${opts.port || 3000}/`);
    });
  return cli;
}

export function registerMiddlewares(
  app: Application,
  options: ApplicationOptions,
) {
  if (options.bodyParser !== false) {
    app.use(
      bodyParser({
        ...options.bodyParser,
      }),
    );
  }

  app.use(
    cors({
      exposeHeaders: ['content-disposition'],
      ...options.cors,
    }),
  );

  app.use<DefaultState, DefaultContext>(async (ctx, next) => {
    ctx.db = app.db;
    ctx.resourcer = app.resourcer;
    const i18n = app.i18n.cloneInstance({ initImmediate: false })
    ctx.i18n = i18n;
    ctx.t = i18n.t.bind(i18n);
    const lng = ctx.request.query.locale as string || ctx.acceptsLanguages().shift();
    if (lng !== '*' && lng) {
      i18n.changeLanguage(lng);
    }
    await next();
  });

  if (options.dataWrapping !== false) {
    app.use(dataWrapping());
  }

  app.use(table2resource());
  app.use(app.resourcer.restApiMiddleware());
}
