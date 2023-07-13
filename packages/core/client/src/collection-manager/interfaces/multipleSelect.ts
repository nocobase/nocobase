import { ISchema } from '@formily/react';
import { dataSource, defaultProps, operators } from './properties';
import { IField } from './types';

export const multipleSelect: IField = {
  name: 'multipleSelect',
  type: 'object',
  group: 'choices',
  order: 3,
  title: '{{t("Multiple select")}}',
  default: {
    type: 'array',
    defaultValue: [],
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Select',
      'x-component-props': {
        mode: 'multiple',
      },
      enum: [],
    },
  },
  availableTypes: ['array'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  filterable: {
    operators: operators.array,
  },
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
