/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerValidateRules } from '@formily/core';
import { i18n } from '../../i18n';
import { defaultProps, unique } from './properties';
import { CollectionFieldInterface } from '../../collection-field-interface/CollectionFieldInterface';

registerValidateRules({
  percentMode(value, rule) {
    const { maxValue, minValue } = rule;

    if (maxValue) {
      if (value > maxValue) {
        return {
          type: 'error',
          message: `${i18n.t('The field value cannot be greater than ')}${maxValue * 100}%`,
        };
      }
    }

    if (minValue) {
      if (value < minValue) {
        return {
          type: 'error',
          message: `${i18n.t('The field value cannot be less than ')}${minValue * 100}%`,
        };
      }
    }

    return true;
  },

  percentFormats(value, rule) {
    const { percentFormat } = rule;

    if (value && percentFormat === 'Integer' && /^-?[1-9]\d*$/.test((value * 100).toString()) === false) {
      return {
        type: 'error',
        message: `${i18n.t('The field value is not an integer number')}`,
      };
    }

    return true;
  },
});

// registerValidateFormats({
//   percentInteger: /^(\d+)(.\d{0,2})?$/,
// });

export class PercentFieldInterface extends CollectionFieldInterface {
  name = 'percent';
  type = 'object';
  group = 'basic';
  order = 8;
  title = '{{t("Percent")}}';
  sortable = true;
  default = {
    type: 'float',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Percent',
      'x-component-props': {
        stringMode: true,
        step: '1',
        addonAfter: '%',
      },
    },
  };
  availableTypes = ['float', 'double', 'decimal'];
  hasDefaultValue = true;
  validationType = 'number';
  excludeValidationOptions = ['integer'];
  properties = {
    ...defaultProps,
    unique,
    'uiSchema.x-component-props.step': {
      type: 'string',
      title: '{{t("Precision")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      default: '1',
      enum: [
        { value: '1', label: '1%' },
        { value: '0.1', label: '1.0%' },
        { value: '0.01', label: '1.00%' },
        { value: '0.001', label: '1.000%' },
        { value: '0.0001', label: '1.0000%' },
        { value: '0.00001', label: '1.00000%' },
      ],
    },
  };
  filterable = {
    operators: 'number',
  };
  titleUsable = true;
}
