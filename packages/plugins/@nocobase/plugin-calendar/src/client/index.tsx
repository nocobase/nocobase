import { Plugin, registerTemplate } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { CalendarV2 } from './calendar';
import { calendar } from './collection-templates/calendar';
import { CalendarBlockProvider, useCalendarBlockProps } from './schema-initializer/CalendarBlockProvider';
import { CalendarActionInitializers, CalendarFormActionInitializers } from './schema-initializer/initializers';
import { CalendarBlockInitializer, RecordAssociationCalendarBlockInitializer } from './schema-initializer/items';
import { calendarBlockSettings } from './calendar/Calender.Settings';

export class PluginCalendarClient extends Plugin {
  async load() {
    this.app.schemaInitializerManager.addItem('BlockInitializers', 'dataBlocks.calendar', {
      title: generateNTemplate('Calendar'),
      Component: 'CalendarBlockInitializer',
    });
    this.app.addComponents({
      CalendarBlockProvider,
      CalendarBlockInitializer,
      RecordAssociationCalendarBlockInitializer,
      CalendarV2,
    });
    this.app.addScopes({ useCalendarBlockProps });
    this.schemaSettingsManager.add(calendarBlockSettings);
    this.app.schemaInitializerManager.add(CalendarActionInitializers);
    this.app.schemaInitializerManager.add(CalendarFormActionInitializers);
    registerTemplate('calendar', calendar);
  }
}

export default PluginCalendarClient;
