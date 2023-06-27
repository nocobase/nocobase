import type { Application } from './Application';
import type { Plugin } from './Plugin';

export type PluginOptions<T = any> = { name?: string; config?: T };
export type PluginType<Opts = any> = typeof Plugin | [typeof Plugin, PluginOptions<Opts>];

export class PluginManager {
  protected pluginInstances: Record<string, Plugin> = {};
  protected plugins: Record<string, PluginType> = {};
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

  async add<T = any>(plugin: typeof Plugin, opts: PluginOptions<T> = {}) {
    const name = opts.name || plugin.pluginName;
    if (!name) {
      throw new Error(`${plugin.name}'s name is required, you can set it in plugin \`static publicName\` or options`);
    }

    // add plugin class
    this.plugins[name] = [plugin, opts];
    const instance = this.getInstance(plugin, opts);

    // add plugin instance
    this.pluginInstances[name] = instance;
    await instance.afterAdd();
  }

  get<T = any>(name: string): T {
    return this.pluginInstances[name] as unknown as T;
  }

  private getInstance<T>(plugin: typeof Plugin, opts?: T) {
    return new plugin(opts, this.app);
  }

  async load() {
    await this.loadStaticPlugin;

    for (const plugin of Object.values(this.pluginInstances)) {
      await plugin.beforeLoad();
    }

    for (const plugin of Object.values(this.pluginInstances)) {
      await plugin.load();
    }
  }
}
