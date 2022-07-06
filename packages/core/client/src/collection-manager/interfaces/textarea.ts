import { ISchema } from '@formily/react';
import { defaultProps } from './properties';
import { IField } from './types';
import { i18n } from '../../i18n';

export const textarea: IField = {
  name: 'textarea',
  type: 'object',
  group: 'basic',
  order: 2,
  title: '{{t("Long text")}}',
  default: {
    interface: 'textarea',
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'Input.TextArea',
    },
  },
  properties: {
    ...defaultProps,
  },
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
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
          max: {
            type: 'number',
            title: '{{ t("Max length") }}',
            minimum: 0,
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              ...formItemStyle
            },
            'x-component': 'InputNumber',
            'x-component-props': {
              precision: 0
            },
          },
          min: {
            type: 'number',
            title: '{{ t("Min length") }}',
            minimum: 0,
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              ...formItemStyle
            },
            'x-component': 'InputNumber',
            'x-component-props': {
              precision: 0
            },
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
