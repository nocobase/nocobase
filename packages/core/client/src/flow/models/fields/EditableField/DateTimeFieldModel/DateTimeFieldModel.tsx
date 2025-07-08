/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from '@formily/antd-v5';
import React from 'react';
import { escapeT } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import { EditableFieldModel } from '../EditableFieldModel';

const DatePickerCom = (props) => {
  const { value, utc, format = 'YYYY-MM-DD HH:mm:ss', ...rest } = props;
  const parsedValue = value ? (utc ? dayjs.utc(value).local() : dayjs(value)) : null;

  return <DatePicker {...rest} value={parsedValue} format={format} />;
};

export class DateTimeFieldModel extends EditableFieldModel {
  setComponentProps(componentProps) {
    let { dateFormat, timeFormat } = componentProps || {};
    if (!componentProps.format && (dateFormat || timeFormat)) {
      if (!dateFormat) {
        dateFormat = this.field.componentProps?.dateFormat || 'YYYY-MM-DD';
      }
      if (!timeFormat) {
        timeFormat = this.field.componentProps?.timeFormat || 'HH:mm:ss';
      }
      componentProps.format = componentProps?.showTime ? `${dateFormat} ${timeFormat}` : dateFormat;
    }
    super.setComponentProps({
      ...componentProps,
    });
  }

  get component() {
    console.log(this.field?.componentProps);
    return [DatePickerCom, {}];
  }
}

DateTimeFieldModel.registerFlow({
  key: 'datetimeSettings',
  auto: true,
  sort: 1000,
  title: escapeT('Datetime settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: escapeT('Date display format'),
    },
  },
});
