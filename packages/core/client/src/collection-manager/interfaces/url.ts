import { ISchema } from '@formily/react';
import { defaultProps } from './properties';
import { IField } from './types';

export const url: IField = {
  name: 'url',
  type: 'string',
  group: 'media',
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
