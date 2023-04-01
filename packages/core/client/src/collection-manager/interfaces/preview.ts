import { ISchema } from '@formily/react';
import { defaultProps, operators } from './properties';
import { IField } from './types';

export const preview: IField = {
  name: 'preview',
  type: 'string',
  group: 'media',
  title: '{{t("Preview")}}',
  default: {
    type: 'string',
    uiSchema: {
      type: 'string',
      title: '{{t("Preview")}}',
      'x-component': 'Preview.Selector',
      'x-read-pretty': true,
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
  filterable: {
    operators: operators.string,
  },
};
