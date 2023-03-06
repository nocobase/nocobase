import { ISchema } from '@formily/react';
import { interfacesProperties } from '@nocobase/client';
import { MapTypes } from '../constants';
import { generateNTemplate } from '../locale';

const { defaultProps } = interfacesProperties;

if (Array.isArray(interfacesProperties.type.enum)) {
  interfacesProperties.type.enum.push(
    {
      label: 'Point',
      value: 'point',
    },
    {
      label: 'LineString',
      value: 'lineString',
    },
    {
      label: 'Polygon',
      value: 'polygon',
    },
    {
      label: 'Circle',
      value: 'circle',
    },
  );
}

export const commonSchema = {
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.mapType': {
      title: generateNTemplate('Map type'),
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        showSearch: false,
        allowClear: false,
      },
      'x-disabled': '{{ isOverride || !createOnly }}',
      default: 'amap',
      enum: MapTypes
    }
  },
  schemaInitialize(schema: ISchema, { readPretty, block }) {
    if (block === 'Form') {
      Object.assign(schema, {
        'x-component-props': {
          readOnly: readPretty ? true : false
        },
        'x-designer': 'Map.Designer',
      });
    }
  },
}
