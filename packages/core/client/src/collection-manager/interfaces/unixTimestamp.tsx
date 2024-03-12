import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { dateTimeProps, defaultProps, operators } from './properties';

export class UnixTimestampFieldInterface extends CollectionFieldInterface {
  name = 'unixTimestamp';
  type = 'object';
  group = 'datetime';
  order = 1;
  title = '{{t("UnixTimestamp")}}';
  sortable = true;
  default = {
    type: 'bigInt',
    uiSchema: {
      type: 'number',
      'x-component': 'UnixTimestamp',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  };
  availableTypes = ['integet', 'bigInt'];
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
    operators: operators.number,
  };
  titleUsable = true;
}
