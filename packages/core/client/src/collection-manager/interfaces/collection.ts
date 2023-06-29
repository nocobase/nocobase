import { ISchema } from '@formily/react';
import { defaultProps, operators } from './properties';
import { IField } from './types';

export const collection: IField = {
  name: 'collection',
  type: 'object',
  group: 'advanced',
  order: 5,
  title: '{{t("Collection")}}',
  sortable: true,
  default: {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'CollectionSelect',
      enum: [],
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: false,
  properties: {
    ...defaultProps,
  },
  filterable: { operators: operators.enumType },
  schemaInitialize(schema: ISchema, { block }) {
    const props = (schema['x-component-props'] = schema['x-component-props'] || {});
    props.style = {
      ...(props.style || {}),
      width: '100%',
    };

    if (['Table', 'Kanban'].includes(block)) {
      props['ellipsis'] = true;
    }
  },
};
