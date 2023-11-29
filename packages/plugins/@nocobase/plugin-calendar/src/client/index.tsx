import { Plugin, SchemaInitializerProvider } from '@nocobase/client';
import { CalendarBlockProvider, useCalendarBlockProps } from './schema-initializer/CalendarBlockProvider';
import React from 'react';
import { CalendarActionInitializers, CalendarFormActionInitializers } from './schema-initializer/initializers';
import { CalendarBlockInitializer, RecordAssociationCalendarBlockInitializer } from './schema-initializer/items';

const CalendarProvider = React.memo((props) => {
  return (
    <SchemaInitializerProvider initializers={{ CalendarActionInitializers, CalendarFormActionInitializers }}>
      {props.children}
    </SchemaInitializerProvider>
  );
});
CalendarProvider.displayName = 'CalendarProvider';

export class CalendarPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      CalendarBlockProvider,
      CalendarBlockInitializer,
      RecordAssociationCalendarBlockInitializer,
    });
    this.app.addScopes({ useCalendarBlockProps });
    this.app.use(CalendarProvider);
  }
}

export default CalendarPlugin;
