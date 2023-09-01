import fs from 'fs';
import path from 'path';
import pkgUp from 'pkg-up';
import { NODE_MODULES_PATH } from './constants';

export const PLUGIN_PREFIX = '/plugins/client/';

/**
 * get plugin client static file url
 *
 * @example
 * @nocobase/plugin-acl, index.js => /api/plugins/client/@nocobase/plugin-acl/index.js
 * my-plugin, README.md => /api/plugins/client/my-plugin/README.md
 */
export const getPackageClientStaticUrl = (packageName: string, filePath: string) => {
  return `${PLUGIN_PREFIX}${packageName}/${filePath}`;
};

export function getReadmeUrl(packageName: string, lang: string) {
  const { realPath: langReadmeRealPath } = getRealPath(packageName, `README.${lang}.md`);
  if (langReadmeRealPath) return getPackageClientStaticUrl(packageName, `README.${lang}.md`);

  const { realPath } = getRealPath(packageName, 'README.md');
  return realPath ? getPackageClientStaticUrl(packageName, 'README.md') : null;
}

export function getChangelogUrl(packageName: string) {
  const { realPath } = getRealPath(packageName, 'CHANGELOG.md');
  return realPath ? getPackageClientStaticUrl(packageName, 'CHANGELOG.md') : null;
}

/**
 * get package name from url
 *
 * @example
 * /api/plugins/client/@nocobase/plugin-acl/index.js => @nocobase/plugin-acl
 * /api/plugins/client/my-plugin/README.md => my-plugin
 */
export const getPackageName = (url: string) => {
  const urlArr = url.replace(PLUGIN_PREFIX, '').replace('/api', '').split('/').filter(Boolean);
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
  let filePath = url.replace(`${PLUGIN_PREFIX}${packageName}/`, '').replace(`/api`, '');

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
      cwd: require.resolve(`${packageName}/package.json`, { paths: [cwd] }),
    })!;
  }
}

export function getRealPath(packageName: string, filePath?: string) {
  const pkgPath = getDepPkgPath(packageName, NODE_MODULES_PATH);
  const baseDir = path.dirname(pkgPath);
  const realPath = path.join(baseDir, filePath);
  return fs.existsSync(realPath) ? { realPath, baseDir } : {};
}

export async function getRewritesPath(pathname: string, req: any, res: any) {
  const packageName = getPackageName(pathname);
  const { baseDir, realPath } = getRealPathByUrl(packageName, pathname);
  if (!realPath) return;

  // get file stats
  const stats = await fs.promises.stat(realPath);
  const ifModifiedSince = req.headers['if-modified-since'];
  const lastModified = stats.mtime.toUTCString();

  // check cache headers
  if (ifModifiedSince === lastModified) {
    res.statusCode = 304;
    return;
  }

  const relativePath = realPath.slice(baseDir.length + 1);
  return { baseDir, relativePath };
}
