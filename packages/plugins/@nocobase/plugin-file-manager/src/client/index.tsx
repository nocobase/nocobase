import { Plugin } from '@nocobase/client';
import { FileManagerProvider } from './FileManagerProvider';
import { storageTypes } from './schemas/storageTypes';

export class FileManagerPlugin extends Plugin {
  storageTypes = new Map();

  async load() {
    this.app.use(FileManagerProvider);
    Object.values(storageTypes).forEach((storageType) => {
      this.registerStorageType(storageType.name, storageType);
    });
  }

  registerStorageType(name: string, options) {
    this.storageTypes.set(name, options);
  }
}

export default FileManagerPlugin;
