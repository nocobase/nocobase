import Koa from 'koa';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import actions from '@nocobase/actions';

export class Application extends Koa {

  database: Database;

  resourcer: Resourcer;

  async plugins(plugins: any[]) {
    await Promise.all(plugins.map(async (pluginOption) => {
      let plugin: Function;
      let options = {};
      if (Array.isArray(pluginOption)) {
        plugin = pluginOption.shift();
        plugin = plugin.bind(this);
        options = pluginOption.shift()||{};
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

    app.database = database;
    app.resourcer = resourcer;

    resourcer.registerHandlers(actions.common);

    app.use(async (ctx, next) => {
      ctx.db = database;
      ctx.database = database;
      await next();
    });

    app.use(resourcer.middleware(options.resourcer || {
      prefix: '/api',
    }));

    return app;
  }
}
