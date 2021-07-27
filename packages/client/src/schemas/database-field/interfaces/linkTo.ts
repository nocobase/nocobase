import { ISchema } from '@formily/react';
import { defaultProps } from './properties';
import { uid } from '@formily/shared';

export const linkTo: ISchema = {
  name: 'linkTo',
  type: 'object',
  group: 'relation',
  order: 1,
  title: '关联字段',
  default: {
    dataType: 'belongsToMany',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Select.Drawer',
      'x-component-props': {},
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Select.Drawer.DesignableBar',
    } as ISchema,
  },
  initialize: (values: any) => {
    if (values.dataType === 'belongsToMany') {
      if (!values.through) {
        values.through = `t_${uid()}`;
      }
      if (!values.foreignKey) {
        values.foreignKey = `f_${uid()}`;
      }
      if (!values.otherKey) {
        values.otherKey = `f_${uid()}`;
      }
      if (!values.sourceKey) {
        values.sourceKey = 'id';
      }
      if (!values.targetKey) {
        values.targetKey = 'id';
      }
    }
  },
  properties: {
    ...defaultProps,
    target: {
      type: 'string',
      title: '要关联的数据表',
      required: true,
      'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
    },
    'uiSchema.x-component-props.multiple': {
      type: 'boolean',
      'x-content': '允许关联多条记录',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  operations: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
  ],
};
