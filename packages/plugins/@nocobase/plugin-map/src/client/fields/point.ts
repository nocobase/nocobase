import { generateNTemplate } from '../locale';
import { CommonSchema } from './schema';

export class PointFieldInterface extends CommonSchema {
  name = 'point';
  type = 'object';
  group = 'map';
  order = 1;
  title = generateNTemplate('Point');
  description = generateNTemplate('Point');
  availableTypes = ['point'];
  sortable = true;
  default = {
    type: 'point',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  };
}
