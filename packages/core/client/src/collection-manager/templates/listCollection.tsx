import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { defaultProps, defaultSystemFields, defaultCollectionOptions } from './properties';
import { IField } from './types';

export const listCollection: IField = {
  name: 'listCollection',
  type: 'object',
  title: '{{t("List collection")}}',
  isAssociation: true,
  order: 1,
  color: 'blue',
  presetFields: [...defaultSystemFields],
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['size'] = 'small';
    }
  },
  properties: {
    ...defaultProps,
    ...defaultCollectionOptions,
  },
};
