import { ISchema } from '@formily/react';
import { defaultProps, operators } from '../';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class CheckboxFieldInterface extends CollectionFieldInterface {
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
  availableTypes = ['boolean', 'integer', 'bigInt'];
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
