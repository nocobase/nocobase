import { Plugin } from '@nocobase/server';
import path from 'path';

export default class PluginNotificationsServer extends Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
}
