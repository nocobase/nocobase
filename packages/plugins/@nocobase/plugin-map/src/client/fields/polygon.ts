import { generateNTemplate } from '../locale';
import { CommonSchema } from './schema';

export class PolygonFieldInterface extends CommonSchema {
  name = 'polygon';
  type = 'object';
  group = 'map';
  order = 4;
  title = generateNTemplate('Polygon');
  description = generateNTemplate('Polygon');
  availableTypes = ['polygon'];
  sortable = true;
  default = {
    type: 'polygon',
    uiSchema: {
      type: 'void',
      'x-component': 'Map',
      'x-component-designer': 'Map.Designer',
      'x-component-props': {},
    },
  };
}
