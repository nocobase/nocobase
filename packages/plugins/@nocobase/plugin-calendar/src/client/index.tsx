import { Plugin } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { CalendarV2 } from './calendar';
import { calendarBlockSettings } from './calendar/Calender.Settings';
import { CalendarCollectionTemplate } from './collection-templates/calendar';
import { useCalendarBlockDecoratorProps } from './hooks/useCalendarBlockDecoratorProps';
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
  useCreateCalendarBlock,
} from './schema-initializer/items';

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
      useComponentProps() {
        const { createAssociationCalendarBlock } = useCreateAssociationCalendarBlock();
        const { createCalendarBlock } = useCreateCalendarBlock();

        return {
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return createCalendarBlock({ item });
            }
            createAssociationCalendarBlock({ item });
          },
          showAssociationFields: true,
          hideSearch: true,
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
