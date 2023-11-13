import { Plugin } from '@nocobase/client';
import { FileManagerProvider } from './FileManagerProvider';
import { FileStoragePane } from './FileStorage';
import { NAMESPACE } from './locale';
import { storageTypes } from './schemas/storageTypes';

export class FileManagerPlugin extends Plugin {
  storageTypes = new Map();

  async load() {
    this.app.use(FileManagerProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("File manager", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileOutlined',
      Component: FileStoragePane,
      aclSnippet: 'pm.file-manager.storages',
    });
    Object.values(storageTypes).forEach((storageType) => {
      this.registerStorageType(storageType.name, storageType);
    });
  }

  registerStorageType(name: string, options) {
    this.storageTypes.set(name, options);
  }
}

export default FileManagerPlugin;
