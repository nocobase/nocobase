import { Plugin, useCollection } from '@nocobase/client';
import { BulkEditPluginProvider } from './BulkEditPluginProvider';
import { BulkEditFormItemInitializers } from './BulkEditFormItemInitializers';
import { CreateFormBulkEditBlockInitializers } from './CreateFormBulkEditBlockInitializers';
import { BulkEditFormActionInitializers } from './BulkEditFormActionInitializers';
import { bulkEditactionSettings } from './BulkEditAction.Settings';
export class BulkEditPlugin extends Plugin {
  async load() {
    this.app.use(BulkEditPluginProvider);
    this.app.schemaSettingsManager.add(bulkEditactionSettings);
    this.app.schemaInitializerManager.add(BulkEditFormItemInitializers);
    this.app.schemaInitializerManager.add(CreateFormBulkEditBlockInitializers);
    this.app.schemaInitializerManager.add(BulkEditFormActionInitializers);

    const initializerData = {
      type: 'item',
      title: '{{t("Bulk edit")}}',
      name: 'bulkEdit',
      Component: 'CustomizeBulkEditActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-designer': 'Action.Designer',
        'x-action': 'customize:bulkEdit',
        'x-settings': 'ActionSettings:customize:bulkEdit',
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
    this.app.schemaInitializerManager.addItem('GanttActionInitializers', 'customize.bulkEdit', initializerData);
    this.app.schemaInitializerManager.addItem('MapActionInitializers', 'customize.bulkEdit', initializerData);
  }
}

export default BulkEditPlugin;
