import { IField } from '@nocobase/client';
import { commonSchema } from './constant';

export const linestring: IField = {
  name: 'linestring',
  type: 'object',
  group: 'map',
  order: 4,
  title: '{{t("Line")}}',
  description: '{{t("Map Line")}}',
  sortable: true,
  default: {
    type: 'linestring',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  },
  ...commonSchema,
};
