import fs from 'fs';
import send from 'koa-send';
import path from 'path';

const PREFIX = '/api/plugins/client/';
const cwd = process.cwd();
const NODE_MODULES = path.join(cwd, 'node_modules');

/**
 * get plugin client static file url
 *
 * @example
 * @nocobase/plugin-acl, index.js => /api/plugins/client/@nocobase/plugin-acl/index.js
 * my-plugin, README.md => /api/plugins/client/my-plugin/README.md
 */
export const getPackageClientStaticUrl = (packageName: string, filePath: string) => {
  return `${PREFIX}${packageName}/${filePath}`;
};

const isMatchClientStaticUrl = (url: string) => {
  return url.startsWith(PREFIX);
};

/**
 * get package name from url
 *
 * @example
 * /api/plugins/client/@nocobase/plugin-acl/index.js => @nocobase/plugin-acl
 * /api/plugins/client/my-plugin/README.md => my-plugin
 */
const getPackageName = (url: string) => {
  const urlArr = url.split('/');
  return urlArr[4].startsWith('@') ? `${urlArr[4]}/${urlArr[5]}` : urlArr[4];
};

/**
 * get plugin client static file real path
 *
 * @example
 * /api/plugins/client/@nocobase/plugin-acl/index.js => /node_modules/@nocobase/plugin-acl/dist/client/index.js
 * /api/plugins/client/my-plugin/README.md => /node_modules/my-plugin/dist/client/README.md
 */
const getRealPath = (packageName: string, url: string) => {
  const ext = path.extname(url);
  const filePath = url.replace(`${PREFIX}${packageName}/`, '');
  if (ext.toLowerCase() === '.md') {
    return path.join(NODE_MODULES, packageName, filePath);
  } else {
    return path.join(NODE_MODULES, packageName, 'dist', 'client', filePath);
  }
};

/**
 * send plugin client static file to browser.
 *
 * such as:
 *  /api/plugins/client/@nocobase/plugin-xxx/index.js
 *  /api/plugins/client/xxx/README.md
 */
export const clientStaticMiddleware = async (ctx, next) => {
  if (isMatchClientStaticUrl(ctx.path)) {
    // TODO: check packageName in plugins
    const packageName = getPackageName(ctx.path);

    const realPath = getRealPath(packageName, ctx.path);

    // get file stats
    const stats = await fs.promises.stat(realPath);
    const ifModifiedSince = ctx.get('If-Modified-Since');
    const lastModified = stats.mtime.toUTCString();

    // check cache headers
    if (ifModifiedSince === lastModified) {
      ctx.status = 304;
      return;
    }

    // `send` only accept relative path
    const relativePath = path.relative(cwd, realPath);
    await send(ctx, relativePath, {
      setHeaders: (res) => {
        res.setHeader('Last-Modified', lastModified);
      },
    });
  }
  await next();
};
