import { dateTimeProps, defaultProps, operators } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application';

export const updatedAt = new CollectionFieldInterfaceV2({
  name: 'updatedAt',
  type: 'object',
  group: 'systemInfo',
  order: 2,
  title: '{{t("Last updated at")}}',
  sortable: true,
  default: {
    type: 'date',
    field: 'updatedAt',
    // name,
    uiSchema: {
      type: 'string',
      title: '{{t("Last updated at")}}',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
    },
  },
  availableTypes: ['date'],
  properties: {
    ...defaultProps,
    ...dateTimeProps,
  },
  filterable: {
    operators: operators.datetime,
  },
  titleUsable: true,
});
