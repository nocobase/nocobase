import type { Plugin } from '../Plugin';
import type { PluginData } from '../PluginManager';
import type { RequireJS } from './requirejs';

export function defineDevPlugins(plugins: Record<string, typeof Plugin>) {
  Object.entries(plugins).forEach(([name, plugin]) => {
    window.define(name, () => plugin);
  });
}

export function getRemotePlugins(
  requirejs: any,
  pluginData: PluginData[] = [],
  baseURL = '',
): Promise<(typeof Plugin)[]> {
  if (baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
  }
  if (baseURL.endsWith('/api')) {
    baseURL = baseURL.slice(0, -4);
  }

  requirejs.requirejs.config({
    paths: pluginData.reduce<Record<string, string>>((memo, item) => {
      memo[item.packageName] = `${baseURL}${item.url}`;
      memo[`${item.packageName}/client`] = `${baseURL}${item.url}.js?client`;
      return memo;
    }, {}),
  });

  return new Promise((resolve, reject) => {
    requirejs.requirejs(
      pluginData.map((item) => item.packageName),
      (...plugins: (typeof Plugin & { default?: typeof Plugin })[]) => {
        resolve(plugins.map((item) => item.default || item));
      },
      reject,
    );
  });
}

interface GetPluginsOption {
  requirejs: RequireJS;
  pluginData: PluginData[];
  baseURL?: string;
  devPlugins?: Record<string, typeof Plugin>;
}

export async function getPlugins(options: GetPluginsOption): Promise<(typeof Plugin)[]> {
  const { requirejs, pluginData, baseURL, devPlugins = {} } = options;

  if (pluginData.length === 0) return [];

  if (process.env.NODE_ENV === 'development' && !process.env.USE_REMOTE_PLUGIN) {
    const plugins = [];

    defineDevPlugins(devPlugins);

    const localPlugins = pluginData.map((item) => devPlugins[item.packageName]);
    const remotePlugins = pluginData.filter((item) => !devPlugins[item.packageName]);
    plugins.push(...localPlugins);

    if (remotePlugins.length === 0) {
      return plugins;
    }

    const remotePluginList = await getRemotePlugins(requirejs, remotePlugins, baseURL);
    plugins.push(...remotePluginList);
    return plugins;
  }

  return getRemotePlugins(requirejs, pluginData, baseURL);
}
