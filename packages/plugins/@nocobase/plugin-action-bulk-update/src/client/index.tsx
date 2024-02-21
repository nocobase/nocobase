import { Plugin, useCollection_deprecated } from '@nocobase/client';
import { bulkUpdateActionSettings, deprecatedBulkUpdateActionSettings } from './BulkUpdateAction.Settings';
import { CustomizeActionInitializer } from './CustomizeActionInitializer';
import { useCustomizeBulkUpdateActionProps } from './utils';
import { BulkUpdateActionInitializer } from './BulkUpdateActionInitializer';
export class PluginBulkUpdateClient extends Plugin {
  async load() {
    this.app.addComponents({ CustomizeActionInitializer });
    this.app.addScopes({ useCustomizeBulkUpdateActionProps });
    this.app.addScopes({ useCustomizeBulkUpdateActionProps });
    this.app.schemaSettingsManager.add(deprecatedBulkUpdateActionSettings);
    this.app.schemaSettingsManager.add(bulkUpdateActionSettings);

    const initializerData = {
      title: '{{t("Bulk update")}}',
      Component: BulkUpdateActionInitializer,
      name: 'bulkUpdate',
      useVisible() {
        const collection = useCollection_deprecated();
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
