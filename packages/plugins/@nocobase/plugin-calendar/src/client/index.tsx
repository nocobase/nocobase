import { Plugin, canMakeAssociationBlock, useCollection } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { CalendarV2 } from './calendar';
import { CalendarCollectionTemplate } from './collection-templates/calendar';
import { CalendarBlockProvider, useCalendarBlockProps } from './schema-initializer/CalendarBlockProvider';
import { CalendarActionInitializers, CalendarFormActionInitializers } from './schema-initializer/initializers';
import {
  CalendarBlockInitializer,
  RecordAssociationCalendarBlockInitializer,
  useCreateAssociationCalendarBlock,
} from './schema-initializer/items';
import { calendarBlockSettings } from './calendar/Calender.Settings';
import { useMemo } from 'react';

export class PluginCalendarClient extends Plugin {
  async load() {
    this.app.dataSourceManager.addCollectionTemplates([CalendarCollectionTemplate]);
    this.app.schemaInitializerManager.addItem('BlockInitializers', 'dataBlocks.calendar', {
      title: generateNTemplate('Calendar'),
      Component: 'CalendarBlockInitializer',
    });
    this.app.schemaInitializerManager.addItem('RecordBlockInitializers', 'dataBlocks.calendar', {
      title: generateNTemplate('Calendar'),
      Component: 'CalendarBlockInitializer',
      useVisible() {
        const collection = useCollection();
        return useMemo(
          () =>
            collection.fields.some(
              (field) => canMakeAssociationBlock(field) && ['hasMany', 'belongsToMany'].includes(field.type),
            ),
          [collection.fields],
        );
      },
      useComponentProps() {
        const { createAssociationCalendarBlock } = useCreateAssociationCalendarBlock();

        return {
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: createAssociationCalendarBlock,
          showAssociationFields: true,
        };
      },
    });

    this.app.addComponents({
      CalendarBlockProvider,
      CalendarBlockInitializer: CalendarBlockInitializer as any,
      RecordAssociationCalendarBlockInitializer,
      CalendarV2,
    });
    this.app.addScopes({ useCalendarBlockProps });
    this.schemaSettingsManager.add(calendarBlockSettings);
    this.app.schemaInitializerManager.add(CalendarActionInitializers);
    this.app.schemaInitializerManager.add(CalendarFormActionInitializers);
  }
}

export default PluginCalendarClient;
