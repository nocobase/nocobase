import Koa from 'koa';
import Database, { DatabaseOptions } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

export interface ApplicationOptions {
  database: DatabaseOptions;
  resourcer?: any;
}

export class Application extends Koa {
  // static const EVENT_PLUGINS_LOADED = Symbol('pluginsLoaded');

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
    const allPlugins = this.plugins.values();
    for (const plugin of allPlugins) {
      plugin.instance = await this.loadPlugin(plugin);
    }
  }

  protected async loadPlugin({ entry, options = {} }: { entry: string | Function, options: any }) {
    let main: any;
    if (typeof entry === 'function') {
      main = entry;
    } else if (typeof entry === 'string') {
      const pathname = `${entry}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`;
      main = require(pathname).default;
    }
    return main && await main.call(this, options);
  }
}

export default Application;
