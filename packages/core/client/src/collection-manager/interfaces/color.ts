import { CollectionFieldInterfaceBase } from '../../application/collection/CollectionFieldInterface';
import { defaultProps, operators } from './properties';
import { IField } from './types';

export const color: IField = {
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
};

export class ColorFieldInterface extends CollectionFieldInterfaceBase {
  name = 'color';
  type = 'object';
  group = 'basic';
  order = 10;
  title = '{{t("Color")}}';
  default = {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'ColorPicker',
      default: '#1677FF',
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
  };
  filterable = {
    operators: operators.string,
  };
}
