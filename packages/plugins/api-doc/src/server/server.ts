import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import { resolve } from 'path';

export default class APIDoc extends Plugin {
  beforeLoad() {}
  async load() {
    this.app.use(async (ctx, next) => {
      console.log(ctx.path);
      if (ctx.path.startsWith('/api/_documentation')) {
        const root = resolve(process.cwd(), './node_modules/swagger-ui-dist');
        const filename = ctx.path.replace(/\/api\/_documentation\/?/, '');
        if (!filename) {
          return send(ctx, 'index.html', { root: __dirname });
        }
        // console.log('koa-send', root, ctx.status);
        return send(ctx, filename, { root });
      }
      if (ctx.path.startsWith('/api/swagger.json')) {
        ctx.withoutDataWrapping = true;
        ctx.body = require('./swagger');
      }
      await next();
    });
  }
}
