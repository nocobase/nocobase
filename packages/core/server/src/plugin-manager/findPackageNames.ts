/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  discoverPluginPackages,
  getPresetNocoBasePackageJson,
  parsePluginName,
  resolvePluginPackagePath,
  splitPluginNames,
} from '../../../utils/plugin-package';
import _ from 'lodash';

async function trim(packageNames: string[]) {
  const nameOrPkgs = _.uniq(packageNames).filter(Boolean);
  const names: string[] = [];
  for (const nameOrPkg of nameOrPkgs) {
    const { name, packageName } = await parsePluginName(nameOrPkg, {
      nodeModulesPath: process.env.NODE_MODULES_PATH,
    });
    if (await resolvePluginPackagePath(packageName)) {
      names.push(name);
    }
  }
  return names;
}

const excludes = [
  'external-db-data-source',
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
  try {
    const packages = await discoverPluginPackages({
      nodeModulesPath: process.env.NODE_MODULES_PATH,
    });
    return trim(packages.filter((pkg) => !excludes.includes(pkg.packageName)).map((pkg) => pkg.packageName));
  } catch (error) {
    return [];
  }
}

async function getPackageJson() {
  const packageJson = await getPresetNocoBasePackageJson({
    nodeModulesPath: process.env.NODE_MODULES_PATH,
  });
  if (!packageJson) {
    throw new Error('Cannot find @nocobase/preset-nocobase package.json');
  }
  return packageJson;
}

export async function findBuiltInPlugins() {
  const { APPEND_PRESET_BUILT_IN_PLUGINS = '' } = process.env;
  try {
    const packageJson = await getPackageJson();
    return trim((packageJson.builtIn || []).concat(splitPluginNames(APPEND_PRESET_BUILT_IN_PLUGINS)));
  } catch (error) {
    return [];
  }
}

export async function findLocalPlugins() {
  const packageJson = await getPackageJson();
  const packages = await discoverPluginPackages({
    nodeModulesPath: process.env.NODE_MODULES_PATH,
  });
  const builtInPackageNames = await Promise.all(
    (packageJson.builtIn || [])
      .concat(splitPluginNames(process.env.APPEND_PRESET_BUILT_IN_PLUGINS || ''))
      .map(
        async (nameOrPkg) =>
          (await parsePluginName(nameOrPkg, { nodeModulesPath: process.env.NODE_MODULES_PATH })).packageName,
      ),
  );
  const deprecatedPackageNames = await Promise.all(
    (packageJson.deprecated || []).map(
      async (nameOrPkg) =>
        (await parsePluginName(nameOrPkg, { nodeModulesPath: process.env.NODE_MODULES_PATH })).packageName,
    ),
  );
  return trim(
    _.difference(
      packages.filter((pkg) => !excludes.includes(pkg.packageName)).map((pkg) => pkg.packageName),
      _.uniq(builtInPackageNames.concat(deprecatedPackageNames)),
    ),
  );
}

export async function findAllPlugins() {
  const builtInPlugins = await findBuiltInPlugins();
  const localPlugins = await findLocalPlugins();
  return _.uniq(builtInPlugins.concat(localPlugins));
}

export const packageNameTrim = trim;

export async function appendToBuiltInPlugins(nameOrPkg: string) {
  const APPEND_PRESET_BUILT_IN_PLUGINS = process.env.APPEND_PRESET_BUILT_IN_PLUGINS || '';
  const keys = splitPluginNames(APPEND_PRESET_BUILT_IN_PLUGINS);
  const { name, packageName } = await parsePluginName(nameOrPkg, {
    nodeModulesPath: process.env.NODE_MODULES_PATH,
  });
  if (keys.includes(packageName)) {
    return;
  }
  if (keys.includes(name)) {
    return;
  }
  process.env.APPEND_PRESET_BUILT_IN_PLUGINS += ',' + nameOrPkg;
}
