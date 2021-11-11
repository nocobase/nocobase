/**
 * title: 横向菜单
 */
import React from 'react';
import { SchemaRenderer } from '@nocobase/client';
import { ISchema } from '../../index';

const schema: ISchema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      'x-component': 'Menu',
      'x-component-props': {
        mode: 'horizontal',
        // theme: 'dark',
      },
      properties: {
        item1: {
          type: 'void',
          title: `菜单1`,
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.Action',
          properties: {
            modal1: {
              type: 'void',
              title: '对话框标题',
              'x-component': 'Action.Modal',
              properties: {
                input: {
                  type: 'string',
                  'x-component': 'Input',
                },
              },
            },
          },
        },
        item2: {
          type: 'void',
          title: `菜单2`,
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.Action',
          properties: {
            modal2: {
              type: 'void',
              title: '对话框标题',
              'x-component': 'Action.Modal',
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
};

export default () => {
  return (
    <div style={{ width: 200 }}>
      <SchemaRenderer schema={schema} />
    </div>
  );
};
