export * from './ExportActionInitializer';
export * from './ExportDesigner';
export * from './ExportPluginProvider';
export * from './useExportAction';
import { Plugin } from '@nocobase/client';
import { ExportPluginProvider } from './ExportPluginProvider';
import { exportActionSchemaSettings } from './schemaSettings';

export class ExportPlugin extends Plugin {
  async load() {
    this.app.use(ExportPluginProvider);

    const initializerData = {
      title: "{{t('Export')}}",
      Component: 'ExportActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
    };

    const tableActionInitializers = this.app.schemaInitializerManager.get('table:configureActions');
    tableActionInitializers?.add('enableActions.export', initializerData);
    this.app.schemaInitializerManager.addItem('gantt:configureActions', 'enableActions.export', initializerData);
    this.app.schemaSettingsManager.add(exportActionSchemaSettings);
  }
}

export default ExportPlugin;
