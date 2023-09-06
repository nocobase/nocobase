import fs from 'fs';
import path from 'path';
import pkgUp from 'pkg-up';

export const PLUGIN_STATICS_PATH = process.env.PLUGIN_STATICS_PATH || '/plugins/statics/';

/**
 * get package.json path for specific NPM package
 */
export function getDepPkgPath(packageName: string) {
  try {
    return require.resolve(`${packageName}/package.json`);
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return pkgUp.sync({
      cwd: require.resolve(`${packageName}/package.json`),
    })!;
  }
}

function getPackageDir(packageName: string) {
  const packageJsonPath = getDepPkgPath(packageName);
  return path.dirname(packageJsonPath);
}

export function getPackageFilePath(packageName: string, filePath: string) {
  const packageDir = getPackageDir(packageName);
  return path.join(packageDir, filePath);
}

export function getPackageFilePathWithExistCheck(packageName: string, filePath: string) {
  const absolutePath = getPackageFilePath(packageName, filePath);
  const exists = fs.existsSync(absolutePath);
  return {
    filePath: absolutePath,
    exists,
  };
}

export function getExposeUrl(packageName: string, filePath: string) {
  return `${PLUGIN_STATICS_PATH}${packageName}/${filePath}`;
}

export function getExposeReadmeUrl(packageName: string, lang: string) {
  let READMEPath = null;
  if (getPackageFilePathWithExistCheck(packageName, `README.${lang}.md`).exists) {
    READMEPath = `README.${lang}.md`;
  } else if (getPackageFilePathWithExistCheck(packageName, 'README.md').exists) {
    READMEPath = 'README.md';
  }

  return READMEPath ? getExposeUrl(packageName, READMEPath) : null;
}

export function getExposeChangelogUrl(packageName: string) {
  const { exists } = getPackageFilePathWithExistCheck(packageName, 'CHANGELOG.md');
  return exists ? getExposeUrl(packageName, 'CHANGELOG.md') : null;
}

/**
 * get package name by client static url
 *
 * @example
 * getPluginNameByClientStaticUrl('/plugins/statics/dayjs/index.js') => 'dayjs'
 * getPluginNameByClientStaticUrl('/plugins/statics/@nocobase/foo/README.md') => '@nocobase/foo'
 */
export function getPackageNameByExposeUrl(pathname: string) {
  pathname = pathname.replace(PLUGIN_STATICS_PATH, '');
  const pathArr = pathname.split('/');
  if (pathname.startsWith('@')) {
    return pathArr.slice(0, 2).join('/');
  }
  return pathArr[0];
}

export function getPackageDirByExposeUrl(pathname: string) {
  return getPackageDir(getPackageNameByExposeUrl(pathname));
}
