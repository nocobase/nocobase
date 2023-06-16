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

  private async initStaticPlugins(_plugins: PluginType[]) {
    for await (const plugin of _plugins) {
      await this.add(plugin);
    }
  }

  async add(plugin: PluginType) {
    // add plugin class
    this.plugins.push(plugin);
    const instance = this.getInstance(plugin);

    // add plugin instance
    this.pluginInstances.push(instance);
    await instance.afterAdd();
  }

  private getInstance(plugin: PluginType) {
    const PluginClass = Array.isArray(plugin) ? plugin[0] : plugin;
    const opts = Array.isArray(plugin) ? plugin[1] : undefined;
    return new PluginClass(opts, this.app);
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
