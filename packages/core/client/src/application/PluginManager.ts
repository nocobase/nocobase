import type { Application } from './Application';
import type { Plugin } from './Plugin';
import { getPlugins } from './utils/remotePlugins';

export type PluginOptions<T = any> = { name?: string; config?: T };
export type PluginType<Opts = any> = typeof Plugin | [typeof Plugin, PluginOptions<Opts>];

export class PluginManager {
  protected pluginInstances: Map<typeof Plugin, Plugin> = new Map();
  protected pluginsAliases: Record<string, Plugin> = {};
  private initStaticPluginsPromise: Promise<void>;
  private initRemotePluginPromise: Promise<void>;

  constructor(protected _plugins: PluginType[], protected app: Application) {
    this.app = app;
    this.initStaticPluginsPromise = this.initStaticPlugins(_plugins);
    this.initRemotePluginPromise = this.initRemotePlugins();
  }

  private async initStaticPlugins(_plugins: PluginType[] = []) {
    for await (const plugin of _plugins) {
      const pluginClass = Array.isArray(plugin) ? plugin[0] : plugin;
      const opts = Array.isArray(plugin) ? plugin[1] : undefined;
      await this.add(pluginClass, opts);
    }
  }

  private async initRemotePlugins() {
    const res = await this.app.apiClient.request({ url: 'app:getPlugins' });
    const pluginsUrls: Record<string, string> = res.data?.data || {};
    const plugins = await getPlugins(pluginsUrls);
    for await (const plugin of plugins) {
      await this.add(plugin);
    }
  }

  async add<T = any>(plugin: typeof Plugin, opts: PluginOptions<T> = {}) {
    const instance = this.getInstance(plugin, opts);

    this.pluginInstances.set(plugin, instance);

    if (opts.name) {
      this.pluginsAliases[opts.name] = instance;
    }
    await instance.afterAdd();
  }

  get<T extends typeof Plugin>(PluginClass: T): InstanceType<T>;
  get<T extends {}>(name: string): T;
  get(name: any) {
    if (typeof name === 'string') {
      return this.pluginsAliases[name];
    }
    return this.pluginInstances.get(name);
  }

  private getInstance<T>(plugin: typeof Plugin, opts?: T) {
    return new plugin(opts, this.app);
  }

  async load() {
    await this.initStaticPluginsPromise;
    await this.initRemotePluginPromise;

    for (const plugin of this.pluginInstances.values()) {
      await plugin.beforeLoad();
    }

    for (const plugin of this.pluginInstances.values()) {
      await plugin.load();
    }
  }
}
