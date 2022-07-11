import { defaultProps, operators } from './properties';
import { IField } from './types';
import { i18n } from '../../i18n';
import { registerValidateFormats } from '@formily/core';
import { ISchema } from '@formily/react';

registerValidateFormats({
  odd: /^-?\d*[13579]$/,
  even: /^-?\d*[02468]$/
});

export const integer: IField = {
  name: 'integer',
  type: 'object',
  group: 'basic',
  order: 5,
  title: '{{t("Integer")}}',
  sortable: true,
  default: {
    type: 'integer',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '0',
      },
      'x-validator': 'integer',
    },
  },
  properties: {
    ...defaultProps,
  },
  filterable: {
    operators: operators.number,
  },
  validateSchema(fieldSchema) {
    return {
      maximum: {
        type: 'number',
        title: '{{ t("Maximum") }}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0
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
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0
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
        'x-component': 'Select',
        'x-component-props': {
          allowClear: true,
        },
        enum: [{
          label: '{{ t("Odd") }}',
          value: 'odd',
        }, {
          label: '{{ t("Even") }}',
          value: 'even',
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
