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

  constructor(options: ApplicationOptions) {
    super();
    this.database = new Database(options.database);
    this.resourcer = new Resourcer();
  }

  async plugins(plugins: any[]) {
    for (const pluginOptions of plugins) {
      if (Array.isArray(pluginOptions)) {
        const [entry, options = {}] = pluginOptions;
        await this.plugin(entry, options);
      } else {
        await this.plugin(pluginOptions);
      }
    }
  }

  async plugin(entry: string | Function, options: any = {}) {
    const main = typeof entry === 'function'
      ? entry
      : require(`${entry}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`).default;
    
    await main.call(this, options);
  }
}

export default Application;
