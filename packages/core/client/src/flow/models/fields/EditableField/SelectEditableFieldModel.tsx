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
    return [
      Select,
      {
        allowClear: true,
      },
    ];
  }
}

SelectEditableFieldModel.registerFlow({
  key: 'selectFieldSetting',
  sort: 400,
  steps: {
    initProps: {
      handler(ctx) {
        const collectionField = ctx.model.collectionField;
        if (collectionField.enum) {
          ctx.model.setProps({
            options: collectionField.enum,
          });
        }
        if (collectionField.type === 'array') {
          ctx.model.setProps({
            mode: 'multiple',
          });
        }
      },
    },
  },
});
