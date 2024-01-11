import { Plugin } from '@nocobase/client';
import { SnapshotFieldProvider } from './SnapshotFieldProvider';
import { snapshotBlockInitializers } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializers';
import { snapshot } from './interface';

export class SnapshotFieldPlugin extends Plugin {
  async load() {
    this.app.use(SnapshotFieldProvider);
    this.app.schemaInitializerManager.add(snapshotBlockInitializers);
    this.app.collectionManager.addCollectionFieldInterfaces([snapshot]);
  }
}

export default SnapshotFieldPlugin;
