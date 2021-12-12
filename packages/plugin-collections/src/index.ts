import path from 'path';
import { Plugin } from '@nocobase/server';

export default {
  name: 'collections',
  async load(this: Plugin) {
    const database = this.app.db;
    await database.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  },
};
