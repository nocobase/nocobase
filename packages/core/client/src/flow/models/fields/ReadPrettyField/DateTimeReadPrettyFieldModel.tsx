/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reactive } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import dayjs from 'dayjs';
import React from 'react';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';

export class DateTimeReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = [
    'date',
    'datetimeNoTz',
    'createdAt',
    'datetime',
    'updatedAt',
    'unixTimestamp',
  ];
  @reactive
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

DateTimeReadPrettyFieldModel.registerFlow({
  key: 'key3',
  auto: true,
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
