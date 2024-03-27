import { Plugin, useCollection_deprecated } from '@nocobase/client';
import { bulkUpdateActionSettings, deprecatedBulkUpdateActionSettings } from './BulkUpdateAction.Settings';
import { BulkUpdateActionInitializer } from './BulkUpdateActionInitializer';
import { CustomizeActionInitializer } from './CustomizeActionInitializer';
import { useCustomizeBulkUpdateActionProps } from './utils';
export class PluginActionBulkUpdateClient extends Plugin {
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

    this.app.schemaInitializerManager.addItem('table:configureActions', 'customize.bulkUpdate', initializerData);
    this.app.schemaInitializerManager.addItem('gantt:configureActions', 'customize.bulkUpdate', initializerData);
    this.app.schemaInitializerManager.addItem('map:configureActions', 'customize.bulkUpdate', initializerData);
  }
}

export default PluginActionBulkUpdateClient;
