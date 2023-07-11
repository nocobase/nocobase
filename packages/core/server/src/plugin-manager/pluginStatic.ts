import { Middleware } from 'koa';
import send from 'koa-send';
import path from 'path';
import { getClientStaticRealPath, isMatchClientStaticUrl } from './utils';

/**
 * send plugin client static file to browser.
 *
 * such as:
 *  /plugins/@nocobase/plugin-xxx/index.js
 *  /plugins/xxx/README.md
 */
export const pluginStatic: Middleware = async (ctx, next) => {
  const realPath = getClientStaticRealPath(ctx.path);
  if (isMatchClientStaticUrl(ctx.path) && ctx.method === 'GET') {
    // `send` only accept relative path
    const relativePath = path.relative(__dirname, realPath);
    return send(ctx, relativePath);
  }
  await next();
};
