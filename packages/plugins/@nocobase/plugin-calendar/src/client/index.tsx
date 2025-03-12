/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Plugin, useToken } from '@nocobase/client';
import React from 'react';
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

const TitleRenderer = ({ value }) => {
  return <span aria-label="event-title">{value || 'N/A'}</span>;
};
interface ColorFunctions {
  loading: boolean;
  getFontColor: (value: any) => string; // 返回字体颜色
  getBackgroundColor: (value: any) => string; // 返回背景颜色
}

const useGetColor = (field) => {
  const { token } = useToken();
  return {
    loading: false,
    getFontColor(value) {
      const option = field.uiSchema.enum.find((item) => item.value === value);
      if (option) {
        return token[`${option.color}7`];
      }
      return null;
    },
    getBackgroundColor(value) {
      const option = field.uiSchema.enum.find((item) => item.value === value);
      if (option) {
        return token[`${option.color}1`];
      }
      return null;
    },
  };
};

type TitleRendererProps = { value: any };

export class PluginCalendarClient extends Plugin {
  titleFieldInterfaces: { [T: string]: { TitleRenderer: React.FC<TitleRendererProps> } } = {
    input: { TitleRenderer },
    select: { TitleRenderer },
    phone: { TitleRenderer },
    email: { TitleRenderer },
    radioGroup: { TitleRenderer },
  };
  colorFieldInterfaces: {
    [T: string]: { useGetColor: (field: any) => ColorFunctions };
  } = {
    select: { useGetColor },
    radioGroup: { useGetColor },
  };

  dateTimeFieldInterfaces = ['date', 'datetime', 'dateOnly', 'datetimeNoTz', 'unixTimestamp', 'createdAt', 'updatedAt'];

  registerTitleFieldInterface(key: string, options: { TitleRenderer: React.FC<TitleRendererProps> }) {
    this.titleFieldInterfaces[key] = options;
  }
  getTitleFieldInterface(key: string) {
    if (key) {
      return this.titleFieldInterfaces[key];
    } else {
      return this.titleFieldInterfaces;
    }
  }
  registerDateTimeFieldInterface(data: string | string[]) {
    if (Array.isArray(data)) {
      const result = this.dateTimeFieldInterfaces.concat(data);
      this.dateTimeFieldInterfaces = result;
    } else {
      this.dateTimeFieldInterfaces.push(data);
    }
  }
  registerColorFieldInterface(type, option: { useGetColor: (field: any) => ColorFunctions }) {
    this.colorFieldInterfaces[type] = option;
  }
  getColorFieldInterface(type: string) {
    return this.colorFieldInterfaces[type];
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
