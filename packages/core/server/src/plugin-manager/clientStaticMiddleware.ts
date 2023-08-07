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

export function getReadmeUrl(packageName: string) {
  const realPath = getRealPath(packageName, 'README.md');
  return fs.existsSync(realPath) ? getPackageClientStaticUrl(packageName, 'README.md') : null;
}

export function getChangelogUrl(packageName: string) {
  const realPath = getRealPath(packageName, 'README.md');
  return fs.existsSync(realPath) ? getPackageClientStaticUrl(packageName, 'CHANGELOG.md') : null;
}

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
export const getRealPathByUrl = (packageName: string, url: string) => {
  const ext = path.extname(url);
  let filePath = url.replace(`${PREFIX}${packageName}/`, '');

  // 保护所用，包根目录下仅允许访问 md 文件，其他文件会被重定向到 dist/client 目录下
  if (ext.toLowerCase() !== '.md') {
    filePath = path.join('dist', 'client', filePath);
  }

  return getRealPath(packageName, filePath);
};

export const getRealPath = (packageName: string, filePath: string) => {
  return path.join(NODE_MODULES, packageName, filePath);
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

    const realPath = getRealPathByUrl(packageName, ctx.path);

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
