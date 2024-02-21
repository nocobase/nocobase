import { defaultProps, operators, primaryKey, unique, autoIncrement } from './properties';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

export class SortFieldInterface extends CollectionFieldInterface {
  name = 'sort';
  type = 'object';
  group = 'advanced';
  order = 1;
  title = '{{t("Sort")}}';
  sortable = true;
  titleUsable = true;
  default = {
    type: 'sort',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-validator': 'integer',
    },
  };
  availableTypes = ['sort'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    primaryKey,
    unique,
    autoIncrement,
  };
  filterable = {
    operators: operators.number,
  };
}
