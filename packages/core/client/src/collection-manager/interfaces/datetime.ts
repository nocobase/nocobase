import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { dateTimeProps, defaultProps, operators } from './properties';

export class DatetimeFieldInterface extends CollectionFieldInterface {
  name = 'datetime';
  type = 'object';
  group = 'datetime';
  order = 1;
  title = '{{t("Datetime")}}';
  sortable = true;
  default = {
    type: 'date',
    uiSchema: {
      type: 'string',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: false,
      },
    },
  };
  availableTypes = ['date', 'dateOnly'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    ...dateTimeProps,
    'uiSchema.x-component-props.gmt': {
      type: 'boolean',
      title: '{{t("GMT")}}',
      'x-hidden': true,
      'x-component': 'Checkbox',
      'x-content': '{{t("Use the same time zone (GMT) for all users")}}',
      'x-decorator': 'FormItem',
      default: false,
    },
  };
  filterable = {
    operators: operators.datetime,
  };
  titleUsable = true;
}
