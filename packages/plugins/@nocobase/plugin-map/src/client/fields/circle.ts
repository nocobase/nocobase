import { generateNTemplate } from '../locale';
import { CommonSchema } from './schema';

export class CircleFieldInterface extends CommonSchema {
  name = 'circle';
  type = 'object';
  group = 'map';
  order = 3;
  title = generateNTemplate('Circle');
  availableTypes = ['circle'];
  description = generateNTemplate('Circle');
  sortable = true;
  default = {
    type: 'circle',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  };
}
