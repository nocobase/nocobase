/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select } from 'antd';
import { FormFieldModel } from './FormFieldModel';

export class SelectEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['select', 'multipleSelect'];

  get component() {
    console.log(this.props);
    return [
      Select,
      {
        allowClear: true,
      },
    ];
  }
}
