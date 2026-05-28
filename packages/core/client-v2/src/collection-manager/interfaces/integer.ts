/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerValidateFormats } from '@formily/core';
import { defaultProps, unique, autoIncrement, primaryKey } from './properties';
import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';

registerValidateFormats({
  odd: /^-?\d*[13579]$/,
  even: /^-?\d*[02468]$/,
});

export class IntegerFieldInterface extends CollectionFieldInterface {
  name = 'integer';
  type = 'object';
  group = 'basic';
  order = 6;
  title = '{{t("Integer")}}';
  primaryKeyDescription = '{{t("Primary key, unique identifier, self growth")}}';
  sortable = true;
  default = {
    type: 'bigInt',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-validator': 'integer',
    },
  };
  availableTypes = ['bigInt', 'integer', 'sort', 'snowflakeId'];
  hasDefaultValue = true;
  validationType = 'number';
  excludeValidationOptions = ['precision'];
  properties = {
    ...defaultProps,
    layout: {
      type: 'void',
      title: '{{t("Index")}}',
      'x-component': 'Space',
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        style: {
          marginBottom: '0px',
        },
      },
      properties: {
        primaryKey,
        unique,
      },
    },
    autoIncrement,
  };
  filterable = {
    operators: 'number',
  };
  titleUsable = true;
}
