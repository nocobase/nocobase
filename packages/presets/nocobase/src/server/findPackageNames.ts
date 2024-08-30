/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fg from 'fast-glob';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';

function splitNames(name: string) {
  return (name || '').split(',').filter(Boolean);
}

function trim(packageNames: string[]) {
  return _.uniq(packageNames)
    .filter(Boolean)
    .map((packageName) => {
      return packageName.replace('@nocobase/plugin-', '');
    });
}

export async function findPackageNames() {
  const patterns = [
    './packages/plugins/*/package.json',
    './packages/plugins/*/*/package.json',
    './packages/pro-plugins/*/*/package.json',
    './storage/plugins/*/package.json',
    './storage/plugins/*/*/package.json',
  ];
  try {
    const packageJsonPaths = await fg(patterns, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ['**/external-db-data-source/**'],
    });
    const packageNames = await Promise.all(
      packageJsonPaths.map(async (packageJsonPath) => {
        const packageJson = await fs.readJson(packageJsonPath);
        return packageJson.name;
      }),
    );
    const nocobasePlugins = await findNocobasePlugins();
    const { APPEND_PRESET_BUILT_IN_PLUGINS = '', APPEND_PRESET_LOCAL_PLUGINS = '' } = process.env;
    return trim(
      packageNames
        .filter(Boolean)
        .concat(nocobasePlugins)
        .concat(splitNames(APPEND_PRESET_BUILT_IN_PLUGINS))
        .concat(splitNames(APPEND_PRESET_LOCAL_PLUGINS)),
    );
  } catch (error) {
    return [];
  }
}

async function findNocobasePlugins() {
  try {
    const packageJson = await fs.readJson(path.resolve(__dirname, '../../package.json'));
    const pluginNames = Object.keys(packageJson.dependencies).filter((name) => name.startsWith('@nocobase/plugin-'));
    return pluginNames;
  } catch (error) {
    return [];
  }
}

export async function findBuiltInPlugins() {
  const { APPEND_PRESET_BUILT_IN_PLUGINS = '' } = process.env;
  try {
    const packageJson = await fs.readJson(path.resolve(__dirname, '../../package.json'));
    return trim(packageJson.builtIn.concat(splitNames(APPEND_PRESET_BUILT_IN_PLUGINS)));
  } catch (error) {
    return [];
  }
}
