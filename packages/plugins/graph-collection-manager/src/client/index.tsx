import { Plugin } from '@nocobase/client';
import { GraphCollectionProvider } from './GraphCollectionProvider';

export class GraphCollectionPlugin extends Plugin {
  async load() {
    this.app.use(GraphCollectionProvider);
  }
}

export default GraphCollectionPlugin;
