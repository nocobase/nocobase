import { APIClient } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';

export default (apiClient: APIClient) => {
  const mock = new MockAdapter(apiClient.axios);

  mock.onGet('/app:getLang').reply(200, {
    data: { lang: 'en-US' },
  });

  mock.onGet('/ui_schemas:getJsonSchema/item1').reply(200, {
    data: {
      type: 'void',
      name: 'item1',
      'x-uid': 'item1',
      'x-component': 'div',
      'x-content': 'item1',
    },
  });

  mock.onGet('/ui_schemas:getJsonSchema/item2').reply(200, {
    data: {
      type: 'void',
      name: 'item2',
      'x-uid': 'item2',
      'x-component': 'div',
      'x-content': 'item2',
    },
  });

  mock.onGet('/ui_schemas:getJsonSchema/item4').reply(200, {
    data: {
      type: 'void',
      name: 'item4',
      'x-uid': 'item4',
      'x-component': 'div',
      'x-content': 'item4',
    },
  });

  mock.onGet('/ui_schemas:getJsonSchema/item5').reply(200, {
    data: {
      type: 'void',
      name: 'item5',
      'x-uid': 'item5',
      'x-component': 'div',
      'x-content': 'item5',
    },
  });

  mock.onGet('/ui_schemas:getJsonSchema/qqzzjakwkwl').reply(200, {
    data: {
      type: 'void',
      name: 'qqzzjakwkwl',
      'x-uid': 'qqzzjakwkwl',
      'x-component': 'Menu',
      'x-component-props': {
        mode: 'horizontal',
        theme: 'dark',
        onSelect: '{{ onSelect }}',
        defaultSelectedUid: '{{ defaultSelectedUid }}',
      },
      properties: {
        item1: {
          type: 'void',
          title: 'Menu Item 1',
          'x-uid': 'item1',
          'x-component': 'Menu.Item',
          'x-component-props': {},
        },
        item2: {
          type: 'void',
          title: 'Menu Item 2',
          'x-uid': 'item2',
          'x-component': 'Menu.Item',
          'x-component-props': {},
        },
        item3: {
          type: 'void',
          title: 'SubMenu 1',
          'x-uid': 'item3',
          'x-component': 'Menu.SubMenu',
          'x-component-props': {},
          properties: {
            item4: {
              type: 'void',
              title: 'Menu Item 4',
              'x-uid': 'item4',
              'x-component': 'Menu.Item',
              'x-component-props': {},
            },
            item5: {
              type: 'void',
              title: 'Menu Item 5',
              'x-uid': 'item5',
              'x-component': 'Menu.Item',
              'x-component-props': {},
            },
          },
        },
      },
    },
  });

  mock.onGet('/routes:getAccessible').reply(200, {
    data: [
      {
        type: 'redirect',
        from: '/',
        to: '/admin',
        exact: true,
      },
      {
        type: 'route',
        uiSchemaUid: 'qqzzjakwkwl',
        path: '/admin/:name(.+)?',
        component: 'AdminLayout',
        title: 'NocoBase',
      },
      {
        type: 'route',
        component: 'AuthLayout',
        routes: [
          {
            type: 'route',
            uiSchemaUid: 'dtf9j0b8p9u',
            path: '/signin',
            component: 'RouteSchemaComponent',
            title: '{{t("Sign in")}}',
          },
        ],
      },
    ],
  });
};
