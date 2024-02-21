import { Plugin } from '@nocobase/client';
import { SnapshotFieldProvider } from './SnapshotFieldProvider';
import { snapshotBlockInitializers } from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializers';
import { SnapshotFieldInterface } from './interface';

export class SnapshotFieldPlugin extends Plugin {
  async load() {
    this.app.use(SnapshotFieldProvider);
    this.app.schemaInitializerManager.add(snapshotBlockInitializers);
    this.app.dataSourceManager.addFieldInterfaces([SnapshotFieldInterface]);
  }
}

export default SnapshotFieldPlugin;
