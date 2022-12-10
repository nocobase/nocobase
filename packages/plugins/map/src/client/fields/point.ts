import { ISchema } from '@formily/react';
import { IField } from '@nocobase/client';
import { commonSchema } from './constant';

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
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  },
  ...commonSchema,
};
