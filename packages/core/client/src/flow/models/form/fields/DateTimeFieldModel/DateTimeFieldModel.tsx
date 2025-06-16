/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from '@formily/antd-v5';
import { FormFieldModel } from '../../../FormFieldModel';

export class DateTimeFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['createdAt'];

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
  title: 'Group3',
  steps: {
    dateFormat: {
      title: 'Date format',
      uiSchema: {
        format: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        if (params.format) {
          ctx.model.setComponentProps({ format: params.format });
        }
      },
    },
  },
});
