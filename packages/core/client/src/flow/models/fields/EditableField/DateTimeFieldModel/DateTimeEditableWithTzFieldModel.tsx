/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import dayjs from 'dayjs';
import { DateTimeFieldModel } from './DateTimeFieldModel';

export class DateTimeEditableWithTzFieldModel extends DateTimeFieldModel {
  static supportedFieldInterfaces = ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'];

  setComponentProps(componentProps) {
    super.setComponentProps({
      ...componentProps,
      onChange: (value) => {
        const iso = value ? dayjs(value).toDate() : undefined;
        this.field.setValue(iso);
      },
    });
  }
}
