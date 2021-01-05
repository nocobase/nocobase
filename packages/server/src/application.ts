import Koa from 'koa';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

export interface ApplicationOptions {
  database: any;
  resourcer: any;
}

export class Application extends Koa {

  public readonly database: Database;

  public readonly resourcer: Resourcer;

  protected plugins = new Map<string, any>();

  constructor(options: ApplicationOptions) {
    super();
    this.database = new Database(options.database);
    this.resourcer = new Resourcer();
    // this.runHook('afterInit');
  }

  registerPlugin(key: string | object, plugin?: any) {
    if (typeof key === 'object') {
      Object.keys(key).forEach((k) => {
        this.registerPlugin(k, key[k]);
      });
    } else {
      const config = {};
      if (Array.isArray(plugin)) {
        const [entry, options = {}] = plugin;
        Object.assign(config, { entry, options });
      } else {
        Object.assign(config, { entry: plugin, options: {} });
      }
      this.plugins.set(key, config);
    }
  }

  getPluginInstance(key: string) {
    const plugin = this.plugins.get(key);
    return plugin && plugin.instance;
  }

  async loadPlugins() {
    for (const plugin of this.plugins.values()) {
      plugin.instance = await this.loadPlugin(plugin);
      console.log(plugin.instance);
    }
  }

  protected async loadPlugin({ entry, options = {} }: { entry: string | Function, options: any }) {
    const main = typeof entry === 'function'
      ? entry
      : require(`${entry}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`).default;

    return await main.call(this, options);
  }
}

export default Application;
