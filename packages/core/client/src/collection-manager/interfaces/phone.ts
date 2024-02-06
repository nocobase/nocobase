import { defaultProps, operators, unique } from './properties';
import { IField } from './types';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export const phone: IField = {
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
};

export class PhoneFieldInterface extends CollectionFieldInterface {
  name = 'phone';
  type = 'object';
  group = 'basic';
  order = 3;
  title = '{{t("Phone")}}';
  sortable = true;
  default = {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-component-props': {
        type: 'tel',
      },
      // 'x-validator': 'phone',
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    unique,
  };
  filterable = {
    operators: operators.string,
  };
  titleUsable = true;
}
