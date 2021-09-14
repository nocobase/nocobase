import path from 'path';
import send from 'koa-send';
import serve from 'koa-static';
import { Context, Next } from '@nocobase/actions';

export interface AppDistServeOptions {
  root?: string;
  useStaticServer?: boolean;
}

export function appDistServe(options: AppDistServeOptions = {}) {
  return async (ctx: Context, next: Next) => {
    if (!options.root || !options.useStaticServer) {
      return next();
    }
    let root = options.root;
    if (!root.startsWith('/')) {
      root = path.resolve(process.cwd(), root);
    }
    await serve(root)(ctx, next);
    if (ctx.status == 404) {
      return send(ctx, 'index.html', { root });
    }
  }
}
