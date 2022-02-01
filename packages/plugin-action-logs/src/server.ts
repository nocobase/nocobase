import path from 'path';
import { Plugin } from '@nocobase/server';
import { afterCreate, afterUpdate, afterDestroy } from './hooks';

export default class extends Plugin {
  name: 'action-logs';
  async load() {
    const database = this.app.db;
    await database.import({
      directory: path.resolve(__dirname, 'collections'),
    });
    database.on('afterCreate', afterCreate);
    database.on('afterUpdate', afterUpdate);
    database.on('afterDestroy', afterDestroy);
  }
};
