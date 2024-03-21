import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { dateTimeProps, defaultProps, operators } from './properties';

export class CreatedAtFieldInterface extends CollectionFieldInterface {
  name = 'createdAt';
  type = 'object';
  group = 'systemInfo';
  order = 1;
  title = '{{t("Created at")}}';
  sortable = true;
  default = {
    type: 'date',
    field: 'createdAt',
    uiSchema: {
      type: 'datetime',
      title: '{{t("Created at")}}',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
    },
  };
  availableTypes = ['date'];
  properties = {
    ...defaultProps,
    ...dateTimeProps,
  };
  filterable = {
    operators: operators.datetime,
  };
  titleUsable = true;
}
