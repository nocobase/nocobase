import { Plugin, PluginInterface, PluginOptions, PluginType } from './plugin';
import Application from './application';

interface PluginManagerOptions {
  app: Application;
}

export class PluginManager {
  app: Application;
  protected plugins = new Map<string, Plugin>();

  constructor(options: PluginManagerOptions) {
    this.app = options.app;
  }

  get(name: string) {
    return this.plugins.get(name);
  }

  add(pluginClass: any, ext?: PluginOptions): Plugin {
    const instance = new pluginClass({
      ...ext,
      app: this.app,
    });

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
}
