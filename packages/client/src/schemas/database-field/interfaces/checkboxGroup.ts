import { multipleSelect } from './multipleSelect';
import { defaultProps, dataSource } from './properties';
import { FieldOptions } from '.';

export const checkboxGroup: FieldOptions = {
  name: 'checkboxGroup',
  type: 'object',
  group: 'choices',
  order: 5,
  title: '{{t("Checkbox group")}}',
  default: {
    interface: 'checkboxGroup',
    dataType: 'json',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Checkbox.Group',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Checkbox.Group.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operations: multipleSelect.operations,
};
