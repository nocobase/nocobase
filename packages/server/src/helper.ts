import cors from '@koa/cors';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { Command } from 'commander';
import i18next from 'i18next';
import { DefaultContext, DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import Application, { ApplicationOptions } from './application';
import { dataWrapping } from './middlewares/data-wrapping';
import { table2resource } from './middlewares/table2resource';
import { errorHandler } from './middlewares';

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

export function createCli(app: Application, options: ApplicationOptions): Command {
  const cli = new Command();

  cli
    .command('db:sync')
    .option('-f, --force')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      console.log('db sync...');
      await app.db.sync(
        opts.force
          ? {
              force: true,
              alter: {
                drop: true,
              },
            }
          : {},
      );
      await app.stop({
        cliArgs,
      });
    });

  cli
    .command('install')
    .option('-f, --force')
    .option('-c, --clean')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      await app.install({
        cliArgs,
        clean: opts.clean,
        sync: {
          force: opts.force,
        },
      });
      await app.stop({
        cliArgs,
      });
    });

  cli
    .command('start')
    .option('-p, --port [port]')
    .action(async (...cliArgs) => {
      const [opts] = cliArgs;
      const port = opts.port || 3000;

      await app.start({
        cliArgs,
        listen: {
          port,
        },
      });

      console.log(`http://localhost:${port}/`);
    });

  return cli;
}

export function registerMiddlewares(app: Application, options: ApplicationOptions) {
  app.use(errorHandler());

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
    const i18n = app.i18n.cloneInstance({ initImmediate: false });
    ctx.i18n = i18n;
    ctx.t = i18n.t.bind(i18n);
    const lng = (ctx.request.query.locale as string) || ctx.acceptsLanguages().shift();
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
