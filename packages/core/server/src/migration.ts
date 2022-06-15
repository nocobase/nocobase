import { Migration as DbMigration } from '@nocobase/database';
import Application from './application';

export class Migration extends DbMigration {
  get app() {
    return this.context.app as Application;
  }
}
