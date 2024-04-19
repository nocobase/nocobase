import { Plugin } from '@nocobase/server';

export class PluginGraphCollectionManagerServer extends Plugin {
  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.data-source-manager.graph-collection-manager',
      actions: ['graphPositions:*'],
    });
  }
}

export default PluginGraphCollectionManagerServer;
