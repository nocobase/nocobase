import Koa from 'koa';
import Database from '@nocobase/database';
import Resourcer, { Action, ParsedParams } from '@nocobase/resourcer';

export class Application extends Koa {

  database: Database;

  resourcer: Resourcer;

  async plugins(plugins: any[]) {
    for (const pluginOption of plugins) {
      let plugin: Function;
      let options = {};
      if (Array.isArray(pluginOption)) {
        plugin = pluginOption.shift();
        options = pluginOption.shift()||{};
        if (typeof plugin === 'function') {
          plugin = plugin.bind(this);
        } else if (typeof plugin === 'string') {
          const libDir = __filename.endsWith('.ts') ? 'src' : 'lib';
          plugin = require(`${plugin}/${libDir}/server`).default;
          plugin = plugin.bind(this);
        }
      } else if (typeof pluginOption === 'function') {
        plugin = pluginOption.bind(this);
      }
      await plugin(options);
    }
  }
}

export default Application;
