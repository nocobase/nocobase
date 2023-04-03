import { getOptions } from '@nocobase/evaluators/client';
import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const expression: ICollectionTemplate = {
  name: 'expression',
  title: '{{t("Dynamic expression collection")}}',
  order: 4,
  color: 'orange',
  default: {
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
          required: true
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
            multiple: true
          },
          required: true
        }
      },
      {
        name: 'expression',
        type: 'text',
        interface: 'expression',
        uiSchema: {
          type: 'string',
          title: '{{t("Expression")}}',
          'x-component': 'DynamicExpression',
          required: true
        }
      }
    ],
  },
  availableFieldInterfaces: {
    include: [],
  },
  configurableProperties: getConfigurableProperties('title', 'name', 'inherits','category'),
};
