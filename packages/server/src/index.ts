import { actions, middlewares as m } from '@nocobase/actions';
import Application from './application';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { dbResourceRouter } from './middlewares';

export * from './application';
export * from './middleware';
export * as middlewares from './middlewares';

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
    app.use(cors({
      exposeHeaders: ['content-disposition'],
    }));

    app.resourcer.registerActionHandlers({ ...actions.common, ...actions.associate });

    app.use(async (ctx, next) => {
      ctx.db = app.database;
      ctx.database = app.database;
      await next();
    });

    app.resourcer.use(m.associated);
    app.use(m.dataWrapping);

    app.use(dbResourceRouter({
      database: app.database,
      resourcer: app.resourcer,
      ...(options.resourcer||{}),
    }));

    return app;
  }
}
