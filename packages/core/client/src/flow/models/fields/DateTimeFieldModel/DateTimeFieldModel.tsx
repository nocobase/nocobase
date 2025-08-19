/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from 'antd';
import { escapeT } from '@nocobase/flow-engine';
import { FormFieldModel } from '../FormFieldModel';

export class DateTimeFieldModel extends FormFieldModel {
  get component() {
    return [DatePicker, {}];
  }
}

DateTimeFieldModel.registerFlow({
  key: 'datetimeSettings',
  sort: 3000,
  title: escapeT('Datetime settings'),
  steps: {
    dateFormat: {
      use: 'dateDisplayFormat',
      title: escapeT('Date display format'),
    },
  },
});
