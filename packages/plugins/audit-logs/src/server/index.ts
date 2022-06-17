import { Plugin } from '@nocobase/server';
import path from 'path';
import { afterCreate, afterDestroy, afterUpdate } from './hooks';

export default class PluginActionLogs extends Plugin {
  async beforeLoad() {
    this.db.on('afterCreate', afterCreate(this.app));
    this.db.on('afterUpdate', afterUpdate(this.app));
    this.db.on('afterDestroy', afterDestroy(this.app));
  }

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
    this.db.addMigrations({
      namespace: 'audit-logs',
      directory: path.resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}
