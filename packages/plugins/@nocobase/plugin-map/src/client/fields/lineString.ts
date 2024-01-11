import { IField } from '@nocobase/client';
import { generateNTemplate } from '../locale';
import { CommonSchema, commonSchema } from './schema';

export const lineString: IField = {
  name: 'lineString',
  type: 'object',
  group: 'map',
  order: 2,
  title: generateNTemplate('Line'),
  description: generateNTemplate('Line'),
  availableTypes: ['lineString'],
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

export class LineStringFieldInterface extends CommonSchema {
  name = 'lineString';
  type = 'object';
  group = 'map';
  order = 2;
  title = generateNTemplate('Line');
  description = generateNTemplate('Line');
  availableTypes = ['lineString'];
  sortable = true;
  default = {
    type: 'lineString',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  };
}
