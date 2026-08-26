/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';
import { defaultProps, unique } from './properties';

export class NumberFieldInterface extends CollectionFieldInterface {
  name = 'number';
  type = 'object';
  group = 'basic';
  order = 7;
  title = '{{t("Number")}}';
  sortable = true;
  default = {
    type: 'double',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  };
  availableTypes = ['double', 'float', 'decimal'];
  hasDefaultValue = true;
  validationType = 'number';
  excludeValidationOptions = ['integer'];
  properties = {
    type: {
      type: 'string',
      title: '{{t("Data type")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      'x-disabled': '{{ !createOnly }}',
      default: 'double',
      enum: [
        { label: '{{t("Double")}}', value: 'double' },
        { label: '{{t("Float")}}', value: 'float' },
        { label: '{{t("Decimal")}}', value: 'decimal' },
      ],
    },
    ...defaultProps,
    unique,
    'uiSchema.x-component-props.step': {
      type: 'string',
      title: '{{t("Precision(UI)")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      default: '1',
      enum: [
        { value: '1', label: '1' },
        { value: '0.1', label: '1.0' },
        { value: '0.01', label: '1.00' },
        { value: '0.001', label: '1.000' },
        { value: '0.0001', label: '1.0000' },
        { value: '0.00001', label: '1.00000' },
        { value: '0.000001', label: '1.000000' },
        { value: '0.0000001', label: '1.0000000' },
        { value: '0.00000001', label: '1.00000000' },
      ],
    },
    precision: {
      type: 'string',
      title: '{{t("Precision")}}',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      'x-disabled': '{{ !createOnly }}',
      default: 10,
    },
    scale: {
      type: 'string',
      title: '{{t("Scale")}}',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      'x-disabled': '{{ !createOnly }}',
      default: 2,
    },
  };
  filterable = {
    operators: 'number',
  };
  titleUsable = true;
}
