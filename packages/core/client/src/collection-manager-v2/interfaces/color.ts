import { defaultProps, operators } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application';

export const color = new CollectionFieldInterfaceV2({
  name: 'color',
  type: 'object',
  group: 'basic',
  order: 10,
  title: '{{t("Color")}}',
  default: {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'ColorPicker',
      default: '#1677FF',
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
  },
  filterable: {
    operators: operators.string,
  },
});
