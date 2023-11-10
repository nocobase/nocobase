import { Plugin, useCollection } from '@nocobase/client';
import { BulkEditPluginProvider } from './BulkEditPluginProvider';
import { BulkEditFormItemInitializers } from './BulkEditFormItemInitializers';
import { CreateFormBulkEditBlockInitializers } from './CreateFormBulkEditBlockInitializers';

export class BulkEditPlugin extends Plugin {
  async load() {
    this.app.use(BulkEditPluginProvider);
    this.app.schemaInitializerManager.add(BulkEditFormItemInitializers);
    this.app.schemaInitializerManager.add(CreateFormBulkEditBlockInitializers);

    const initializerData = {
      type: 'item',
      title: '{{t("Bulk edit")}}',
      name: 'bulkEdit',
      Component: 'CustomizeBulkEditActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action': 'update',
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
    tableActionInitializers?.add('customize.bulkEdit', initializerData);
    const ganttActionInitializers = this.app.schemaInitializerManager.get('GanttActionInitializers');
    ganttActionInitializers?.add('customize.bulkEdit', initializerData);
    const mapActionInitializers = this.app.schemaInitializerManager.get('MapActionInitializers');
    mapActionInitializers?.add('customize.bulkEdit', initializerData);
  }
}

export default BulkEditPlugin;
