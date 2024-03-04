import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { defaultProps } from './properties';

export class IconFieldInterface extends CollectionFieldInterface {
  name = 'icon';
  type = 'object';
  group = 'basic';
  order = 10;
  title = '{{t("Icon")}}';
  default = {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'IconPicker',
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
  };
}
