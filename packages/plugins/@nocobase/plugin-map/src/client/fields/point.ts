import { CollectionFieldInterfaceV2 } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { commonSchema } from './schema';

export const point = new CollectionFieldInterfaceV2({
  name: 'point',
  type: 'object',
  group: 'map',
  order: 1,
  title: generateNTemplate('Point'),
  description: generateNTemplate('Point'),
  availableTypes: ['point'],
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
});
