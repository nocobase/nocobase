import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import { resolve } from 'path';
import swagger from './swagger';

const API_DOC_PATH = '/api/_documentation';
export default class APIDoc extends Plugin {
  beforeLoad() {}
  async load() {
    this.app.use(async (ctx, next) => {
      console.log(ctx.path);
      if (ctx.path.startsWith(API_DOC_PATH)) {
        const root = resolve(process.cwd(), './node_modules/swagger-ui-dist');
        const filename = ctx.path.replace(API_DOC_PATH, '');
        if (!filename) {
          return send(ctx, 'index.html', { root: __dirname });
        }
        return send(ctx, filename, { root });
      }
      if (ctx.path.startsWith('/api/swagger.json')) {
        ctx.withoutDataWrapping = true;
        ctx.body = swagger;
      }
      await next();
    });
  }
}
