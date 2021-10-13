/**
 * title: 横向菜单
 */
import React from 'react';
import { SchemaRenderer } from '@nocobase/client';
import { uid } from '@formily/shared';
import { ISchema } from '@formily/react';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'Menu',
      'x-designable-bar': 'Menu.DesignableBar',
      'x-component-props': {
        mode: 'horizontal',
        theme: 'dark',
      },
      properties: {
        [uid()]: {
          type: 'void',
          title: `菜单1`,
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.Item',
        },
        [uid()]: {
          type: 'void',
          title: `链接`,
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.Link',
          'x-component-props': {
            to: '/abc/def',
          },
        },
        [uid()]: {
          type: 'void',
          title: `菜单2`,
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.Item',
        },
        [uid()]: {
          type: 'void',
          title: '菜单组3',
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.SubMenu',
          properties: {
            [uid()]: {
              type: 'void',
              title: `子菜单5`,
              'x-designable-bar': 'Menu.DesignableBar',
              'x-component': 'Menu.SubMenu',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: `子菜单8`,
                  'x-designable-bar': 'Menu.DesignableBar',
                  'x-component': 'Menu.Item',
                },
                [uid()]: {
                  type: 'void',
                  title: `子菜单9`,
                  'x-designable-bar': 'Menu.DesignableBar',
                  'x-component': 'Menu.Item',
                },
              },
            },
          },
        },
        [uid()]: {
          type: 'void',
          title: '菜单组4',
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.SubMenu',
          properties: {
            [uid()]: {
              type: 'void',
              title: `子菜单6`,
              'x-designable-bar': 'Menu.DesignableBar',
              'x-component': 'Menu.Item',
            },
            [uid()]: {
              type: 'void',
              title: `子菜单7`,
              'x-designable-bar': 'Menu.DesignableBar',
              'x-component': 'Menu.Item',
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
