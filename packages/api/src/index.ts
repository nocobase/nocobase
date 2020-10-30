import Koa from 'koa';
import Database from '@nocobase/database';
import Resourcer, { Action } from '@nocobase/resourcer';
import actions from '@nocobase/actions';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

export class Application extends Koa {

  database: Database;

  resourcer: Resourcer;

  router: Router;

  async plugins(plugins: any[]) {
    await Promise.all(plugins.map(async (pluginOption) => {
      let plugin: Function;
      let options = {};
      if (Array.isArray(pluginOption)) {
        plugin = pluginOption.shift();
        options = pluginOption.shift()||{};
        if (typeof plugin === 'function') {
          plugin = plugin.bind(this);
        } else if (typeof plugin === 'string') {
          const libDir = __filename.endsWith('.ts') ? 'src' : 'lib';
          plugin = require(`${plugin}/${libDir}/server`).default;
          plugin = plugin.bind(this);
        }
      } else if (typeof pluginOption === 'function') {
        plugin = pluginOption.bind(this);
      }
      return await plugin(options);
    }));
  }
}

export default {
  create(options: any): Application {
    console.log(options);

    const app = new Application();
    const resourcer = new Resourcer();
    const database = new Database(options.database);
    const router = new Router();

    app.database = database;
    app.resourcer = resourcer;
    app.router = router;

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

    app.use(resourcer.middleware(options.resourcer || {
      prefix: '/api',
    }));

    return app;
  }
}
