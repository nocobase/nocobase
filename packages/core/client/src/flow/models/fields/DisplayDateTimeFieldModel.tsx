/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import dayjs from 'dayjs';
import React from 'react';
import { InteractiveDisplayFieldModel } from './InteractiveDisplayFieldModel';

export class DisplayDateTimeFieldModel extends InteractiveDisplayFieldModel {
  public static readonly supportedFieldInterfaces = [
    'date',
    'datetimeNoTz',
    'createdAt',
    'datetime',
    'updatedAt',
    'unixTimestamp',
  ];
  public renderDisplayValue(value) {
    const { dateFormat = 'YYYY-MM-DD', timeFormat = 'HH:mm:ss', showTime } = this.props;
    const finalFormat = showTime ? `${dateFormat} ${timeFormat}` : dateFormat;
    let formattedValue = '';
    if (value) {
      const day = dayjs(value);
      formattedValue = day.isValid() ? day.format(finalFormat) : '';
    }
    return <div>{formattedValue}</div>;
  }
}

DisplayDateTimeFieldModel.registerFlow({
  key: 'datetimeSettings',
  sort: 1000,
  title: tval('Datetime settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: tval('Date display format'),
      defaultParams: (ctx) => {
        const { showTime, dateFormat, timeFormat, picker } = ctx.model.props;
        return {
          picker: picker || 'date',
          dateFormat: dateFormat || 'YYYY-MM-DD',
          timeFormat: timeFormat,
          showTime,
        };
      },
      handler(ctx: any, params) {
        ctx.model.setProps?.({ ...params });
      },
    },
  },
});

DisplayItemModel.bindModelToInterface(
  'DisplayDateTimeFieldModel',
  ['date', 'datetimeNoTz', 'createdAt', 'datetime', 'updatedAt', 'unixTimestamp'],
  {
    isDefault: true,
  },
);
