/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from '@formily/antd-v5';
import { tval } from '@nocobase/utils/client';
import { EditableFieldModel } from '../EditableFieldModel';

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
    return [DatePicker, {}];
  }
}

DateTimeFieldModel.registerFlow({
  key: 'key3',
  auto: true,
  sort: 1000,
  title: tval('Specific properties'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: tval('Date display format'),
    },
  },
});
