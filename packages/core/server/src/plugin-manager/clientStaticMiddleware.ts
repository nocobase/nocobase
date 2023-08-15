import fs from 'fs';
import send from 'koa-send';
import path from 'path';
import pkgUp from 'pkg-up';
import { NODE_MODULES_PATH } from './constants';

const PREFIX = '/plugins/client/';
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

export function getReadmeUrl(packageName: string, lang: string) {
  const langReadmeRealPath = getRealPath(packageName, `README.${lang}.md`);
  if (fs.existsSync(langReadmeRealPath)) return getPackageClientStaticUrl(packageName, `README.${lang}.md`);

  const realPath = getRealPath(packageName, 'README.md');
  return fs.existsSync(realPath) ? getPackageClientStaticUrl(packageName, 'README.md') : null;
}

export function getChangelogUrl(packageName: string) {
  const realPath = getRealPath(packageName, 'CHANGELOG.md');
  return fs.existsSync(realPath) ? getPackageClientStaticUrl(packageName, 'CHANGELOG.md') : null;
}

const isMatchClientStaticUrl = (url: string) => {
  return url.includes(PREFIX);
};

/**
 * get package name from url
 *
 * @example
 * /api/plugins/client/@nocobase/plugin-acl/index.js => @nocobase/plugin-acl
 * /api/plugins/client/my-plugin/README.md => my-plugin
 */
const getPackageName = (url: string) => {
  const urlArr = url.replace(PREFIX, '').replace('/api', '').split('/').filter(Boolean);
  return urlArr[0].startsWith('@') ? `${urlArr[0]}/${urlArr[1]}` : urlArr[0];
};

/**
 * get plugin client static file real path
 *
 * @example
 * /api/plugins/client/@nocobase/plugin-acl/index.js => /node_modules/@nocobase/plugin-acl/dist/client/index.js
 * /api/plugins/client/my-plugin/README.md => /node_modules/my-plugin/dist/client/README.md
 */
const clientExtensions = ['.js', '.css', '.map', '.json'];
export const getRealPathByUrl = (packageName: string, url: string) => {
  const ext = path.extname(url);
  let filePath = url.replace(`${PREFIX}${packageName}/`, '').replace(`/api`, '');

  // 保护作用，包目录下仅允许访问 md 文件，其他文件会被重定向到 dist/client 目录下
  if (clientExtensions.includes(ext.toLowerCase())) {
    filePath = path.join('dist', 'client', filePath);
  }

  return getRealPath(packageName, filePath);
};

/**
 * get package.json path for specific NPM package
 */
export function getDepPkgPath(packageName: string, cwd: string) {
  try {
    return require.resolve(`${packageName}/package.json`, { paths: [cwd] });
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return pkgUp.sync({
      cwd: require.resolve(packageName, { paths: [cwd] }),
    })!;
  }
}

export function getRealPath(packageName: string, filePath: string) {
  const pkgPath = getDepPkgPath(packageName, NODE_MODULES_PATH);
  const res = path.join(path.dirname(pkgPath), filePath);
  return fs.existsSync(res) ? res : null;
}

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
