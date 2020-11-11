import Koa from 'koa';
import Database from '@nocobase/database';
import Resourcer, { Action, ParsedParams } from '@nocobase/resourcer';
import actions from '@nocobase/actions';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

export class Application extends Koa {

  database: Database;

  router: Router;

  resourcer: Resourcer;

  uiResourcer: Resourcer;

  async plugins(plugins: any[]) {
    for (const pluginOption of plugins) {
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
      await plugin(options);
    }
  }
}

export function getNameByParams(params: ParsedParams): string {
  const { resourceName, associatedName } = params;
  return associatedName ? `${associatedName}.${resourceName}` : resourceName;
}

export default {
  create(options: any): Application {
    console.log(options);

    const app = new Application();
    const database = new Database(options.database);
    const router = new Router();
    const resourcer = new Resourcer();
    const uiResourcer = new Resourcer();

    app.database = database;
    app.router = router;
    app.resourcer = resourcer;
    app.uiResourcer = uiResourcer;

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

    app.use(uiResourcer.middleware(options.uiResourcer || {
      prefix: '/api/ui',
    }));

    return app;
  }
}
