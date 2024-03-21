/**
 * title: Menu
 */
import { ISchema } from '@formily/react';
import { Application, Menu, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      'x-component': 'Menu',
      'x-component-props': {
        mode: 'inline',
        defaultSelectedUid: 'u1',
        style: {
          width: 260,
        },
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
  return (
    <SchemaComponentProvider components={{ Menu }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};

const app = new Application({
  providers: [Root],
});

export default app.getRootComponent();
