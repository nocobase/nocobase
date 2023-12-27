import { defaultProps } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application';

export const icon = new CollectionFieldInterfaceV2({
  name: 'icon',
  type: 'object',
  group: 'basic',
  order: 10,
  title: '{{t("Icon")}}',
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'IconPicker',
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
  },
});
