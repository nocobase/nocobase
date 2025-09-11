/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select } from 'antd';
import { EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import { FormFieldModel } from './FormFieldModel';

export class SelectFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['select', 'multipleSelect'];

  get component() {
    return [Select, {}];
  }
}

EditableItemModel.bindModelToInterface('SelectFieldModel', ['select', 'multipleSelect'], {
  isDefault: true,
  defaultProps: {
    allowClear: true,
  },
});

FilterableItemModel.bindModelToInterface('SelectFieldModel', ['select', 'multipleSelect', 'radioGroup'], {
  isDefault: true,
  defaultProps: {
    allowClear: true,
  },
});

FilterableItemModel.bindModelToInterface('SelectFieldModel', ['checkboxGroup'], {
  isDefault: true,
  defaultProps: {
    allowClear: true,
    mode: 'tags',
  },
});

FilterableItemModel.bindModelToInterface('SelectFieldModel', ['checkbox'], {
  isDefault: true,
  defaultProps: (ctx) => {
    return {
      allowClear: true,
      multiple: false,
      options: [
        {
          label: ctx.t('Yes'),
          value: true,
        },
        {
          label: ctx.t('No'),
          value: false,
        },
      ],
    };
  },
});
