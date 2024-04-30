/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import fs from 'fs';
import path from 'path';

export const PLUGIN_STATICS_PATH = '/static/plugins/';

/**
 * get package.json path for specific NPM package
 */
export function getDepPkgPath(packageName: string, cwd?: string) {
  try {
    return require.resolve(`${packageName}/package.json`, { paths: cwd ? [cwd] : undefined });
  } catch {
    const mainFile = require.resolve(`${packageName}`, { paths: cwd ? [cwd] : undefined });
    const packageDir = mainFile.slice(0, mainFile.indexOf(packageName.replace('/', path.sep)) + packageName.length);
    return path.join(packageDir, 'package.json');
  }
}

export function getPackageDir(packageName: string) {
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
  return `${process.env.PLUGIN_STATICS_PATH}${packageName}/${filePath}`;
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
 * getPluginNameByClientStaticUrl('/static/plugins/dayjs/index.js') => 'dayjs'
 * getPluginNameByClientStaticUrl('/static/plugins/@nocobase/foo/README.md') => '@nocobase/foo'
 */
export function getPackageNameByExposeUrl(pathname: string) {
  pathname = pathname.replace(process.env.PLUGIN_STATICS_PATH, '');
  const pathArr = pathname.split('/');
  if (pathname.startsWith('@')) {
    return pathArr.slice(0, 2).join('/');
  }
  return pathArr[0];
}

export function getPackageDirByExposeUrl(pathname: string) {
  return getPackageDir(getPackageNameByExposeUrl(pathname));
}
