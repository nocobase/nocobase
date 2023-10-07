import { ISchema } from '@formily/react';
import { defaultProps, operators } from './properties';
import { IField } from './types';

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
      'x-component': 'Input.URL',
    },
  },
  schemaInitialize(schema: ISchema, { block }) {},
  properties: {
    ...defaultProps,
  },
  titleUsable: true,
  filterable: {
    operators: operators.string,
  },
};
