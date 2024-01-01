import { defaultProps, operators } from './properties';
import { CollectionFieldInterfaceV2 } from '../../application/collection/CollectionFieldInterface';

export const time = new CollectionFieldInterfaceV2({
  name: 'time',
  type: 'object',
  group: 'datetime',
  order: 2,
  title: '{{t("Time")}}',
  sortable: true,
  default: {
    type: 'time',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'TimePicker',
    },
  },
  availableTypes: ['time'],
  hasDefaultValue: true,
  properties: {
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
  },
  filterable: {
    operators: operators.time,
  },
  titleUsable: true,
});
