import type { Plugin } from '../Plugin';
import type { PluginData } from '../PluginManager';
import type { RequireJS } from './requirejs';
import type { DevDynamicImport } from '../Application';

export function defineDevPlugins(plugins: Record<string, typeof Plugin>) {
  Object.entries(plugins).forEach(([name, plugin]) => {
    window.define(name, () => plugin);
  });
}

export function definePluginClient(packageName: string) {
  window.define(`${packageName}/client`, ['exports', packageName], function (_exports: any, _plugin: any) {
    Object.defineProperty(_exports, '__esModule', {
      value: true,
    });
    Object.keys(_plugin).forEach(function (key) {
      if (key === '__esModule') return;
      if (key in _exports && _exports[key] === _plugin[key]) return;
      Object.defineProperty(_exports, key, {
        enumerable: true,
        get: function () {
          return _plugin[key];
        },
      });
    });
  });
}

export function getRemotePlugins(requirejs: any, pluginData: PluginData[] = []): Promise<Array<typeof Plugin>> {
  requirejs.requirejs.config({
    waitSeconds: 120,
    paths: pluginData.reduce<Record<string, string>>((acc, cur) => {
      acc[cur.packageName] = `${cur.url}?noExt`;
      return acc;
    }, {}),
  });

  const packageNames = pluginData.map((item) => item.packageName);
  packageNames.forEach((packageName) => {
    definePluginClient(packageName);
  });
  return new Promise((resolve, reject) => {
    requirejs.requirejs(
      packageNames,
      (...plugins: (typeof Plugin & { default?: typeof Plugin })[]) => {
        const res = plugins.filter((item) => item).map((item) => item.default || item);
        resolve(res);
        const emptyPlugins = plugins
          .map((item, index) => (!item ? index : null))
          .filter((i) => i !== null)
          .map((i) => pluginData[i].packageName);

        if (emptyPlugins.length > 0) {
          console.error(
            '[nocobase load plugin error]: These plugins do not have an `export.default` exported content or there is an error in the plugins. error plugins: \r\n%s',
            emptyPlugins.join(', \r\n'),
          );
        }
      },
      reject,
    );
  });
}

interface GetPluginsOption {
  requirejs: RequireJS;
  pluginData: PluginData[];
  devDynamicImport?: DevDynamicImport;
}

export async function getPlugins(options: GetPluginsOption): Promise<Array<typeof Plugin>> {
  const { requirejs, pluginData, devDynamicImport } = options;

  if (pluginData.length === 0) return [];

  if (process.env.NODE_ENV === 'development' && !process.env.USE_REMOTE_PLUGIN) {
    const plugins: Array<typeof Plugin> = [];

    const resolveDevPlugins: Record<string, typeof Plugin> = {};
    const pluginPackageNames = pluginData.map((item) => item.packageName);
    if (devDynamicImport) {
      for await (const packageName of pluginPackageNames) {
        const plugin = await devDynamicImport(packageName);
        if (plugin) {
          plugins.push(plugin.default);
          resolveDevPlugins[packageName] = plugin.default;
        }
      }
      defineDevPlugins(resolveDevPlugins);
    }

    const remotePlugins = pluginData.filter((item) => !resolveDevPlugins[item.packageName]);

    if (remotePlugins.length === 0) {
      return plugins;
    }

    const remotePluginList = await getRemotePlugins(requirejs, remotePlugins);
    plugins.push(...remotePluginList);
    return plugins;
  }

  return getRemotePlugins(requirejs, pluginData);
}
