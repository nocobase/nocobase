import { Plugin } from '@nocobase/server';
import path from 'path';
import { afterCreate, afterDestroy, afterUpdate } from './hooks';

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

    console.log(this.db.getCollection('auditLogs').fields);
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}
