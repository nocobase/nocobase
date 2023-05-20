import { Migration as DbMigration } from '@nocobase/database';
import type Application from './application';
import type Plugin from './plugin';

export class Migration extends DbMigration {
  get app() {
    return this.context.app as Application;
  }

  get plugin() {
    return this.context.plugin as Plugin;
  }
}
