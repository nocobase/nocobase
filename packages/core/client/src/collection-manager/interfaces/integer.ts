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
    const formItemStyle = {
      labelCol: 8,
      wrapperCol: 16,
    }
    return {
      type: 'array',
      default: fieldSchema?.['x-validator'],
      'x-component': 'ArrayCollapse',
      'x-decorator': 'FormItem',
      'x-component-props': {
        accordion: true,
      },
      maxItems: 3,
      items: {
        type: 'object',
        'x-component': 'ArrayCollapse.CollapsePanel',
        'x-component-props': {
          header: '{{ t("Validation rule") }}',
        },
        properties: {
          index: {
            type: 'void',
            'x-component': 'ArrayCollapse.Index',
          },
          maximum: {
            type: 'number',
            title: '{{ t("Maximum") }}',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              ...formItemStyle
            },
            'x-component': 'InputNumber',
            'x-validator': 'integer',
            // 'x-component-props': {
            //   stringMode: true,
            //   step: '0',
            // },
            'x-reactions': `{{(field) => {
              const targetValue = field.query('.minValue').value();
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
            'x-component': 'InputNumber',
            'x-validator': 'integer',
            // 'x-component-props': {
            //   stringMode: true,
            //   step: '0',
            // },
            'x-reactions': {
              dependencies: ['.maxValue'],
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
            'x-decorator-props': {
              ...formItemStyle
            },
            'x-component': 'Input',
            'x-component-props': {
              prefix: '/',
              suffix: '/',
            }
          },
          message: {
            type: 'string',
            title: '{{ t("Error message") }}',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              ...formItemStyle
            },
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: {
                minRows: 2,
                maxRows: 2
              }
            }
          },
          remove: {
            type: 'void',
            'x-component': 'ArrayCollapse.Remove',
          },
          moveUp: {
            type: 'void',
            'x-component': 'ArrayCollapse.MoveUp',
          },
          moveDown: {
            type: 'void',
            'x-component': 'ArrayCollapse.MoveDown',
          },
        }
      },
      properties: {
        add: {
          type: 'void',
          title: '{{ t("Add validation rule") }}',
          'x-component': 'ArrayCollapse.Addition',
          'x-reactions': {
            dependencies: ['rules'],
            fulfill: {
              state: {
                disabled: '{{$deps[0].length >= 3}}'
              }
            }
          }
        },
      }
    } as ISchema;
  }
};
