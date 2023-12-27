import { dataSource, defaultProps, operators } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application';

export const radioGroup = new CollectionFieldInterfaceV2({
  name: 'radioGroup',
  type: 'object',
  group: 'choices',
  order: 4,
  title: '{{t("Radio group")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Radio.Group',
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  filterable: {
    operators: operators.enumType,
  },
  titleUsable: true,
});
