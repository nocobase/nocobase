/**
 * title: Menu
 */
import { ISchema } from '@formily/react';
import { Application, Menu, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { Layout } from 'antd';
import React, { useRef } from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      'x-component': 'Menu',
      'x-component-props': {
        mode: 'mix',
        theme: 'dark',
        defaultSelectedUid: 'u1',
        sideMenuRefScopeKey: 'sideMenuRef',
      },
      properties: {
        item1: {
          type: 'void',
          title: 'Menu Item 1',
          'x-uid': 'u1',
          'x-component': 'Menu.Item',
          'x-component-props': {},
        },
        item2: {
          type: 'void',
          title: 'Menu Item 2',
          'x-uid': 'u2',
          'x-component': 'Menu.Item',
          'x-component-props': {},
        },
        item9: {
          type: 'void',
          title: 'SubMenu 2',
          'x-uid': 'u9',
          'x-component': 'Menu.SubMenu',
          'x-component-props': {},
          properties: {
            item10: {
              type: 'void',
              title: 'Menu Item 10',
              'x-uid': 'u10',
              'x-component': 'Menu.Item',
              'x-component-props': {},
            },
          },
        },
        item3: {
          type: 'void',
          title: 'SubMenu 1',
          'x-uid': 'u3',
          'x-component': 'Menu.SubMenu',
          'x-component-props': {},
          properties: {
            item4: {
              type: 'void',
              title: 'Menu Item 11',
              'x-uid': 'u4',
              'x-component': 'Menu.Item',
              'x-component-props': {},
            },
            item5: {
              type: 'void',
              title: 'Menu Item 12',
              'x-uid': 'u5',
              'x-component': 'Menu.Item',
              'x-component-props': {},
            },
            item6: {
              type: 'void',
              title: 'SubMenu 1',
              'x-uid': 'u6',
              'x-component': 'Menu.SubMenu',
              'x-component-props': {},
              properties: {
                item7: {
                  type: 'void',
                  title: 'Menu Item 11',
                  'x-uid': 'u7',
                  'x-component': 'Menu.Item',
                  'x-component-props': {},
                },
                item8: {
                  type: 'void',
                  title: 'Menu Item 12',
                  'x-uid': 'u8',
                  'x-component': 'Menu.Item',
                  'x-component-props': {},
                },
              },
            },
          },
        },
      },
    },
  },
};

const Root = () => {
  const sideMenuRef = useRef();
  return (
    <SchemaComponentProvider components={{ Menu }}>
      <Layout>
        <Layout.Header>
          <SchemaComponent scope={{ sideMenuRef }} schema={schema} />
        </Layout.Header>
        <Layout>
          <Layout.Sider theme={'light'} ref={sideMenuRef}></Layout.Sider>
          <Layout.Content>Content</Layout.Content>
        </Layout>
      </Layout>
    </SchemaComponentProvider>
  );
};

const app = new Application({
  providers: [Root],
});

export default app.getRootComponent();
