import { Plugin, SchemaInitializerContext, registerTemplate } from '@nocobase/client';
import { CalendarBlockProvider, useCalendarBlockProps } from './schema-initializer/CalendarBlockProvider';
import { CalendarActionInitializers, CalendarFormActionInitializers } from './schema-initializer/initializers';
import { CalendarBlockInitializer, RecordAssociationCalendarBlockInitializer } from './schema-initializer/items';
import { generateNTemplate } from '../locale';
import { calendar } from './collection-templates/calendar';
import { CalendarV2 } from './calendar';

export class CalendarPlugin extends Plugin {
  async load() {
    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('dataBlocks.calendar', {
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
    this.app.schemaInitializerManager.add(CalendarActionInitializers);
    this.app.schemaInitializerManager.add(CalendarFormActionInitializers);
    registerTemplate('calendar', calendar);
  }
}

export default CalendarPlugin;
