import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';
import { defaultProps, operators } from './properties';

export class TimeFieldInterface extends CollectionFieldInterface {
  name = 'time';
  type = 'object';
  group = 'datetime';
  order = 2;
  title = '{{t("Time")}}';
  sortable = true;
  default = {
    type: 'time',
    uiSchema: {
      type: 'string',
      'x-component': 'TimePicker',
    },
  };
  availableTypes = ['time'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    'uiSchema.x-component-props.format': {
      type: 'string',
      title: '{{t("Time format")}}',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      default: 'HH:mm:ss',
      enum: [
        {
          label: '{{t("12 hour")}}',
          value: 'hh:mm:ss a',
        },
        {
          label: '{{t("24 hour")}}',
          value: 'HH:mm:ss',
        },
      ],
    },
  };
  filterable = {
    operators: operators.time,
  };
  titleUsable = true;
}
