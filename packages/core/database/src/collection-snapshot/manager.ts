import Database from '../database';
import { Collection } from '../collection';
import path from 'path';
import fsPromises from 'fs/promises';

export class CollectionSnapshotManager {
  constructor(private db: Database) {}

  enabled(): boolean {
    return !!this.storageDir();
  }

  storageDir() {
    return this.db.options.collectionSnapshotDir;
  }

  async hasChanged(collection: Collection) {
    const snapshot = await this.getSnapshot(collection);
    if (!snapshot) {
      return true;
    }

    const currentSnapshot = collection.getDefinitionSnapshot();
    return snapshot.hash !== currentSnapshot.hash;
  }

  async getSnapshot(collection: Collection) {
    const storagePath = this.storagePath(collection);

    const exists = await fsPromises
      .access(storagePath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      return null;
    }

    return await fsPromises.readFile(storagePath).then((data) => {
      return JSON.parse(data.toString());
    });
  }

  async saveSnapshot(collection: Collection) {
    const snapshot = collection.getDefinitionSnapshot();
    const storagePath = this.storagePath(collection);
    const dirName = path.dirname(storagePath);
    await fsPromises.mkdir(dirName, { recursive: true });

    await fsPromises.writeFile(storagePath, JSON.stringify(snapshot));
  }

  async clean() {
    if (this.enabled()) {
      return fsPromises.rm(this.storageDir(), { recursive: true, force: true });
    }
  }

  private storagePath(collection: Collection) {
    if (!this.enabled()) {
      throw new Error('collection Snapshot directory is not set');
    }

    return path.join(this.storageDir(), `${collection.getTableNameWithSchemaAsString()}.json`);
  }
}
