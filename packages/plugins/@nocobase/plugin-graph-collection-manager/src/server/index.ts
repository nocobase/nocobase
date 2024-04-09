import { Plugin } from '@nocobase/server';
import path from 'path';

export class PluginGraphCollectionManagerServer extends Plugin {
  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));
    this.app.acl.allow('graphPositions', '*');
  }
}

export default PluginGraphCollectionManagerServer;
