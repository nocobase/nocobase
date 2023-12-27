import { defaultProps, operators, unique } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application';

export const phone = new CollectionFieldInterfaceV2({
  name: 'phone',
  type: 'object',
  group: 'basic',
  order: 3,
  title: '{{t("Phone")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-component-props': {
        type: 'tel',
      },
      // 'x-validator': 'phone',
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    unique,
  },
  filterable: {
    operators: operators.string,
  },
  titleUsable: true,
});
