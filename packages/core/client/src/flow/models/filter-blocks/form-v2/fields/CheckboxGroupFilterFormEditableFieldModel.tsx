/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select } from '@formily/antd-v5';
import { FilterFormEditableFieldModel } from './FilterFormEditableFieldModel';

export class CheckboxGroupFilterFormEditableFieldModel extends FilterFormEditableFieldModel {
  static readonly supportedFieldInterfaces = ['checkboxGroup'];

  get component() {
    return [
      Select,
      {
        allowClear: true,
        mode: 'tags',
      },
    ];
  }
}
