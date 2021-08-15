import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const chinaRegion: FieldOptions = {
  name: 'chinaRegion',
  type: 'object',
  group: 'choices',
  order: 7,
  title: '中国行政区划',
  default: {
    dataType: 'belongsToMany',
    target: 'china_regions',
    targetKey: 'code',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Cascader',
      'x-component-props': {},
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Cascader.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
  operations: [
    { label: '等于', value: 'code.in' },
  ],
};
