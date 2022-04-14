import type { ISchema } from '@formily/react';
import { defaultProps } from './properties';
import { IField } from './types';

export const richText: IField = {
  name: 'richText',
  type: 'object',
  group: 'media',
  order: 2,
  title: '{{t("Rich Text")}}',
  default: {
    interface: 'richText',
    type: 'text',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'RichText',
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
