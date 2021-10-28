import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const sort: FieldOptions = {
  name: 'sort',
  type: 'object',
  group: 'basic',
  order: 3,
  title: '排序',
  sortable: true,
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      'x-validator': 'integer',
      'x-designable-bar': 'Input.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  }
};
