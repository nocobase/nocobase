import { ISchema } from '@formily/react';
import { IField } from '@nocobase/client';
import { generateNTemplate } from '../locales';
import { commonSchema } from './schema';

export const point: IField = {
  name: 'point',
  type: 'object',
  group: 'map',
  order: 1,
  title: generateNTemplate('Point'),
  description: generateNTemplate('Point'),
  dialects: ['postgres', 'mysql'],
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
