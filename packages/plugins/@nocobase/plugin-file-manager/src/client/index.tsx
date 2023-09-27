import { Plugin } from '@nocobase/client';
import { FileManagerProvider } from './FileManagerProvider';
import { NAMESPACE } from './locale';
import { FileStoragePane } from './FileStorage';

export class FileManagerPlugin extends Plugin {
  async load() {
    this.app.use(FileManagerProvider);
    this.app.settingsCenter.add(NAMESPACE, {
      title: `{{t("File manager", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileOutlined',
      Component: FileStoragePane,
      aclSnippet: 'pm.file-manager.storages',
    });
  }
}

export default FileManagerPlugin;
