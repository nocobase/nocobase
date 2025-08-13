import { Plugin } from '@nocobase/server';

export class CloudStoragePlugin extends Plugin {
  async load() {
    // load server plugin
    await this.app.pm.add(require.resolve('./server'));
  }
}

export default CloudStoragePlugin;
