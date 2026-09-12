/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, tExpr } from '@nocobase/flow-engine';
import { getDateTimeFormat, getPickerFormat } from '@nocobase/utils/client';
import dayjs from 'dayjs';
import React from 'react';
import { ClickableFieldModel } from './ClickableFieldModel';

const stripTimeFromFormat = (format?: string) =>
  format ? format.replace(/\s*[Hh]{1,2}:mm(?::ss)?(?:\.SSS)?(?:\s*[aA])?/g, '').trim() : format;

interface DisplayDateTimeFormatProps {
  dateOnly?: boolean;
  picker?: string;
  format?: string;
  dateFormat?: string;
  showTime?: boolean;
  timeFormat?: string;
}

const resolveDisplayDateTimeFormat = (props: DisplayDateTimeFormatProps) => {
  const { dateOnly, picker = 'date', format, dateFormat, showTime, timeFormat } = props;
  const normalizedFormat = stripTimeFromFormat(format);
  if (picker !== 'date') {
    return dateFormat || normalizedFormat || getPickerFormat(picker);
  }

  if (!dateOnly && !dateFormat && typeof showTime === 'undefined' && !timeFormat && normalizedFormat) {
    return format;
  }

  const normalizedDateFormat = dateFormat || normalizedFormat || getPickerFormat(picker);
  return getDateTimeFormat(picker, normalizedDateFormat, showTime, timeFormat);
};

export class DisplayDateTimeFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    const { className, style } = this.props;
    const finalFormat = resolveDisplayDateTimeFormat(this.props);
    let formattedValue = '';
    if (value) {
      const day = dayjs(value);
      formattedValue = day.isValid() ? day.format(finalFormat) : '';
    }
    return (
      <div className={className} style={style}>
        {formattedValue}
      </div>
    );
  }
}

DisplayDateTimeFieldModel.registerFlow({
  key: 'datetimeSettings',
  sort: 1000,
  title: tExpr('Datetime settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: tExpr('Date display format'),
    },
  },
});
DisplayDateTimeFieldModel.define({
  label: tExpr('Datetime'),
});

DisplayItemModel.bindModelToInterface(
  'DisplayDateTimeFieldModel',
  ['date', 'datetimeNoTz', 'createdAt', 'datetime', 'updatedAt', 'unixTimestamp', 'formula'],
  {
    isDefault: true,
    when(ctx, fieldInstance) {
      if (fieldInstance.type === 'formula') {
        return fieldInstance.dataType === 'date';
      }
      return true;
    },
  },
);
