import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { dataSource, defaultProps, operators } from './properties';

export class RadioGroupFieldInterface extends CollectionFieldInterface {
  name = 'radioGroup';
  type = 'object';
  group = 'choices';
  order = 4;
  title = '{{t("Radio group")}}';
  sortable = true;
  default = {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Radio.Group',
    },
  };
  availableTypes = ['string', 'integer', 'boolean', 'integer'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  };
  filterable = {
    operators: operators.enumType,
  };
  titleUsable = true;
}
