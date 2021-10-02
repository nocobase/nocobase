import path from 'path';
import send from 'koa-send';
import serve from 'koa-static';
import { PluginOptions } from '@nocobase/server';

export default {
  name: 'client',
  async load() {
    let root = this.options.dist;
    if (root && !root.startsWith('/')) {
      root = path.resolve(process.cwd(), root);
    }
    this.app.middleware.unshift(async (ctx, next) => {
      if (!root) {
        return next();
      }
      await serve(root)(ctx, next);
      console.log('koa-send', root, ctx.status);
      if (ctx.status == 404) {
        return send(ctx, 'index.html', { root });
      }
    });
  }
} as PluginOptions;
