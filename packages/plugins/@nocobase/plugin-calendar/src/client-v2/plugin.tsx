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

const TitleRenderer = ({ value }) => {
  return <span aria-label="event-title">{value || 'N/A'}</span>;
};

interface ColorFunctions {
  loading: boolean;
  getFontColor: (value: any) => string;
  getBackgroundColor: (value: any) => string;
}

const useGetColor = (field) => {
  return {
    loading: false,
    getFontColor(value) {
      const option = field?.uiSchema?.enum?.find((item) => item.value === value);
      return option?.color ? `var(--ant-${option.color}-7)` : null;
    },
    getBackgroundColor(value) {
      const option = field?.uiSchema?.enum?.find((item) => item.value === value);
      return option?.color ? `var(--ant-${option.color}-1)` : null;
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
    [T: string]: { useGetColor: (field: any) => ColorFunctions };
  } = {
    select: { useGetColor },
    radioGroup: { useGetColor },
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

  registerColorFieldInterface(type, option: { useGetColor: (field: any) => ColorFunctions }) {
    this.colorFieldInterfaces[type] = option;
  }

  getColorFieldInterface(type: string) {
    return this.colorFieldInterfaces[type];
  }

  getColorFieldInterfaces() {
    return Object.keys(this.colorFieldInterfaces);
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
