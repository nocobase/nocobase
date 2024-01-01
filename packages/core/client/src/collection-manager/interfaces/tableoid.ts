import { operators } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application/collection/CollectionFieldInterface';

export const tableoid = new CollectionFieldInterfaceV2({
  name: 'tableoid',
  type: 'object',
  group: 'systemInfo',
  order: 0,
  title: '{{t("Table OID")}}',
  sortable: true,
  default: {
    name: '__collection',
    type: 'virtual',
    uiSchema: {
      type: 'string',
      title: '{{t("Table OID")}}',
      'x-component': 'CollectionSelect',
      'x-component-props': {
        isTableOid: true,
      },
      'x-read-pretty': true,
    },
  },
  availableTypes: ['string'],
  properties: {
    'uiSchema.title': {
      type: 'string',
      title: '{{t("Field display name")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Field name")}}',
      required: true,
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
  filterable: {
    operators: operators.tableoid,
  },
});
