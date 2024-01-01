import { CollectionFieldInterfaceV2 } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { commonSchema } from './schema';

export const polygon = new CollectionFieldInterfaceV2({
  name: 'polygon',
  type: 'object',
  group: 'map',
  order: 4,
  title: generateNTemplate('Polygon'),
  description: generateNTemplate('Polygon'),
  availableTypes: ['polygon'],
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
});
