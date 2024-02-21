import { defaultProps, operators } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class SortFieldInterface extends CollectionFieldInterface {
  name = 'sort';
  type = 'object';
  group = 'advanced';
  order = 1;
  title = '{{t("Sort")}}';
  sortable = true;
  default = {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-component-props': {},
    },
  };
  availableTypes = ['string'];
  hasDefaultValue = false;
  properties = {
    ...defaultProps,
  };
  filterable = {
    operators: operators.string,
  };
  titleUsable = true;
}
