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

function defineAppDevPluginModule(moduleId: string, pluginModule: RemotePluginModule) {
  window.__nocobase_app_dev_plugins__ = window.__nocobase_app_dev_plugins__ || {};
  window.__nocobase_app_dev_plugins__[moduleId] = pluginModule;
}

/**
 * @internal
 */
export function defineDevPlugins(plugins: Record<string, RemotePluginModule>) {
  Object.entries(plugins).forEach(([packageName, pluginModule]) => {
    const moduleId = getClientV2ModuleId(packageName);
    window.define(moduleId, () => pluginModule);
    defineAppDevPluginModule(moduleId, pluginModule);
  });
}

function defineDevPluginModules(plugins: Record<string, RemotePluginModule>) {
  Object.entries(plugins).forEach(([packageName, pluginModule]) => {
    const moduleId = getClientV2ModuleId(packageName);
    window.define(moduleId, () => pluginModule);
    defineAppDevPluginModule(moduleId, pluginModule);
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
    pluginModules.forEach((item, index) => {
      if (item) {
        defineAppDevPluginModule(getClientV2ModuleId(pluginData[index].packageName), item);
      }
    });

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
  for (const plugin of sortPluginsByAppDevDependencies(pluginData)) {
    const pluginModule: RemotePluginModule = await import(/* webpackIgnore: true */ plugin.url);
    const pluginClass = getPluginClass(pluginModule);
    if (pluginClass) {
      plugins.push([plugin.name, pluginClass]);
      defineDevPluginModules({ [plugin.packageName]: pluginModule });
    }
  }
  return plugins;
}

function sortPluginsByAppDevDependencies(pluginData: PluginData[] = []) {
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

async function getMixedRemotePluginsInOrder(
  requirejs: RequireJS,
  pluginData: PluginData[] = [],
): Promise<Array<[string, PluginClass]>> {
  const plugins: Array<[string, PluginClass]> = [];
  let requirejsPlugins: PluginData[] = [];
  const flushRequirejsPlugins = async () => {
    if (requirejsPlugins.length === 0) {
      return;
    }
    const remotePluginList = await getRemotePlugins(requirejs, requirejsPlugins);
    plugins.push(...remotePluginList);
    requirejsPlugins = [];
  };

  for (const plugin of sortPluginsByAppDevDependencies(pluginData)) {
    if (plugin.devMode === 'esm') {
      await flushRequirejsPlugins();
      const esmPluginList = await getEsmDevPlugins([plugin]);
      plugins.push(...esmPluginList);
      continue;
    }
    requirejsPlugins.push(plugin);
  }

  await flushRequirejsPlugins();
  return plugins;
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
  const resolveDevPluginModules: Record<string, RemotePluginModule> = {};
  if (devDynamicImport) {
    for await (const plugin of pluginData) {
      const pluginModule: RemotePluginModule | null = await devDynamicImport(plugin.packageName);
      if (pluginModule) {
        const pluginClass = getPluginClass(pluginModule);
        res.push([plugin.name, pluginClass]);
        resolveDevPlugins[plugin.packageName] = pluginClass;
        resolveDevPluginModules[plugin.packageName] = pluginModule;
      }
    }
    defineDevPlugins(resolveDevPluginModules);
  }

  const remotePlugins = pluginData.filter((item) => !resolveDevPlugins[item.packageName]);
  const esmDevPlugins = remotePlugins.filter((item) => item.devMode === 'esm');
  const requirejsPlugins = remotePlugins.filter((item) => item.devMode !== 'esm');

  if (esmDevPlugins.length === 0) {
    if (requirejsPlugins.length === 0) {
      return res;
    }
    const remotePluginList = await getRemotePlugins(requirejs, requirejsPlugins);
    res.push(...remotePluginList);
    return res;
  }

  const mixedPluginList = await getMixedRemotePluginsInOrder(requirejs, remotePlugins);
  res.push(...mixedPluginList);
  return res;
}
