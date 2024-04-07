import type { Plugin } from '../Plugin';
import type { PluginData } from '../PluginManager';
import type { RequireJS } from './requirejs';
import type { DevDynamicImport } from '../Application';

/**
 * @internal
 */
export function defineDevPlugins(plugins: Record<string, typeof Plugin>) {
  Object.entries(plugins).forEach(([packageName, plugin]) => {
    window.define(`${packageName}/client`, () => plugin);
  });
}

/**
 * @internal
 */
export function definePluginClient(packageName: string) {
  window.define(`${packageName}/client`, ['exports', packageName], function (_exports: any, _pluginExports: any) {
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
      return acc;
    }, {}),
  });
}

/**
 * @internal
 */
export function processRemotePlugins(pluginData: PluginData[], resolve: (plugins: [string, typeof Plugin][]) => void) {
  return (...pluginModules: (typeof Plugin & { default?: typeof Plugin })[]) => {
    const res: [string, typeof Plugin][] = pluginModules
      .map<[string, typeof Plugin]>((item, index) => [pluginData[index].name, item?.default || item])
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
): Promise<Array<[string, typeof Plugin]>> {
  configRequirejs(requirejs, pluginData);

  const packageNames = pluginData.map((item) => item.packageName);
  packageNames.forEach((packageName) => {
    definePluginClient(packageName);
  });

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
export async function getPlugins(options: GetPluginsOption): Promise<Array<[string, typeof Plugin]>> {
  const { requirejs, pluginData, devDynamicImport } = options;
  if (pluginData.length === 0) return [];

  const res: Array<[string, typeof Plugin]> = [];

  const resolveDevPlugins: Record<string, typeof Plugin> = {};
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
