import cors from '@koa/cors';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import i18next from 'i18next';
import bodyParser from 'koa-bodyparser';
import Application, { ApplicationOptions } from './application';
import { dataWrapping } from './middlewares/data-wrapping';
import { db2resource } from './middlewares/db2resource';
import { i18n } from './middlewares/i18n';

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
  app.use(
    cors({
      exposeHeaders: ['content-disposition'],
      ...options.cors,
    }),
    {
      tag: 'cors',
      after: 'bodyParser',
    },
  );

  if (options.bodyParser !== false) {
    app.use(
      bodyParser({
        ...options.bodyParser,
      }),
      {
        tag: 'bodyParser',
        after: 'logger',
      },
    );
  }

  app.use(async (ctx, next) => {
    ctx.getBearerToken = () => {
      return ctx.get('Authorization').replace(/^Bearer\s+/gi, '');
    };
    await next();
  });

  app.use(i18n, { tag: 'i18n', after: 'cors' });

  if (options.dataWrapping !== false) {
    app.use(dataWrapping(), { tag: 'dataWrapping', after: 'i18n' });
  }

  app.use(db2resource, { tag: 'db2resource', after: 'dataWrapping' });
  app.use(app.resourcer.restApiMiddleware(), { tag: 'restApi', after: 'db2resource' });
}
