import { ISchema } from '@formily/react';
import { collectionDataSource, defaultProps, operators } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application';

export const collection = new CollectionFieldInterfaceV2({
  name: 'collection',
  type: 'string',
  group: 'advanced',
  order: 5,
  title: '{{t("Collection")}}',
  sortable: true,
  default: {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'CollectionSelect',
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: false,
  properties: {
    ...defaultProps,
    'uiSchema.enum': collectionDataSource,
  },
  filterable: { operators: operators.collection },
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
});
