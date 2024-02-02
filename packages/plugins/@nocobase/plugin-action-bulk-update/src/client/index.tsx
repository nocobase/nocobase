import { Plugin, useCollection } from '@nocobase/client';
import { bulkUpdateActionSettings, deprecatedBulkUpdateActionSettings } from './BulkUpdateAction.Settings';
import { BulkUpdateActionInitializer } from './BulkUpdateActionInitializer';
import { useCustomizeBulkUpdateActionProps } from './utils';
export class PluginBulkUpdateClient extends Plugin {
  async load() {
    this.app.addScopes({ useCustomizeBulkUpdateActionProps });
    this.app.schemaSettingsManager.add(deprecatedBulkUpdateActionSettings);
    this.app.schemaSettingsManager.add(bulkUpdateActionSettings);

    const initializerData = {
      title: '{{t("Bulk update")}}',
      Component: BulkUpdateActionInitializer,
      name: 'bulkUpdate',
      useVisible() {
        const collection = useCollection();
        return (
          (collection.template !== 'view' || collection?.writableView) &&
          collection.template !== 'file' &&
          collection.template !== 'sql'
        );
      },
    };

    this.app.schemaInitializerManager.addItem('TableActionInitializers', 'customize.bulkUpdate', initializerData);
    this.app.schemaInitializerManager.addItem('GanttActionInitializers', 'customize.bulkUpdate', initializerData);
    this.app.schemaInitializerManager.addItem('MapActionInitializers', 'customize.bulkUpdate', initializerData);
  }
}

export default PluginBulkUpdateClient;
