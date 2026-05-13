/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DevDynamicImport } from '../Application';
import type { PluginClass } from '../PluginManager';
import type { PluginData } from '../PluginManager';
import type { RequireJS } from './requirejs';

function getClientV2ModuleId(packageName: string) {
  return `${packageName}/client-v2`;
}

/**
 * @internal
 */
export function defineDevPlugins(plugins: Record<string, PluginClass>) {
  Object.entries(plugins).forEach(([packageName, plugin]) => {
    window.define(getClientV2ModuleId(packageName), () => plugin);
  });
}

/**
 * @internal
 */
export function configRequirejs(requirejs: any, pluginData: PluginData[]) {
  requirejs.requirejs.config({
    waitSeconds: 120,
    paths: pluginData.reduce<Record<string, string>>((acc, cur) => {
      acc[getClientV2ModuleId(cur.packageName)] = cur.url;
      return acc;
    }, {}),
  });
}

/**
 * @internal
 */
export function processRemotePlugins(pluginData: PluginData[], resolve: (plugins: [string, PluginClass][]) => void) {
  return (...pluginModules: (PluginClass & { default?: PluginClass })[]) => {
    const res: [string, PluginClass][] = pluginModules
      .map<[string, PluginClass]>((item, index) => [pluginData[index].name, item?.default || item])
      .filter((item) => item[1]);
    resolve(res);

    const emptyPlugins = pluginModules
      .map((item, index) => (!item ? index : null))
      .filter((i) => i !== null)
      .map((i) => pluginData[i].packageName);

    if (emptyPlugins.length > 0) {
      console.error(
        '[nocobase load plugin error]: These plugins do not have an `export.default` exported content or there is an error in the plugins. error plugins: \r\n%s',
        emptyPlugins.join(', \r\n'),
      );
    }
  };
}

/**
 * @internal
 */
export function getRemotePlugins(requirejs: any, pluginData: PluginData[] = []): Promise<Array<[string, PluginClass]>> {
  configRequirejs(requirejs, pluginData);

  const packageNames = pluginData.map((item) => getClientV2ModuleId(item.packageName));

  return new Promise((resolve, reject) => {
    requirejs.requirejs(packageNames, processRemotePlugins(pluginData, resolve), reject);
  });
}

interface GetPluginsOption {
  requirejs: RequireJS;
  pluginData: PluginData[];
  devDynamicImport?: DevDynamicImport;
}

/**
 * @internal
 */
export async function getPlugins(options: GetPluginsOption): Promise<Array<[string, PluginClass]>> {
  const { requirejs, pluginData, devDynamicImport } = options;
  if (pluginData.length === 0) return [];

  const res: Array<[string, PluginClass]> = [];

  const resolveDevPlugins: Record<string, PluginClass> = {};
  if (devDynamicImport) {
    for await (const plugin of pluginData) {
      const pluginModule = await devDynamicImport(plugin.packageName);
      if (pluginModule) {
        res.push([plugin.name, pluginModule.default]);
        resolveDevPlugins[plugin.packageName] = pluginModule.default;
      }
    }
    defineDevPlugins(resolveDevPlugins);
  }

  const remotePlugins = pluginData.filter((item) => !resolveDevPlugins[item.packageName]);

  if (remotePlugins.length === 0) {
    return res;
  }

  const remotePluginList = await getRemotePlugins(requirejs, remotePlugins);
  res.push(...remotePluginList);

  return res;
}
