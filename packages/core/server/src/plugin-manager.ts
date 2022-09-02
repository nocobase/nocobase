import { CleanOptions, SyncOptions } from '@nocobase/database';
import Application from './application';
import { Plugin } from './plugin';

interface PluginManagerOptions {
  app: Application;
}

export interface InstallOptions {
  cliArgs?: any[];
  clean?: CleanOptions | boolean;
  sync?: SyncOptions;
}

type PluginConstructor<P, O = any> = { new(app: Application, options: O): P };

export class PluginManager {
  app: Application;
  protected plugins = new Map<string, Plugin>();

  constructor(options: PluginManagerOptions) {
    this.app = options.app;
  }

  getPlugins() {
    return this.plugins;
  }

  get(name: string) {
    return this.plugins.get(name);
  }

  add<P extends Plugin = Plugin, O = any>(pluginClass: PluginConstructor<P, O>, options?: O): P {
    const instance = new pluginClass(this.app, options);

    const name = instance.getName();

    if (this.plugins.has(name)) {
      throw new Error(`plugin name [${name}] `);
    }

    this.plugins.set(name, instance);

    return instance;
  }

  async load() {
    await this.app.emitAsync('beforeLoadAll');

    for (const [name, plugin] of this.plugins) {
      await plugin.beforeLoad();
    }

    for (const [name, plugin] of this.plugins) {
      await this.app.emitAsync('beforeLoadPlugin', plugin);
      await plugin.load();
      await this.app.emitAsync('afterLoadPlugin', plugin);
    }

    await this.app.emitAsync('afterLoadAll');
  }

  async install(options: InstallOptions = {}) {
    for (const [name, plugin] of this.plugins) {
      await this.app.emitAsync('beforeInstallPlugin', plugin, options);
      await plugin.install(options);
      await this.app.emitAsync('afterInstallPlugin', plugin, options);
    }
  }

  static resolvePlugin(pluginName: string) {
    return require(pluginName).default;
  }
}
