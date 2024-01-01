import { CollectionFieldInterfaceV2 } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { commonSchema } from './schema';

export const circle = new CollectionFieldInterfaceV2({
  name: 'circle',
  type: 'object',
  group: 'map',
  order: 3,
  title: generateNTemplate('Circle'),
  availableTypes: ['circle'],
  description: generateNTemplate('Circle'),
  sortable: true,
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
});
