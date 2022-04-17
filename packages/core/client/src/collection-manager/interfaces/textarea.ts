import { ISchema } from '@formily/react';
import { defaultProps } from './properties';
import { IField } from './types';

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
};
