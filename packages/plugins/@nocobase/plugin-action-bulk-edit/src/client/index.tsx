import { Plugin, useCollection } from '@nocobase/client';
import { bulkEditActionSettings, deprecatedBulkEditActionSettings } from './BulkEditAction.Settings';
import { BulkEditFormItemInitializers } from './BulkEditFormItemInitializers';
import { CreateFormBulkEditBlockInitializers } from './CreateFormBulkEditBlockInitializers';
import { BulkEditFormActionInitializers } from './BulkEditFormActionInitializers';
import { CustomizeBulkEditActionInitializer } from './CustomizeBulkEditActionInitializer';
import { bulkEditFormItemSettings } from './bulkEditFormItemSettings';
import { BulkEditField } from './component/BulkEditField';
import { useCustomizeBulkEditActionProps } from './utils';
export class BulkEditPlugin extends Plugin {
  async load() {
    this.app.addComponents({ BulkEditField });
    this.app.addScopes({ useCustomizeBulkEditActionProps });
    this.app.schemaSettingsManager.add(deprecatedBulkEditActionSettings);
    this.app.schemaSettingsManager.add(bulkEditActionSettings);
    this.app.schemaSettingsManager.add(bulkEditFormItemSettings);
    this.app.schemaInitializerManager.add(BulkEditFormItemInitializers);
    this.app.schemaInitializerManager.add(CreateFormBulkEditBlockInitializers);
    this.app.schemaInitializerManager.add(BulkEditFormActionInitializers);

    const initializerData = {
      type: 'item',
      title: '{{t("Bulk edit")}}',
      name: 'bulkEdit',
      Component: CustomizeBulkEditActionInitializer,
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-action': 'customize:bulkEdit',
        'x-toolbar': 'ActionSchemaToolbar',
        'x-settings': 'actionSettings:bulkEdit',
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

    this.app.schemaInitializerManager.addItem('TableActionInitializers', 'customize.bulkEdit', initializerData);
    this.app.schemaInitializerManager.addItem('GanttActionInitializers', 'customize.bulkEdit', initializerData);
    this.app.schemaInitializerManager.addItem('MapActionInitializers', 'customize.bulkEdit', initializerData);
  }
}

export default BulkEditPlugin;
