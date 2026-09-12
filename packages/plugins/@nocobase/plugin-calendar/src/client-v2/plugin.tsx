/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from './locale';

const TitleRenderer = ({ value }) => {
  return <span aria-label="event-title">{value || 'N/A'}</span>;
};

interface ColorFunctions {
  loading: boolean;
  getFontColor: (value: any) => string | null;
  getBackgroundColor: (value: any) => string | null;
  getBorderColor?: (value: any) => string | null;
}

type CalendarColorOptions = {
  token?: Record<string, any>;
};

const PRESET_COLOR_NAMES = new Set([
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'pink',
  'red',
  'orange',
  'yellow',
  'volcano',
  'geekblue',
  'lime',
  'gold',
]);

const normalizeColorValue = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'object') {
    return normalizeColorValue(value.hex || value.hexString || value.color || value.value);
  }

  const color = String(value);
  return color;
};

const getTagColorStyle = (token: Record<string, any> | undefined, value: any) => {
  const color = normalizeColorValue(value);

  if (!color || color === 'default') {
    return null;
  }

  if (PRESET_COLOR_NAMES.has(color)) {
    return {
      backgroundColor: token?.[`${color}1`] || null,
      borderColor: token?.[`${color}3`] || null,
      fontColor: token?.[`${color}7`] || null,
    };
  }

  return {
    backgroundColor: color,
    borderColor: 'transparent',
    fontColor: token?.colorTextLightSolid || '#fff',
  };
};

const getEnumOption = (field: any, value: any) => {
  const enumOptions = Array.isArray(field?.uiSchema?.enum) ? field.uiSchema.enum : [];
  return enumOptions.find((item: any) => {
    return String(item?.value ?? item?.name ?? item?.id ?? '') === String(value);
  });
};

const useGetColor = (field, options?: CalendarColorOptions) => {
  return {
    loading: false,
    getFontColor(value) {
      const option = getEnumOption(field, value);
      return field?.interface === 'color' ? null : getTagColorStyle(options?.token, option?.color)?.fontColor || null;
    },
    getBackgroundColor(value) {
      const option = getEnumOption(field, value);
      return field?.interface === 'color'
        ? normalizeColorValue(value)
        : getTagColorStyle(options?.token, option?.color)?.backgroundColor || null;
    },
    getBorderColor(value) {
      const option = getEnumOption(field, value);
      return field?.interface === 'color'
        ? normalizeColorValue(value)
        : getTagColorStyle(options?.token, option?.color)?.borderColor || null;
    },
  };
};

type TitleRendererProps = { value: any };

export class PluginCalendarClient extends Plugin<any, Application> {
  titleFieldInterfaces: { [T: string]: { TitleRenderer: React.FC<TitleRendererProps> } } = {
    input: { TitleRenderer },
    select: { TitleRenderer },
    phone: { TitleRenderer },
    email: { TitleRenderer },
    radioGroup: { TitleRenderer },
  };

  colorFieldInterfaces: {
    [T: string]: { useGetColor: (field: any, options?: CalendarColorOptions) => ColorFunctions };
  } = {
    select: { useGetColor },
    radioGroup: { useGetColor },
    color: { useGetColor },
  };

  dateTimeFieldInterfaces = ['date', 'datetime', 'dateOnly', 'datetimeNoTz', 'unixTimestamp', 'createdAt', 'updatedAt'];

  registerTitleFieldInterface(
    key: string,
    options: { TitleRenderer: React.FC<TitleRendererProps> } = { TitleRenderer },
  ) {
    this.titleFieldInterfaces[key] = options;
  }

  getTitleFieldInterface(key: string) {
    if (key) {
      return this.titleFieldInterfaces[key];
    }
    return this.titleFieldInterfaces;
  }

  getTitleFieldInterfaces() {
    return Object.keys(this.titleFieldInterfaces);
  }

  registerDateTimeFieldInterface(data: string | string[]) {
    if (Array.isArray(data)) {
      this.dateTimeFieldInterfaces = this.dateTimeFieldInterfaces.concat(data);
    } else {
      this.dateTimeFieldInterfaces.push(data);
    }
  }

  getDateTimeFieldInterfaces() {
    return this.dateTimeFieldInterfaces;
  }

  registerColorFieldInterface(
    type,
    option: { useGetColor: (field: any, options?: CalendarColorOptions) => ColorFunctions },
  ) {
    this.colorFieldInterfaces[type] = option;
  }

  getColorFieldInterface(type: string) {
    return this.colorFieldInterfaces[type];
  }

  getColorFieldInterfaces() {
    return Object.keys(this.colorFieldInterfaces);
  }

  async load() {
    const dataSourceManager = (this.app.pm.get('@nocobase/plugin-data-source-manager') ||
      this.app.pm.get('data-source-manager')) as
      | {
          registerCollectionTemplate?: (options: Record<string, unknown>) => void;
        }
      | undefined;
    dataSourceManager?.registerCollectionTemplate?.({
      name: 'calendar',
      title: tExpr('Calendar collection'),
      order: 20,
      color: 'orange',
      creatable: false,
      collection: {
        options: {
          template: 'calendar',
          createdBy: true,
          updatedBy: true,
          createdAt: true,
          updatedAt: true,
          sortable: true,
        },
        fields: [
          {
            name: 'cron',
            type: 'string',
            uiSchema: {
              type: 'string',
              title: tExpr('Repeats'),
              'x-component': 'CronSet',
              'x-component-props': 'allowClear',
              enum: [
                {
                  label: tExpr('Daily'),
                  value: '0 0 0 * * ?',
                },
                {
                  label: tExpr('Weekly'),
                  value: 'every_week',
                },
                {
                  label: tExpr('Monthly'),
                  value: 'every_month',
                },
                {
                  label: tExpr('Yearly'),
                  value: 'every_year',
                },
              ],
            },
            interface: 'select',
          },
          {
            name: 'exclude',
            type: 'json',
          },
        ],
      },
      fieldInterfaces: {
        include: [],
      },
    });

    this.flowEngine.registerModelLoaders({
      CalendarBlockModel: {
        loader: () => import('./models/CalendarBlockModel'),
      },
      CalendarCollectionActionGroupModel: {
        loader: () => import('./models/actions/CalendarActionModels'),
      },
      CalendarEventViewActionModel: {
        loader: () => import('./models/actions/CalendarPopupModels'),
      },
      CalendarNavActionModel: {
        loader: () => import('./models/actions/CalendarActionModels'),
      },
      CalendarQuickCreateActionModel: {
        loader: () => import('./models/actions/CalendarPopupModels'),
      },
      CalendarTitleActionModel: {
        loader: () => import('./models/actions/CalendarActionModels'),
      },
      CalendarTodayActionModel: {
        loader: () => import('./models/actions/CalendarActionModels'),
      },
      CalendarViewSelectActionModel: {
        loader: () => import('./models/actions/CalendarActionModels'),
      },
    });
  }
}

export default PluginCalendarClient;
