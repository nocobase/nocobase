// i18n.addResources('zh-CN', NAMESPACE, zhCN);
// i18n.addResources('en-US', NAMESPACE, enUS);

export * from './ImportActionInitializer';
export * from './ImportDesigner';
export * from './ImportPluginProvider';
export * from './useImportAction';

import { Plugin, useCollection } from '@nocobase/client';
import { ImportPluginProvider } from './ImportPluginProvider';

export class ImportPlugin extends Plugin {
  async load() {
    this.app.use(ImportPluginProvider);

    const initializerData = {
      title: "{{t('Import')}}",
      Component: 'ImportActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action': 'importXlsx',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible() {
        const collection = useCollection();
        return (
          (collection.template !== 'view' || collection?.writableView) &&
          collection.template !== 'file' &&
          collection.template !== 'sql'
        );
      },
    };

    const tableActionInitializers = this.app.schemaInitializerManager.get('TableActionInitializers');
    tableActionInitializers?.add('enableActions.import', initializerData);
    this.app.schemaInitializerManager.addItem('GanttActionInitializers', 'enableActions.import', initializerData);
  }
}

export default ImportPlugin;
