import { IField } from '@nocobase/client';
import { generateNTemplate } from '../locales';
import { commonSchema } from './schema';

export const circle: IField = {
  name: 'circle',
  type: 'object',
  group: 'map',
  order: 3,
  title: generateNTemplate('Circle'),
  description: generateNTemplate('Circle'),
  sortable: true,
  dialects: ['postgres', 'sqlite'],
  default: {
    type: 'circle',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  },
  ...commonSchema,
};
