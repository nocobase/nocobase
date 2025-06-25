/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import React from 'react';
import { TableFieldModel } from './TableFieldModel';

export class TableDateTimeFieldModel extends TableFieldModel {
  public static readonly supportedFieldInterfaces = [
    'date',
    'datetimeNoTz',
    'createdAt',
    'datetime',
    'updatedAt',
    'unixTimestamp',
  ];

  public render() {
    const {
      format,
      dateFormat = 'YYYY-MM-DD',
      timeFormat = 'HH:mm:ss',
      showTime,
      prefix = '',
      suffix = '',
    } = this.props;
    const finalFormat = format || (showTime ? `${dateFormat} ${timeFormat}` : dateFormat);
    const value = this.getValue();

    let formattedValue = '';
    if (value) {
      const day = dayjs(value);
      formattedValue = day.isValid() ? day.format(finalFormat) : '';
    }

    return (
      <div>
        {prefix}
        {formattedValue}
        {suffix}
      </div>
    );
  }
}

TableDateTimeFieldModel.registerFlow({
  key: 'key3',
  auto: true,
  sort: 1000,
  title: 'Specific properties',
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: 'Date display format',
      defaultParams: (ctx) => {
        const { showTime, dateFormat, timeFormat, picker } = ctx.model.props;
        return {
          picker: picker || 'date',
          dateFormat: dateFormat || 'YYYY-MM-DD',
          timeFormat: timeFormat,
          showTime,
        };
      },
    },
  },
});
