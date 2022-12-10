import { ISchema } from '@formily/react';
import { interfacesProperties } from '@nocobase/client';

const { defaultProps } = interfacesProperties;

export const commonSchema = {
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.mapType': {
      title: '{{ t("Map type") }}',
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-disabled': '{{ !createOnly }}',
      default: 'amap',
      enum: [
        { label: '{{t("AMap")}}', value: 'amap' },
        { label: '{{t("Google Maps")}}', value: 'google' },
      ],
    },
    'uiSchema.x-component-props.accessKey': {
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
  schemaInitialize(schema: ISchema) {
    Object.assign(schema, {
      'x-designer': 'Map.Designer',
    });
  },
}
