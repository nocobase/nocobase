/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select } from 'antd';
import { FilterFormFieldModel } from './FilterFormFieldModel';

export class CheckboxFilterFormEditableFieldModel extends FilterFormFieldModel {
  static readonly supportedFieldInterfaces = ['checkbox'];

  get component() {
    return [
      Select,
      {
        allowClear: true,
        multiple: false,
        options: [
          {
            label: this.translate('Yes'),
            value: true,
          },
          {
            label: this.translate('No'),
            value: false,
          },
        ],
      },
    ];
  }
}
