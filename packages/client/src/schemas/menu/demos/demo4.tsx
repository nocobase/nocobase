import React, { useRef } from 'react';
import { SchemaRenderer } from '@nocobase/client';
import { Layout } from 'antd';

const schema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      'x-component': 'Menu',
      'x-designable-bar': 'Menu.DesignableBar',
      'x-component-props': {
        sideMenuRef: '{{ sideMenuRef }}',
        mode: 'mix',
        theme: 'dark',
      },
      properties: {
        item1: {
          type: 'void',
          title: `菜单1`,
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.Item',
        },
        item2: {
          type: 'void',
          title: `菜单2`,
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.Item',
        },
        item3: {
          type: 'void',
          title: '菜单组3',
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.SubMenu',
          properties: {
            item5: {
              type: 'void',
              title: `子菜单5`,
              'x-designable-bar': 'Menu.DesignableBar',
              'x-component': 'Menu.SubMenu',
              properties: {
                item8: {
                  type: 'void',
                  title: `子菜单8`,
                  'x-designable-bar': 'Menu.DesignableBar',
                  'x-component': 'Menu.Item',
                },
                item9: {
                  type: 'void',
                  title: `子菜单9`,
                  'x-designable-bar': 'Menu.DesignableBar',
                  'x-component': 'Menu.Item',
                },
              },
            },
          },
        },
        item4: {
          type: 'void',
          title: '菜单组4',
          'x-designable-bar': 'Menu.DesignableBar',
          'x-component': 'Menu.SubMenu',
          properties: {
            item6: {
              type: 'void',
              title: `子菜单6`,
              'x-designable-bar': 'Menu.DesignableBar',
              'x-component': 'Menu.Item',
            },
            item7: {
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
  const sideMenuRef = useRef();
  return (
    <Layout>
      <Layout.Header>
        <SchemaRenderer
          scope={{ sideMenuRef }}
          schema={schema}
        />
      </Layout.Header>
      <Layout>
        <Layout.Sider theme={'light'} ref={sideMenuRef}></Layout.Sider>
      </Layout>
    </Layout>
  );
};
