import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const updatedBy: FieldOptions = {
  name: 'updatedBy',
  type: 'object',
  group: 'systemInfo',
  order: 4,
  title: '最后修改人',
  isAssociation: true,
  default: {
    dataType: 'belongsTo',
    target: 'users',
    foreignKey: 'updated_by_id',
    // name,
    uiSchema: {
      type: 'object',
      title: '最后修改人',
      'x-component': 'Select.Drawer',
      'x-component-props': {
        fieldNames: {
          value: 'id',
          label: 'nickname',
        },
      },
      'x-decorator': 'FormItem',
      'x-read-pretty': true,
      'x-designable-bar': 'Select.Drawer.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
