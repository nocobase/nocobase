import path from 'path';
import { afterCreate, afterUpdate, afterDestroy } from './hooks';
import { Plugin } from '@nocobase/server';

export default class PluginActionLogs extends Plugin {
  async beforeLoad() {
    this.db.on('afterCreate', afterCreate);
    this.db.on('afterUpdate', afterUpdate);
    this.db.on('afterDestroy', afterDestroy);
  }

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}
