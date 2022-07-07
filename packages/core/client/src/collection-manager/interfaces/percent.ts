import { ISchema } from '@formily/react';
import { defaultProps, operators } from './properties';
import { IField } from './types';
import { i18n } from '../../i18n';
import { registerValidateFormats, registerValidateRules } from '@formily/core';

registerValidateRules({
  percentStringMode(value, rule) {
    const { maxValue, minValue } = rule;
    const valueNum = parseFloat(value);

    if (maxValue) {
      const maxNum = parseFloat(maxValue) / 100;

      if (valueNum > maxNum) {
        return {
          type: 'error',
          message: `数值不能大于${maxValue}`,
        }
      }
    }

    if (minValue) {
      const minNum = parseFloat(minValue) / 100;

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

registerValidateFormats({
  percentInteger: /^(\d+)(.\d{0,2})?$/,
});

export const percent: IField = {
  name: 'percent',
  type: 'object',
  group: 'basic',
  order: 6,
  title: '{{t("Percent")}}',
  sortable: true,
  default: {
    type: 'float',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Percent',
      'x-component-props': {
        stringMode: true,
        step: '0',
        addonAfter: '%',
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
        { value: '0', label: '1%' },
        { value: '0.1', label: '1.0%' },
        { value: '0.01', label: '1.00%' },
        { value: '0.001', label: '1.000%' },
        { value: '0.0001', label: '1.0000%' },
        { value: '0.00001', label: '1.00000%' },
      ],
    },
  },
  filterable: {
    operators: operators.number,
  },
  validateSchema(fieldSchema, formItemStyle) {
    return {
      maximum: {
        type: 'number',
        title: '{{ t("Maximum") }}',
        'x-decorator': 'FormItem',
        'x-decorator-props': {
          ...formItemStyle
        },
        'x-component': 'Percent',
        'x-component-props': {
          addonAfter: '%',
        },
        'x-reactions': `{{(field) => {
          const targetValue = field.query('.minimum').value();
          field.selfErrors =
            !!targetValue && !!field.value && targetValue > field.value ? '${i18n.t('Maximum must greater than minimum')}' : ''
        }}}`,
      },
      minimum: {
        type: 'number',
        title: '{{ t("Minimum") }}',
        'x-decorator': 'FormItem',
        'x-decorator-props': {
          ...formItemStyle
        },
        'x-component': 'Percent',
        'x-component-props': {
          addonAfter: '%',
        },
        'x-reactions': {
          dependencies: ['.maximum'],
          fulfill: {
            state: {
              selfErrors: `{{!!$deps[0] && !!$self.value && $deps[0] < $self.value ? '${i18n.t('Minimum must less than maximum')}' : ''}}`,
            },
          },
        },
      },
      format: {
        type: 'string',
        title: '{{ t("Format") }}',
        'x-decorator': 'FormItem',
        'x-decorator-props': {
          ...formItemStyle
        },
        'x-component': 'Select',
        'x-component-props': {
          allowClear: true,
        },
        enum: [{
          label: '{{ t("Integer") }}',
          value: 'percentInteger',
        }]
      },
      pattern: {
        type: 'string',
        title: '{{ t("Regular expression") }}',
        'x-decorator': 'FormItem',
        'x-decorator-props': {
          ...formItemStyle
        },
        'x-component': 'Input',
        'x-component-props': {
          prefix: '/',
          suffix: '/',
        }
      },
    };
  }
};
