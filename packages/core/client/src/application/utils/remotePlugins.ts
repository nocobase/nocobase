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

type RemotePluginModule = PluginClass<any> | ({ default?: PluginClass<any> } & Record<string, unknown>);

function getPluginClass(pluginModule: RemotePluginModule): PluginClass<any> {
  const defaultPlugin = 'default' in pluginModule ? pluginModule.default : undefined;
  return defaultPlugin || (pluginModule as PluginClass<any>);
}

function getClientModuleId(packageName: string) {
  return `${packageName}/client`;
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
    const moduleId = getClientModuleId(packageName);
    window.define(moduleId, () => pluginModule);
    defineAppDevPluginModule(moduleId, pluginModule);
  });
}

function defineDevPluginModules(plugins: Record<string, RemotePluginModule>) {
  Object.entries(plugins).forEach(([packageName, pluginModule]) => {
    const moduleId = getClientModuleId(packageName);
    window.define(moduleId, () => pluginModule);
    defineAppDevPluginModule(moduleId, pluginModule);
  });
}

/**
 * @internal
 */
export function definePluginClient(packageName: string) {
  const moduleId = getClientModuleId(packageName);
  window.define(moduleId, ['exports', packageName], function (_exports: any, _pluginExports: any) {
    Object.defineProperty(_exports, '__esModule', {
      value: true,
    });
    Object.keys(_pluginExports).forEach(function (key) {
      if (key === '__esModule') return;
      if (key in _exports && _exports[key] === _pluginExports[key]) return;
      Object.defineProperty(_exports, key, {
        enumerable: true,
        get: function () {
          return _pluginExports[key];
        },
      });
    });
    defineAppDevPluginModule(moduleId, _exports);
  });
}

/**
 * @internal
 */
export function configRequirejs(requirejs: any, pluginData: PluginData[]) {
  requirejs.requirejs.config({
    waitSeconds: 120,
    paths: pluginData.reduce<Record<string, string>>((acc, cur) => {
      acc[cur.packageName] = cur.url;
      // 仅当服务端确认该插件存在 client-v2 产物时才注册子路径,避免对纯 v1 插件埋下静默 404。
      if (cur.clientV2Url) {
        acc[`${cur.packageName}/client-v2`] = cur.clientV2Url;
      }
      return acc;
    }, {}),
  });
}

/**
 * @internal
 */
export function processRemotePlugins(
  pluginData: PluginData[],
  resolve: (plugins: [string, PluginClass<any>][]) => void,
) {
  return (...pluginModules: (PluginClass<any> & { default?: PluginClass<any> })[]) => {
    pluginModules.forEach((item, index) => {
      if (item) {
        defineAppDevPluginModule(getClientModuleId(pluginData[index].packageName), item);
      }
    });

    const res: [string, PluginClass<any>][] = pluginModules
      .map<[string, PluginClass<any>]>((item, index) => [pluginData[index].name, item?.default || item])
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
export function getRemotePlugins(
  requirejs: any,
  pluginData: PluginData[] = [],
): Promise<Array<[string, PluginClass<any>]>> {
  configRequirejs(requirejs, pluginData);

  const packageNames = pluginData.map((item) => item.packageName);
  packageNames.forEach((packageName) => {
    definePluginClient(packageName);
  });

  return new Promise((resolve, reject) => {
    requirejs.requirejs(packageNames, processRemotePlugins(pluginData, resolve), reject);
  });
}

async function getEsmDevPlugins(pluginData: PluginData[] = []): Promise<Array<[string, PluginClass<any>]>> {
  const plugins: Array<[string, PluginClass<any>]> = [];
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
): Promise<Array<[string, PluginClass<any>]>> {
  const plugins: Array<[string, PluginClass<any>]> = [];
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
export async function getPlugins(options: GetPluginsOption): Promise<Array<[string, PluginClass<any>]>> {
  const { requirejs, pluginData, devDynamicImport } = options;
  if (pluginData.length === 0) return [];

  const res: Array<[string, PluginClass<any>]> = [];

  const resolveDevPlugins: Record<string, PluginClass<any>> = {};
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
