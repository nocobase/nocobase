/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormFieldModel } from '../../../FormFieldModel';
import { StringDatePicker } from './StringDatePicker';

function getDefaultFormat(showTime?: boolean, customFormat?: string): string {
  return customFormat ?? (showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD');
}

export class DateTimeWithoutTzFieldModel extends FormFieldModel {
  get component() {
    const { showTime = false, picker = 'date', format: customFormat, ...restProps } = this.props;

    const format = getDefaultFormat(showTime, customFormat);
    return [
      StringDatePicker,
      {
        ...restProps,
        showTime,
        picker,
        format,
        onChange: (val: string | undefined) => {
          this.field.setValue(val);
        },
      },
    ];
  }
}
