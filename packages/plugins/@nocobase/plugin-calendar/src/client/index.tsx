/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

const CustomLabel = ({ value }) => {
  return value;
};
interface ColorFunctions {
  loading: boolean;
  getFontColor: () => string;
  getBackgroundColor: () => string;
}

const useGetColor = (field) => {
  return {
    loading: false,
    getFontColor: () => {
      return '';
    },
    getBackgroundColor: () => {
      return '';
    },
  };
};
export class PluginCalendarClient extends Plugin {
  titleFields: { [T: string]: { CustomLabel: Function } } = {
    input: { CustomLabel },
    select: { CustomLabel },
    phone: { CustomLabel },
    email: { CustomLabel },
    radioGroup: { CustomLabel },
  };
  backgroundColorFields: {
    [T: string]: { useGetColor: (field: any) => ColorFunctions };
  } = {
    select: { useGetColor },
  };

  dateTimeFields = ['date', 'datetime', 'dateOnly', 'datetimeNoTz', 'unixTimestamp', 'createdAt', 'updatedAt'];

  registerTitleFields(key, options) {
    this.titleFields[key] = options;
  }
  getTitleFields(key) {
    return this.titleFields[key];
  }
  registerDateTimeFields(data: any) {
    if (Array.isArray(data)) {
      const result = this.dateTimeFields.concat(data);
      this.dateTimeFields = result;
    } else {
      this.dateTimeFields.push(data);
    }
  }
  registerColorFieldInterface(type, option) {
    this.backgroundColorFields[type] = option;
  }
  getColorFieldInterface(type) {
    return this.backgroundColorFields[type];
  }
  async load() {
    this.app.dataSourceManager.addCollectionTemplates([CalendarCollectionTemplate]);
    this.app.schemaInitializerManager.addItem('page:addBlock', 'dataBlocks.calendar', {
      title: generateNTemplate('Calendar'),
      Component: 'CalendarBlockInitializer',
    });
    this.app.schemaInitializerManager.addItem('mobile:addBlock', 'dataBlocks.calendar', {
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
