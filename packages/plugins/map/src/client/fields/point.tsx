import { IField, interfacesProperties } from '@nocobase/client';
const { defaultProps } = interfacesProperties;

export const point: IField = {
  name: 'point',
  type: 'object',
  group: 'map',
  order: 4,
  title: '{{t("Point")}}',
  description: '{{t("Map point")}}',
  sortable: true,
  default: {
    type: 'point',
    // name,
    uiSchema: {
      type: 'void',
      // title,
      'x-disabled': true,
      'x-component': 'Map',
      'x-component-props': {},
    },
  },
  properties: {
    ...defaultProps,
    type: {
      title: '{{ t("Map type") }}',
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-disabled': '{{ !createOnly }}',
      enum: [
        { label: '{{t("Amap")}}', value: 'amap' },
        { label: '{{t("Google Maps")}}', value: 'google' },
      ],
    },
    accessKey: {
      title: '{{ t("Access key") }}',
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        allowClear: true,
      },
    },
  },
};
