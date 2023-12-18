import { Plugin, useCollection } from '@nocobase/client';
import { BulkUpdatePluginProvider } from './BulkUpdatePluginProvider';
import { bulkUpdateActionSettings } from './BulkUpdateAction.Settings';
export class BulkUpdatePlugin extends Plugin {
  async load() {
    this.app.use(BulkUpdatePluginProvider);
    this.app.schemaSettingsManager.add(bulkUpdateActionSettings);

    const initializerData = {
      title: '{{t("Bulk update")}}',
      Component: 'CustomizeActionInitializer',
      name: 'bulkUpdate',
      schema: {
        type: 'void',
        title: '{{ t("Bulk update") }}',
        'x-component': 'Action',
        'x-align': 'right',
        'x-acl-action': 'update',
        'x-decorator': 'ACLActionProvider',
        'x-designer': 'Action.Designer',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
        'x-action': 'customize:bulkUpdate',
        'x-settings': 'ActionSettings:customize:bulkUpdate',
        'x-action-settings': {
          assignedValues: {},
          updateMode: 'selected',
          onSuccess: {
            manualClose: true,
            redirecting: false,
            successMessage: '{{t("Updated successfully")}}',
          },
        },
        'x-component-props': {
          icon: 'EditOutlined',
          useProps: '{{ useCustomizeBulkUpdateActionProps }}',
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
    tableActionInitializers?.add('customize.bulkUpdate', initializerData);
    this.app.schemaInitializerManager.addItem('GanttActionInitializers', 'customize.bulkUpdate', initializerData);
    this.app.schemaInitializerManager.addItem('MapActionInitializers', 'customize.bulkUpdate', initializerData);
  }
}

export default BulkUpdatePlugin;
