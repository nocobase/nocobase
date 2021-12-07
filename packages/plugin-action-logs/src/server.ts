import path from 'path';
import { IPlugin } from '@nocobase/server';
import { afterCreate, afterUpdate, afterDestroy } from './hooks';

export default {
  name: 'action-logs',
  async load() {
    const database = this.app.db;
    await database.import({
      directory: path.resolve(__dirname, 'collections'),
    });
    database.on('afterCreate', afterCreate);
    database.on('afterUpdate', afterUpdate);
    database.on('afterDestroy', afterDestroy);
  },
} as IPlugin;
