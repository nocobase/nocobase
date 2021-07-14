import { ISchema } from '@formily/react';
import {
  useDesignableValues,
  useDesignableUpdate,
  useDesignableSchemaRemove,
} from '.';

export const DesignableBar: { [key: string]: ISchema } = {};

DesignableBar.Action = {
  name: 'bar',
  type: 'void',
  // title: '操作栏2',
  'x-component': 'Action.Dropdown',
  'x-component-props': {
    icon: 'MenuOutlined',
  },
  properties: {
    edit: {
      type: 'void',
      title: '编辑按钮',
      'x-component': 'Action',
      'x-component-props': {
        // icon,
      },
      properties: {
        modal: {
          type: 'void',
          title: '修改按钮配置',
          'x-decorator': 'Form',
          'x-decorator-props': {
            useValues: useDesignableValues,
          },
          'x-component': 'Action.Modal',
          'x-component-props': {
            width: '500px',
            useAction: useDesignableUpdate,
          },
          properties: {
            title: {
              type: 'string',
              title: '按钮标题',
              required: true,
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
          },
        },
      },
    },
    remove: {
      type: 'void',
      title: '删除按钮',
      'x-component': 'Action',
      'x-component-props': {
        useAction: useDesignableSchemaRemove,
        // icon,
      },
    },
  },
};
