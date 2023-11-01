import { Plugin, useCollection } from '@nocobase/client';
import { FileManagerProvider } from './FileManagerProvider';
import { storageTypes } from './schemas/storageTypes';

export class FileManagerPlugin extends Plugin {
  storageTypes = new Map();

  async load() {
    this.app.use(FileManagerProvider);
    Object.values(storageTypes).forEach((storageType) => {
      this.registerStorageType(storageType.name, storageType);
    });

    const tableActionInitializers = this.app.schemaInitializerManager.get('TableActionInitializers');
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
        const collection = useCollection();
        return collection.template === 'file';
      },
    });
  }

  registerStorageType(name: string, options) {
    this.storageTypes.set(name, options);
  }
}

export default FileManagerPlugin;
