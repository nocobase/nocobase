import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const updatedBy: FieldOptions = {
  name: 'updatedBy',
  type: 'object',
  group: 'systemInfo',
  order: 4,
  title: '{{t("Last updated by")}}',
  isAssociation: true,
  default: {
    dataType: 'belongsTo',
    target: 'users',
    foreignKey: 'updated_by_id',
    // name,
    uiSchema: {
      type: 'object',
      title: '{{t("Last updated by")}}',
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
