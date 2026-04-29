/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { theme } from 'antd';
import React from 'react';

type TitleRendererProps = { value: any };

const TitleRenderer = ({ value }: TitleRendererProps) => {
  return <span aria-label="event-title">{value || 'N/A'}</span>;
};

const useGetColor = (field) => {
  const { token } = theme.useToken();
  return {
    loading: false,
    getFontColor(value) {
      const option = field.uiSchema.enum.find((item) => item.value === value);
      return option ? token[`${option.color}7`] : null;
    },
    getBackgroundColor(value) {
      const option = field.uiSchema.enum.find((item) => item.value === value);
      return option ? token[`${option.color}1`] : null;
    },
  };
};

export class PluginCalendarClient extends Plugin {
  titleFieldInterfaces: { [T: string]: { TitleRenderer: React.FC<TitleRendererProps> } } = {
    input: { TitleRenderer },
    select: { TitleRenderer },
    phone: { TitleRenderer },
    email: { TitleRenderer },
    radioGroup: { TitleRenderer },
  };

  colorFieldInterfaces = {
    select: { useGetColor },
    radioGroup: { useGetColor },
  };

  dateTimeFieldInterfaces = ['date', 'datetime', 'dateOnly', 'datetimeNoTz', 'unixTimestamp', 'createdAt', 'updatedAt'];

  registerTitleFieldInterface(key: string, options: { TitleRenderer: React.FC<TitleRendererProps> }) {
    this.titleFieldInterfaces[key] = options;
  }

  getTitleFieldInterface(key: string) {
    return key ? this.titleFieldInterfaces[key] : this.titleFieldInterfaces;
  }

  registerDateTimeFieldInterface(data: string | string[]) {
    this.dateTimeFieldInterfaces = this.dateTimeFieldInterfaces.concat(data);
  }

  registerColorFieldInterface(type, option: { useGetColor: (field: any) => any }) {
    this.colorFieldInterfaces[type] = option;
  }

  getColorFieldInterface(type: string) {
    return this.colorFieldInterfaces[type];
  }

  async load() {
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
