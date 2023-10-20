export * from './ExportActionInitializer';
export * from './ExportDesigner';
export * from './ExportPluginProvider';
export * from './useExportAction';
import { Plugin } from '@nocobase/client';
import { ExportPluginProvider } from './ExportPluginProvider';

export class ExportPlugin extends Plugin {
  async load() {
    this.app.use(ExportPluginProvider);

    const tableActionInitializers = this.app.schemaInitializerManager.get('TableActionInitializers');
    tableActionInitializers?.add('enable-actions.export', {
      title: "{{t('Export')}}",
      Component: 'ExportActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
    });
  }
}

export default ExportPlugin;
