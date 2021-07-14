import React from 'react';
import { SchemaRenderer } from '@nocobase/client';

function useAction() {
  return {
    run() {
      alert('这是自定义的操作逻辑');
    },
  };
}

const schema = {
  type: 'void',
  name: 'action1',
  title: '下拉菜单',
  'x-component': 'Action.Dropdown',
  properties: {
    action1: {
      type: 'void',
      name: 'action1',
      title: '按钮',
      'x-component': 'Action',
      'x-component-props': {
        useAction,
      },
    },
    action2: {
      type: 'void',
      title: 'Drawer 按钮',
      'x-component': 'Action',
      properties: {
        drawer1: {
          type: 'void',
          title: '抽屉标题',
          'x-component': 'Action.Drawer',
          'x-component-props': {},
          properties: {
            input: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
            action2: {
              type: 'void',
              title: '打开二级抽屉',
              // 'x-decorator': 'FormItem',
              'x-component': 'Action',
              properties: {
                drawer1: {
                  type: 'void',
                  title: '二级抽屉标题',
                  'x-component': 'Action.Drawer',
                  'x-component-props': {},
                  properties: {
                    input: {
                      type: 'string',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    action3: {
      type: 'void',
      name: 'action1',
      title: 'Popover 按钮',
      'x-component': 'Action',
      properties: {
        popover1: {
          type: 'void',
          title: '弹窗标题',
          'x-component': 'Action.Popover',
          'x-component-props': {},
          properties: {
            input: {
              type: 'string',
              'x-component': 'Input',
            },
          },
        },
      },
    },
  },
};

export default () => {
  return <SchemaRenderer schema={schema} />;
};
