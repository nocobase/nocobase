import { Database } from '@nocobase/database';
import { Plugin } from '@nocobase/server';

export default class PluginRequestLogs extends Plugin {
  requestLogDb: Database;

  beforeLoad() {
    if (this.app.db.inDialect('sqlite')) {
      console.log(this.app.db.options.storage + '.request-logs.sqlite');
      this.requestLogDb = new Database({
        dialect: 'sqlite',
        logging: false,
        storage: this.app.db.options.storage + '.request-logs.sqlite',
      });
    } else {
      this.requestLogDb = this.app.db;
    }

    this.requestLogDb.collection({
      name: 'requestLogs',
      fields: [
        {
          type: 'string',
          name: 'method',
        },
        {
          type: 'string',
          name: 'path',
        },
        {
          type: 'json',
          name: 'message',
        },
        {
          type: 'json',
          name: 'params',
        },
      ],
    });

    this.app.resourcer.use(async (ctx: any, next) => {
      const repository = this.requestLogDb.getRepository('requestLogs');
      const values = {
        path: ctx.path,
        method: ctx.request.method,
        params: ctx.action.params,
      };
      try {
        await next();
        repository.create({
          values,
        });
      } catch (error) {
        values['message'] = error?.message;
        repository.create({
          values,
        });
      }
    });
  }

  async install() {
    if (this.app.db.inDialect('sqlite')) {
      await this.requestLogDb.sync();
    }
  }
}
