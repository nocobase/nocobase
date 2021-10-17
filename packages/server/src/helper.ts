import { DefaultContext, DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer/src/resourcer';
import { Command } from 'commander';
import Application, { ApplicationOptions } from './application';
import { dataWrapping } from './middlewares/data-wrapping';
import { table2resource } from './middlewares/table2resource';

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

export function createCli(options: ApplicationOptions) {
  const cli = new Command();

  cli
    .command('db:sync')
    .option('-f, --force')
    .action(async (...args) => {
      console.log('db sync...');
      const cli = args.pop();
      const force = cli.opts()?.force;
      await this.db.sync(
        force
          ? {
              force: true,
              alter: {
                drop: true,
              },
            }
          : {},
      );
      await this.destroy();
    });

  cli
    .command('init')
    // .option('-f, --force')
    .action(async (...args) => {
      const cli = args.pop();
      await this.db.sync({
        force: true,
        alter: {
          drop: true,
        },
      });
      await this.emitAsync('db.init');
      await this.destroy();
    });

  cli
    .command('start')
    .option('-p, --port [port]')
    .action(async (...args) => {
      const cli = args.pop();
      const opts = cli.opts();
      await this.emitAsync('beforeStart');
      this.listen(opts.port || 3000);
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
    await next();
  });

  if (options.dataWrapping !== false) {
    app.use(dataWrapping());
  }

  app.use(table2resource());
  app.use(app.resourcer.restApiMiddleware());
}
