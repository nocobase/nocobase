import { Plugin } from '@nocobase/client';
import { PrintActionPluginProvider } from './PrintActionPluginProvider';
import { printActionSettings } from './PrintAction.Settings';
export class PrintPlugin extends Plugin {
  async load() {
    this.app.use(PrintActionPluginProvider);
    this.app.schemaSettingsManager.add(printActionSettings);

    const initializerData = {
      title: '{{t("Print")}}',
      Component: 'PrintActionInitializer',
      schema: {
        'x-component': 'Action',
        'x-settings': 'ActionSettings:print',
        'x-action': 'print',
      },
    };

    this.app.schemaInitializerManager.addItem(
      'ReadPrettyFormActionInitializers',
      'enableActions.print',
      initializerData,
    );
    this.app.schemaInitializerManager.addItem('CalendarFormActionInitializers', 'enableActions.print', initializerData);
  }
}

export default PrintPlugin;
