import { getOptions } from '@nocobase/evaluators/client';
import { getConfigurableProperties } from './properties';
import { CollectionTemplate } from '../../data-source/collection-template/CollectionTemplate';

export class ExpressionCollectionTemplate extends CollectionTemplate {
  name = 'expression';
  title = '{{t("Expression collection")}}';
  order = 4;
  color = 'orange';
  default = {
    createdBy: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
    sortable: true,
    fields: [
      {
        name: 'engine',
        type: 'string',
        interface: 'radioGroup',
        uiSchema: {
          type: 'string',
          title: '{{t("Calculation engine")}}',
          'x-component': 'Radio.Group',
          enum: getOptions(),
          default: 'formula.js',
        },
      },
      {
        name: 'sourceCollection',
        type: 'string',
        interface: 'select',
        uiSchema: {
          type: 'string',
          title: '{{t("Collection")}}',
          'x-component': 'CollectionSelect',
          'x-component-props': {
            // multiple: true,
          },
        },
      },
      {
        name: 'expression',
        type: 'text',
        interface: 'expression',
        uiSchema: {
          type: 'string',
          title: '{{t("Expression")}}',
          'x-component': 'DynamicExpression',
        },
      },
    ],
  };
  availableFieldInterfaces = {
    include: [],
  };
  configurableProperties = getConfigurableProperties(
    'title',
    'name',
    'inherits',
    'category',
    'description',
    'presetFields',
  );
}
