import { Plugin, SchemaInitializerContext, registerTemplate } from '@nocobase/client';
import { CalendarBlockProvider, useCalendarBlockProps } from './schema-initializer/CalendarBlockProvider';
import React, { useContext, useEffect } from 'react';
import { CalendarActionInitializers, CalendarFormActionInitializers } from './schema-initializer/initializers';
import { CalendarBlockInitializer, RecordAssociationCalendarBlockInitializer } from './schema-initializer/items';
import { generateNTemplate } from '../locale';
import { calendar } from './collection-templates/calendar';

const CalendarProvider = React.memo((props) => {
  const items = useContext<any>(SchemaInitializerContext);
  const children: any[] = items.BlockInitializers.items[0].children;

  useEffect(() => {
    if (!children.find((item) => item.component === 'CalendarBlockInitializer')) {
      children.splice(3, 0, {
        key: 'calendar',
        type: 'item',
        title: generateNTemplate('Calendar'),
        component: 'CalendarBlockInitializer',
      });
    }
  }, []);

  return <>{props.children}</>;
});
CalendarProvider.displayName = 'CalendarProvider';

export class CalendarPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      CalendarBlockProvider,
      CalendarBlockInitializer,
      RecordAssociationCalendarBlockInitializer,
    });

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('dataBlocks.calendar', {
      title: generateNTemplate('Calendar'),
      Component: 'CalendarBlockInitializer',
    });

    this.app.addScopes({ useCalendarBlockProps });
    this.app.use(CalendarProvider);
    this.app.schemaInitializerManager.add(CalendarActionInitializers);
    this.app.schemaInitializerManager.add(CalendarFormActionInitializers);
    registerTemplate('calendar', calendar);
  }
}

export default CalendarPlugin;
