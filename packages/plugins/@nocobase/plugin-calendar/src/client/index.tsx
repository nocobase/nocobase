import { Plugin, canMakeAssociationBlock, useCollection } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { CalendarV2 } from './calendar';
import { calendarBlockSettings } from './calendar/Calender.Settings';
import { CalendarCollectionTemplate } from './collection-templates/calendar';
import { CalendarBlockProvider, useCalendarBlockProps } from './schema-initializer/CalendarBlockProvider';
import {
  CalendarActionInitializers_deprecated,
  CalendarFormActionInitializers,
  calendarActionInitializers,
  deleteEventActionInitializer,
} from './schema-initializer/initializers';
import {
  CalendarBlockInitializer,
  RecordAssociationCalendarBlockInitializer,
  useCreateAssociationCalendarBlock,
} from './schema-initializer/items';
import { useMemo } from 'react';
import { useCalendarBlockDecoratorProps } from './hooks/useCalendarBlockDecoratorProps';

export class PluginCalendarClient extends Plugin {
  async load() {
    this.app.dataSourceManager.addCollectionTemplates([CalendarCollectionTemplate]);
    this.app.schemaInitializerManager.addItem('page:addBlock', 'dataBlocks.calendar', {
      title: generateNTemplate('Calendar'),
      Component: 'CalendarBlockInitializer',
    });
    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'dataBlocks.calendar', {
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
    this.app.addScopes({ useCalendarBlockProps, useCalendarBlockDecoratorProps });
    this.schemaSettingsManager.add(calendarBlockSettings);
    this.app.schemaInitializerManager.add(CalendarActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(calendarActionInitializers);
    this.app.schemaInitializerManager.add(CalendarFormActionInitializers);
    this.app.schemaInitializerManager
      .get('details:configureActions')
      .add('enableActions.deleteEvent', deleteEventActionInitializer);
  }
}

export default PluginCalendarClient;
