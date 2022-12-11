import { IField } from '@nocobase/client';
import { generateNTemplate } from '../locales';
import { commonSchema } from './constant';

export const lineString: IField = {
  name: 'lineString',
  type: 'object',
  group: 'map',
  order: 2,
  title: generateNTemplate('Line'),
  description: generateNTemplate('Line'),
  sortable: true,
  default: {
    type: 'lineString',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  },
  ...commonSchema,
};
