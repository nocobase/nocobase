import { Application } from './Application';
import { Plugin } from './Plugin';
import { type PluginOptions } from './types';

export interface PluginManagerOptions {
  plugins: string[];
}

type PluginNameOrClass = string | typeof Plugin;

export class PluginManager {
  protected pluginInstances: Map<string, Plugin>;
  protected pluginPrepares: Map<string, any>;

  constructor(protected app: Application) {
    this.pluginInstances = new Map();
    this.pluginPrepares = new Map();
    this.addPresetPlugins();
  }

  protected addPresetPlugins() {
    const { plugins } = this.app.options;
    for (const plugin of plugins) {
      if (typeof plugin === 'string') {
        this.prepare(plugin);
      } else {
        this.prepare(...plugin);
      }
    }
  }

  prepare(nameOrClass: PluginNameOrClass, options?: PluginOptions) {
    let opts: any = {};
    if (typeof nameOrClass === 'string') {
      opts['name'] = nameOrClass;
    } else {
      opts = { ...options, Plugin: nameOrClass };
    }
    return this.pluginPrepares.set(opts.name, opts);
  }

  async add(nameOrClass: PluginNameOrClass, options?: PluginOptions) {
    let opts: any = {};
    if (typeof nameOrClass === 'string') {
      opts['name'] = nameOrClass;
    } else {
      opts = { ...options, Plugin: nameOrClass };
    }
    const plugin = await this.makePlugin(opts);
    this.pluginInstances.set(plugin.name, plugin);
    return plugin;
  }

  async makePlugin(opts) {
    const { importPlugins } = this.app.options;
    let P: typeof Plugin = opts.Plugin;
    if (!P) {
      P = await importPlugins(opts.name);
    }
    if (!P) {
      throw new Error(`Plugin "${opts.name} " not found`);
    }
    console.log(opts, P);
    return new P(opts, this.app);
  }

  async load() {
    for (const opts of this.pluginPrepares.values()) {
      const plugin = await this.makePlugin(opts);
      this.pluginInstances.set(plugin.name, plugin);
    }

    for (const plugin of this.pluginInstances.values()) {
      await plugin.beforeLoad();
    }

    for (const plugin of this.pluginInstances.values()) {
      await plugin.load();
    }
  }
}
