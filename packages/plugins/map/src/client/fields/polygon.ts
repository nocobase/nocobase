import { IField } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { commonSchema } from './schema';

export const polygon: IField = {
  name: 'polygon',
  type: 'object',
  group: 'map',
  order: 4,
  title: generateNTemplate('Polygon'),
  description: generateNTemplate('Polygon'),
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
