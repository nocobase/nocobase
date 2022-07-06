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
            // 'x-component-props': {
            //   stringMode: true,
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
            // 'x-component-props': {
            //   stringMode: true,
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
              label: '{{ t("Integer") }}',
              value: 'integer',
            }, {
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
