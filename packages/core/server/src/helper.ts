import cors from '@koa/cors';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import i18next from 'i18next';
import bodyParser from 'koa-bodyparser';
import Application, { ApplicationOptions } from './application';
import { dataWrapping } from './middlewares/data-wrapping';
import { i18n } from './middlewares/i18n';
import { table2resource } from './middlewares/table2resource';

export function createI18n(options: ApplicationOptions) {
  const instance = i18next.createInstance();
  instance.init({
    lng: 'en-US',
    resources: {},
    ...options.i18n,
  });
  return instance;
}

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

export function registerMiddlewares(app: Application, options: ApplicationOptions) {
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

  app.use(async (ctx, next) => {
    ctx.getBearerToken = () => {
      return ctx.get('Authorization').replace(/^Bearer\s+/gi, '');
    };
    await next();
  });

  app.use(i18n);

  if (options.dataWrapping !== false) {
    app.use(dataWrapping());
  }

  app.use(table2resource);
  app.use(app.resourcer.restApiMiddleware());
}
