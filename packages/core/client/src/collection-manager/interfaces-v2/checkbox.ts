import { ISchema } from '@formily/react';
import { defaultProps, operators } from './properties';
import { IField } from './types';
import { CollectionFieldInterfaceV2 } from '../../application';

export const checkbox: IField = {
  name: 'checkbox',
  type: 'object',
  group: 'choices',
  order: 1,
  title: '{{t("Checkbox")}}',
  default: {
    type: 'boolean',
    // name,
    uiSchema: {
      type: 'boolean',
      'x-component': 'Checkbox',
    },
  },
  availableTypes: ['boolean'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
  },
  filterable: {
    operators: operators.boolean,
  },
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  },
};

export class CheckboxFieldInterface extends CollectionFieldInterfaceV2 {
  name = 'checkbox';
  type = 'object';
  group = 'choices';
  order = 1;
  title = '{{t("Checkbox")}}';
  default = {
    type: 'boolean',
    uiSchema: {
      type: 'boolean',
      'x-component': 'Checkbox',
    },
  };
  availableTypes = ['boolean'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
  };
  filterable = {
    operators: operators.boolean,
  };
  schemaInitialize(schema: ISchema, { block }: { block: string }): void {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['ellipsis'] = true;
    }
  }
}
