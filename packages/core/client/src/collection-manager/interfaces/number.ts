import { registerValidateRules } from '@formily/core';
import { ISchema } from '@formily/react';
import { defaultProps, operators } from './properties';
import { IField } from './types';
import { i18n } from '../../i18n';

registerValidateRules({
  numberStringMode(value, rule) {
    const { maxValue, minValue } = rule;
    const valueNum = parseFloat(value);

    if (maxValue) {
      const maxNum = parseFloat(maxValue);

      if (valueNum > maxNum) {
        return {
          type: 'error',
          message: `数值不能大于${maxValue}`,
        }
      }
    }

    if (minValue) {
      const minNum = parseFloat(minValue);

      if (valueNum < minNum) {
        return {
          type: 'error',
          message: `数值不能小于${minValue}`,
        }
      }
    }
    
    return true;
  }
})

export const number: IField = {
  name: 'number',
  type: 'object',
  group: 'basic',
  order: 5,
  title: '{{t("Number")}}',
  sortable: true,
  default: {
    type: 'float',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '0',
      },
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.step': {
      type: 'string',
      title: '{{t("Precision")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      default: '0',
      enum: [
        { value: '0', label: '1' },
        { value: '0.1', label: '1.0' },
        { value: '0.01', label: '1.00' },
        { value: '0.001', label: '1.000' },
        { value: '0.0001', label: '1.0000' },
        { value: '0.00001', label: '1.00000' },
      ],
    },
  },
  filterable: {
    operators: operators.number,
  },
  validateSchema(fieldSchema, uiSchema) {
    console.log('uiSchema', uiSchema);
    return {
      type: 'object',
      default: fieldSchema?.['x-validator'],
      properties: {
        maxValue: {
          type: uiSchema?.type || 'number',
          title: '{{ t("Maximum") }}',
          'x-decorator': 'FormItem',
          'x-component': 'InputNumber',
          'x-component-props': {
            ...uiSchema?.['x-component-props']
          },
          'x-reactions': `{{(field) => {
            const targetValue = field.query('rules.minValue').value();
            field.selfErrors =
              !!targetValue && !!field.value && parseFloat(targetValue) > parseFloat(field.value) ? '${i18n.t('Maximum must greater than minimum')}' : ''
          }}}`,
        },
        minValue: {
          type: uiSchema?.type || 'number',
          title: '{{ t("Minimum") }}',
          'x-decorator': 'FormItem',
          'x-component': 'InputNumber',
          'x-component-props': {
            ...uiSchema?.['x-component-props']
          },
          'x-reactions': {
            dependencies: ['rules.maxValue'],
            fulfill: {
              state: {
                selfErrors: `{{!!$deps[0] && !!$self.value && parseFloat($deps[0]) < parseFloat($self.value) ? '${i18n.t('Minimum must less than maximum')}' : ''}}`,
              },
            },
          },
        },
      }
    } as ISchema;
  }
};
