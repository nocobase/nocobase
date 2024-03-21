import { Plugin, useCollection_deprecated } from '@nocobase/client';
import { FileManagerProvider } from './FileManagerProvider';
import { FileStoragePane } from './FileStorage';
import { NAMESPACE } from './locale';
import { storageTypes } from './schemas/storageTypes';
import { AttachmentFieldInterface } from './interfaces/attachment';
import { FileCollectionTemplate } from './templates';

export class FileManagerPlugin extends Plugin {
  storageTypes = new Map();

  async load() {
    this.app.dataSourceManager.addFieldInterfaces([AttachmentFieldInterface]);
    this.app.dataSourceManager.addCollectionTemplates([FileCollectionTemplate]);

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

    const tableActionInitializers = this.app.schemaInitializerManager.get('table:configureActions');
    tableActionInitializers?.add('enableActions.upload', {
      title: "{{t('Upload')}}",
      Component: 'UploadActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible() {
        const collection = useCollection_deprecated();
        return collection.template === 'file';
      },
    });
  }

  registerStorageType(name: string, options) {
    this.storageTypes.set(name, options);
  }
}

export default FileManagerPlugin;
