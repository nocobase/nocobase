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
import { PluginManager } from './';

function splitNames(name: string) {
  return (name || '').split(',').filter(Boolean);
}

async function trim(packageNames: string[]) {
  const nameOrPkgs = _.uniq(packageNames).filter(Boolean);
  const names = [];
  for (const nameOrPkg of nameOrPkgs) {
    const { name, packageName } = await PluginManager.parseName(nameOrPkg);
    try {
      await PluginManager.getPackageJson(packageName);
      names.push(name);
    } catch (error) {
      //
    }
  }
  return names;
}

const excludes = [
  '@nocobase/plugin-audit-logs',
  '@nocobase/plugin-backup-restore',
  '@nocobase/plugin-charts',
  '@nocobase/plugin-disable-pm-add',
  '@nocobase/plugin-mobile-client',
  '@nocobase/plugin-mock-collections',
  '@nocobase/plugin-multi-app-share-collection',
  '@nocobase/plugin-notifications',
  '@nocobase/plugin-snapshot-field',
  '@nocobase/plugin-workflow-test',
];

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
        .filter((pkg) => pkg && !excludes.includes(pkg))
        .concat(nocobasePlugins)
        .concat(splitNames(APPEND_PRESET_BUILT_IN_PLUGINS))
        .concat(splitNames(APPEND_PRESET_LOCAL_PLUGINS)),
    );
  } catch (error) {
    return [];
  }
}

async function getPackageJson() {
  const packageJson = await fs.readJson(
    path.resolve(process.env.NODE_MODULES_PATH, '@nocobase/preset-nocobase/package.json'),
  );
  return packageJson;
}

async function findNocobasePlugins() {
  try {
    const packageJson = await getPackageJson();
    const pluginNames = Object.keys(packageJson.dependencies).filter((name) => name.startsWith('@nocobase/plugin-'));
    return trim(pluginNames.filter((pkg) => pkg && !excludes.includes(pkg)));
  } catch (error) {
    return [];
  }
}

export async function findBuiltInPlugins() {
  const { APPEND_PRESET_BUILT_IN_PLUGINS = '' } = process.env;
  try {
    const packageJson = await getPackageJson();
    return trim(packageJson.builtIn.concat(splitNames(APPEND_PRESET_BUILT_IN_PLUGINS)));
  } catch (error) {
    return [];
  }
}

export async function findLocalPlugins() {
  const { APPEND_PRESET_LOCAL_PLUGINS = '' } = process.env;
  const plugins1 = await findNocobasePlugins();
  const plugins2 = await findPackageNames();
  const builtInPlugins = await findBuiltInPlugins();
  const packageJson = await getPackageJson();
  const items = await trim(
    _.difference(
      plugins1.concat(plugins2).concat(splitNames(APPEND_PRESET_LOCAL_PLUGINS)),
      builtInPlugins.concat(await trim(packageJson.deprecated)),
    ),
  );
  return items;
}

export async function findAllPlugins() {
  const builtInPlugins = await findBuiltInPlugins();
  const localPlugins = await findLocalPlugins();
  return _.uniq(builtInPlugins.concat(localPlugins));
}

export const packageNameTrim = trim;

export async function appendToBuiltInPlugins(nameOrPkg: string) {
  const APPEND_PRESET_BUILT_IN_PLUGINS = process.env.APPEND_PRESET_BUILT_IN_PLUGINS || '';
  const keys = APPEND_PRESET_BUILT_IN_PLUGINS.split(',');
  const { name, packageName } = await PluginManager.parseName(nameOrPkg);
  if (keys.includes(packageName)) {
    return;
  }
  if (keys.includes(name)) {
    return;
  }
  process.env.APPEND_PRESET_BUILT_IN_PLUGINS += ',' + nameOrPkg;
}
