import type { ISchema } from '@formily/react';
import { defaultProps } from './properties';
import type { IField } from './types';

export const url: IField = {
  name: 'url',
  type: 'string',
  group: 'basic',
  order: 5,
  title: '{{t("URL")}}',
  default: {
    type: 'string',
    uiSchema: {
      type: 'string',
      title: '{{t("URL")}}',
      'x-component': 'Input.URL',
    },
  },
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['size'] = 'small';
    }
  },
  properties: {
    ...defaultProps,
  },
};
