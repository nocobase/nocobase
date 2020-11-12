import Database from '@nocobase/database';
import Resourcer, { Action } from '@nocobase/resourcer';
import actions from '@nocobase/actions';
import Application from './application';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import middleware from './middleware';

export * from './application';
export * from './middleware';

export default {
  /**
   * 这部分还比较杂，细节待改进
   * 
   * @param options 
   */
  create(options: any): Application {
    console.log(options);

    const app = new Application(options);

    app.use(bodyParser());
    app.use(cors());

    // 这段代码处理的不完整
    app.resourcer.registerHandlers(actions.common);

    app.use(async (ctx, next) => {
      ctx.db = app.database;
      ctx.database = app.database;
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
      database: app.database,
      resourcer: app.resourcer,
      ...(options.resourcer||{}),
    }));

    return app;
  }
}
