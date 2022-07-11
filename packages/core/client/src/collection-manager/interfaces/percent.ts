import { ISchema } from '@formily/react';
import { defaultProps, operators } from './properties';
import { IField } from './types';
import { i18n } from '../../i18n';
import { registerValidateFormats, registerValidateRules, registerValidateLocale } from '@formily/core';

registerValidateRules({
  percentMode(value, rule) {
    const { maxValue, minValue } = rule;

    if (maxValue) {
      if (value > maxValue) {
        return {
          type: 'error',
          message: `${i18n.t('The field value cannot be greater than ')}${maxValue * 100}%`,
        }
      }
    }

    if (minValue) {
      if (value < minValue) {
        return {
          type: 'error',
          message: `${i18n.t('The field value cannot be less than ')}${minValue * 100}%`,
        }
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
      }
    }

    return true;
  }
})

// registerValidateFormats({
//   percentInteger: /^(\d+)(.\d{0,2})?$/,
// });

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
  validateSchema(fieldSchema) {
    return {
      maxValue: {
        type: 'number',
        title: '{{ t("Maximum") }}',
        'x-decorator': 'FormItem',
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
      minValue: {
        type: 'number',
        title: '{{ t("Minimum") }}',
        'x-decorator': 'FormItem',
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
      percentFormat: {
        type: 'string',
        title: '{{ t("Format") }}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          allowClear: true,
        },
        enum: [{
          label: '{{ t("Integer") }}',
          value: 'Integer',
        }]
      },
      pattern: {
        type: 'string',
        title: '{{ t("Regular expression") }}',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          prefix: '/',
          suffix: '/',
        }
      },
    };
  }
};
