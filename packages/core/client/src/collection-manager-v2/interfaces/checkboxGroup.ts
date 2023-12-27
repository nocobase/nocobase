import { ISchema } from '@formily/react';
import { dataSource, defaultProps, operators } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application';

export const checkboxGroup = new CollectionFieldInterfaceV2({
  name: 'checkboxGroup',
  type: 'object',
  group: 'choices',
  order: 5,
  title: '{{t("Checkbox group")}}',
  default: {
    interface: 'checkboxGroup',
    type: 'array',
    defaultValue: [],
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'Checkbox.Group',
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
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  },
});
