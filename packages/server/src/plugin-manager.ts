import { Plugin, PluginOptions, PluginType } from './plugin';
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

  add(options?: PluginType | PluginOptions, ext?: PluginOptions): Plugin {
    if (typeof options === 'string') {
      return this.add(require(options).default, ext);
    }

    let instance: Plugin;

    if (typeof options === 'function') {
      try {
        // @ts-ignore
        instance = new options({
          name: options.name,
          ...ext,
          app: this,
        });
        if (!(instance instanceof Plugin)) {
          throw new Error('plugin must be instanceof Plugin');
        }
      } catch (err) {
        // console.log(err);
        instance = new Plugin({
          name: options.name,
          ...ext,
          // @ts-ignore
          load: options,
          app: this.app,
        });
      }
    } else if (typeof options === 'object') {
      const plugin = options.plugin || Plugin;
      instance = new plugin({
        name: options.plugin ? plugin.name : undefined,
        ...options,
        ...ext,
        app: this.app,
      });
    }
    const name = instance.getName();
    if (this.plugins.has(name)) {
      throw new Error(`plugin name [${name}] is repeated`);
    }
    this.plugins.set(name, instance);
    return instance;
  }

  async load() {
    await this.app.emitAsync('beforeLoad');

    for (const [name, plugin] of this.plugins) {
      await plugin.beforeLoad();
    }

    for (const [name, plugin] of this.plugins) {
      await this.app.emitAsync('beforeLoadPlugin', plugin);
      await plugin.load();
      await this.app.emitAsync('afterLoadPlugin', plugin);
    }

    await this.app.emitAsync('afterLoad');
  }
}
