import path from 'path';
import { Plugin } from '@nocobase/server';

export default class PluginNotifications extends Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}
