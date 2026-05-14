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

type RemotePluginModule = PluginClass | ({ default?: PluginClass } & Record<string, unknown>);

function getClientV2ModuleId(packageName: string) {
  return `${packageName}/client-v2`;
}

function getPluginClass(pluginModule: RemotePluginModule): PluginClass {
  const defaultPlugin = 'default' in pluginModule ? pluginModule.default : undefined;
  return defaultPlugin || (pluginModule as PluginClass);
}

/**
 * @internal
 */
export function defineDevPlugins(plugins: Record<string, PluginClass>) {
  Object.entries(plugins).forEach(([packageName, plugin]) => {
    window.define(getClientV2ModuleId(packageName), () => plugin);
  });
}

function defineDevPluginModules(plugins: Record<string, RemotePluginModule>) {
  window.__nocobase_app_dev_plugins__ = window.__nocobase_app_dev_plugins__ || {};
  Object.entries(plugins).forEach(([packageName, pluginModule]) => {
    window.define(getClientV2ModuleId(packageName), () => pluginModule);
    window.__nocobase_app_dev_plugins__[getClientV2ModuleId(packageName)] = pluginModule;
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

async function getEsmDevPlugins(pluginData: PluginData[] = []): Promise<Array<[string, PluginClass]>> {
  const plugins: Array<[string, PluginClass]> = [];
  for (const plugin of sortEsmDevPlugins(pluginData)) {
    const pluginModule: RemotePluginModule = await import(/* webpackIgnore: true */ plugin.url);
    const pluginClass = getPluginClass(pluginModule);
    if (pluginClass) {
      plugins.push([plugin.name, pluginClass]);
      defineDevPluginModules({ [plugin.packageName]: pluginModule });
    }
  }
  return plugins;
}

function sortEsmDevPlugins(pluginData: PluginData[] = []) {
  const pluginMap = new Map(pluginData.map((plugin) => [plugin.packageName, plugin]));
  const sorted: PluginData[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (plugin: PluginData) => {
    if (visited.has(plugin.packageName)) {
      return;
    }
    if (visiting.has(plugin.packageName)) {
      return;
    }
    visiting.add(plugin.packageName);
    for (const dep of plugin.appDevDependencies || []) {
      const depPlugin = pluginMap.get(dep);
      if (depPlugin) {
        visit(depPlugin);
      }
    }
    visiting.delete(plugin.packageName);
    visited.add(plugin.packageName);
    sorted.push(plugin);
  };

  pluginData.forEach(visit);
  return sorted;
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
  const esmDevPlugins = remotePlugins.filter((item) => item.devMode === 'esm');
  const requirejsPlugins = remotePlugins.filter((item) => item.devMode !== 'esm');

  if (esmDevPlugins.length) {
    const esmPluginList = await getEsmDevPlugins(esmDevPlugins);
    res.push(...esmPluginList);
  }

  if (requirejsPlugins.length === 0) {
    return res;
  }

  const remotePluginList = await getRemotePlugins(requirejs, requirejsPlugins);
  res.push(...remotePluginList);

  return res;
}
