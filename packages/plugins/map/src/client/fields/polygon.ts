import { IField } from '@nocobase/client';
import { commonSchema } from './constant';

export const polygon: IField = {
  name: 'polygon',
  type: 'object',
  group: 'map',
  order: 4,
  title: '{{t("Polygon")}}',
  description: '{{t("Map Polygon")}}',
  sortable: true,
  default: {
    type: 'polygon',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  },
  ...commonSchema,
};
