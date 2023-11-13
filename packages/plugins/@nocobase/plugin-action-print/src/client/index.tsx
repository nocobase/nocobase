import { Plugin } from '@nocobase/client';
import { PrintActionPluginProvider } from './PrintActionPluginProvider';

export class PrintPlugin extends Plugin {
  async load() {
    this.app.use(PrintActionPluginProvider);

    const initializerData = {
      title: '{{t("Print")}}',
      Component: 'PrintActionInitializer',
      schema: {
        'x-component': 'Action',
      },
    };

    const calendarFormActionInitializers = this.app.schemaInitializerManager.get('CalendarFormActionInitializers');
    calendarFormActionInitializers?.add('enableActions.print', initializerData);
    const ReadPrettyFormActionInitializers = this.app.schemaInitializerManager.get('ReadPrettyFormActionInitializers');
    ReadPrettyFormActionInitializers?.add('enableActions.print', initializerData);
  }
}

export default PrintPlugin;
