import { defaultProps, operators } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application/collection/CollectionFieldInterface';

export const url = new CollectionFieldInterfaceV2({
  name: 'url',
  type: 'string',
  group: 'basic',
  order: 5,
  title: '{{t("URL")}}',
  default: {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input.URL',
    },
  },
  availableTypes: ['string'],
  properties: {
    ...defaultProps,
  },
  titleUsable: true,
  filterable: {
    operators: operators.string,
  },
});
