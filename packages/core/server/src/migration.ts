import { Migration as DbMigration } from '@nocobase/database';
import Application from './application';
import Plugin from './plugin';
import { PluginManager } from './plugin-manager';

export class Migration extends DbMigration {
  appVersion = '';
  pluginVersion = '';
  on = 'afterLoad';

  get app() {
    return this.context.app as Application;
  }

  get pm() {
    return this.context.app.pm as PluginManager;
  }

  get plugin() {
    return this.context.plugin as Plugin;
  }
}
