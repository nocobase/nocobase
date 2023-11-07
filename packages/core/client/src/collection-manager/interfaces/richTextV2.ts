import type { ISchema } from '@formily/react';
import { i18n } from '../../i18n';
import { defaultProps, operators } from './properties';
import { IField } from './types';

export const richTextV2: IField = {
  name: 'richTextV2',
  type: 'object',
  group: 'media',
  order: 2,
  title: '{{t("Advanced Rich Text")}}',
  default: {
    interface: 'richTextV2',
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'RichTextV2',
    },
  },
  availableTypes: ['text'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
  },
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  },
  validateSchema(fieldSchema, formItemStyle) {
    return {
      max: {
        type: 'number',
        title: '{{ t("Max length") }}',
        minimum: 0,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': `{{(field) => {
          const targetValue = field.query('.min').value();
          field.selfErrors =
            !!targetValue && !!field.value && targetValue > field.value ? '${i18n.t(
              'Max length must greater than min length',
            )}' : ''
        }}}`,
      },
      min: {
        type: 'number',
        title: '{{ t("Min length") }}',
        minimum: 0,
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': {
          dependencies: ['.max'],
          fulfill: {
            state: {
              selfErrors: `{{!!$deps[0] && !!$self.value && $deps[0] < $self.value ? '${i18n.t(
                'Min length must less than max length',
              )}' : ''}}`,
            },
          },
        },
      },
    };
  },
  filterable: {
    operators: operators.string,
  },
};
