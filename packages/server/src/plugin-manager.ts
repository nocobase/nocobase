import Application from './application';
import { Plugin } from './plugin';

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

  add<P = Plugin, O = any>(pluginClass: any, options?: O): P {
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

  async install() {
    for (const [name, plugin] of this.plugins) {
      await this.app.emitAsync('beforeInstallPlugin', plugin);
      await this.app.emitAsync(`beforeInstall${name}`, plugin);
      await plugin.install();
      await this.app.emitAsync('afterInstallPlugin', plugin);
      await this.app.emitAsync(`afterInstall${name}`, plugin);
    }
  }
}
