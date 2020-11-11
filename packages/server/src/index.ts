import Database from '@nocobase/database';
import Resourcer, { Action } from '@nocobase/resourcer';
import actions from '@nocobase/actions';
import Application from './applicatiion';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import middleware from './middleware';

export default {
  create(options: any): Application {
    console.log(options);

    const app = new Application();
    const database = new Database(options.database);
    const resourcer = new Resourcer();

    app.database = database;
    app.resourcer = resourcer;

    app.use(bodyParser());
    app.use(cors());

    resourcer.registerHandlers(actions.common);

    app.use(async (ctx, next) => {
      ctx.db = database;
      ctx.database = database;
      await next();
    });

    app.use(async (ctx, next) => {
      await next();
      if (ctx.action instanceof Action) {
        if (!ctx.body) {
          ctx.body = {};
        }
        const { rows, ...meta } = ctx.body||{};
        if (rows) {
          ctx.body = {
            data: rows,
            meta,
          };
        } else {
          ctx.body = {
            data: ctx.body,
          };
        }
      }
    });

    app.use(middleware({
      prefix: '/api',
      database,
      resourcer,
      ...(options.resourcer||{}),
    }));

    return app;
  }
}
