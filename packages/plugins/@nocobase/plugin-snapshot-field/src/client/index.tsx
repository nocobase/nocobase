import { Plugin } from '@nocobase/client';
import { SnapshotFieldProvider } from './SnapshotFieldProvider';
import { snapshotBlockInitializers } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializers';

export class SnapshotFieldPlugin extends Plugin {
  async load() {
    this.app.use(SnapshotFieldProvider);
    this.app.schemaInitializerManager.add(snapshotBlockInitializers);
  }
}

export default SnapshotFieldPlugin;
