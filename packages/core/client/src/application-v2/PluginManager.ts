import { Application } from './Application';
import { Plugin } from './Plugin';
import { PluginType } from './types';

export class PluginManager {
  protected pluginInstances: Plugin[] = [];
  protected plugins: PluginType[] = [];
  private loadStaticPlugin: Promise<void>;
  constructor(protected _plugins: PluginType[], protected app: Application) {
    this.app = app;
    this.loadStaticPlugin = this.initStaticPlugins(_plugins);
  }

  private async initStaticPlugins(_plugins: PluginType[] = []) {
    for await (const plugin of _plugins) {
      const pluginClass = Array.isArray(plugin) ? plugin[0] : plugin;
      const opts = Array.isArray(plugin) ? plugin[1] : undefined;
      await this.add(pluginClass, opts);
    }
  }

  async add<T = any>(plugin: typeof Plugin, opts?: T) {
    // add plugin class
    this.plugins.push([plugin, opts]);
    const instance = this.getInstance(plugin, opts);

    // add plugin instance
    this.pluginInstances.push(instance);
    await instance.afterAdd();
  }

  private getInstance<T>(plugin: typeof Plugin, opts?: T) {
    return new plugin(opts, this.app);
  }

  async load() {
    await this.loadStaticPlugin;

    for (const plugin of this.pluginInstances) {
      await plugin.beforeLoad();
    }

    for (const plugin of this.pluginInstances) {
      await plugin.load();
    }
  }
}
