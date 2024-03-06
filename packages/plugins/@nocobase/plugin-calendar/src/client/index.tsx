import { Plugin } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { CalendarV2 } from './calendar';
import { calendarBlockSettings } from './calendar/Calender.Settings';
import { CalendarCollectionTemplate } from './collection-templates/calendar';
import { CalendarBlockProvider, useCalendarBlockProps } from './schema-initializer/CalendarBlockProvider';
import {
  CalendarActionInitializers_deprecated,
  CalendarFormActionInitializers_deprecated,
  calendarActionInitializers,
  calendarFormActionInitializers,
} from './schema-initializer/initializers';
import { CalendarBlockInitializer, RecordAssociationCalendarBlockInitializer } from './schema-initializer/items';

export class PluginCalendarClient extends Plugin {
  async load() {
    this.app.dataSourceManager.addCollectionTemplates([CalendarCollectionTemplate]);
    this.app.schemaInitializerManager.addItem('page:addBlock', 'dataBlocks.calendar', {
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
    this.app.schemaInitializerManager.add(CalendarActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(calendarActionInitializers);
    this.app.schemaInitializerManager.add(CalendarFormActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(calendarFormActionInitializers);
  }
}

export default PluginCalendarClient;
