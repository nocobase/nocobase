import { uid } from '@formily/shared';
import { APIClient } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';

export default (apiClient: APIClient) => {
  const mock = new MockAdapter(apiClient.axios);

  mock.onGet('/app:getLang').reply(200, {
    data: { lang: 'en-US' },
  });

  mock.onGet('/systemSettings:get/1').reply(200, {
    data: {
      title: 'NocoBase',
    },
  });

  const jsonSchema = {
    qqzzjakwkwl: {
      name: 'qqzzjakwkwl',
      type: 'void',
      'x-component': 'Menu',
      'x-component-props': {
        mode: 'mix',
        theme: 'dark',
        // defaultSelectedUid: 'u8',
        onSelect: '{{ onSelect }}',
        sideMenuRefScopeKey: 'sideMenuRef',
      },
      properties: {
        item3: {
          type: 'void',
          title: 'SubMenu u3',
          'x-uid': 'u3',
          'x-component': 'Menu.SubMenu',
          'x-component-props': {},
          properties: {
            item6: {
              type: 'void',
              title: 'SubMenu u6',
              'x-uid': 'u6',
              'x-component': 'Menu.SubMenu',
              'x-component-props': {},
              properties: {
                item7: {
                  type: 'void',
                  title: 'Menu Item u7',
                  'x-uid': 'u7',
                  'x-component': 'Menu.Item',
                  'x-component-props': {},
                },
                item8: {
                  type: 'void',
                  title: 'Menu Item u8',
                  'x-uid': 'u8',
                  'x-component': 'Menu.Item',
                  'x-component-props': {},
                },
              },
            },
            item4: {
              type: 'void',
              title: 'Menu Item u4',
              'x-uid': 'u4',
              'x-component': 'Menu.Item',
              'x-component-props': {},
            },
            item5: {
              type: 'void',
              title: 'Menu Item u5',
              'x-uid': 'u5',
              'x-component': 'Menu.Item',
              'x-component-props': {},
            },
          },
        },
        item1: {
          type: 'void',
          title: 'Menu Item u1',
          'x-uid': 'u1',
          'x-component': 'Menu.Item',
          'x-component-props': {},
        },
        item2: {
          type: 'void',
          title: 'Menu Item u2',
          'x-uid': 'u2',
          'x-component': 'Menu.Item',
          'x-component-props': {},
        },
        item9: {
          type: 'void',
          title: 'SubMenu u9',
          'x-uid': 'u9',
          'x-component': 'Menu.SubMenu',
          'x-component-props': {},
          properties: {
            item10: {
              type: 'void',
              title: 'Menu Item u10',
              'x-uid': 'u10',
              'x-component': 'Menu.Item',
              'x-component-props': {},
            },
          },
        },
      },
    },
  };

  mock.onGet(/\/uiSchemas\:getJsonSchema\/(\w+)/).reply(function (config) {
    const name = config.url.split('/').pop();
    console.log(name);
    if (jsonSchema[name]) {
      return [200, { data: jsonSchema[name] }];
    }
    const response = {
      data: {
        type: 'void',
        name: name,
        'x-uid': name,
        'x-component': 'Page',
        properties: {
          [uid()]: {
            type: 'void',
            name: 'grid1',
            'x-component': 'Grid',
            'x-initializer': 'Grid.AddBlockItem',
            'x-uid': uid(),
            properties: {},
          },
        },
      },
    };
    return [200, response];
  });

  mock.onGet(/\/uiSchemas\:getProperties\/(\w+)/).reply(function (config) {
    // const name = config.url.split('/').pop();
    // console.log(name);
    // if (jsonSchema[name]) {
    //   return [200, { data: jsonSchema[name] }];
    // }
    const response = {
      data: {
        type: 'void',
        name: uid(),
        'x-uid': uid(),
        'x-component': 'Page',
        properties: {
          [uid()]: {
            type: 'void',
            name: 'grid1',
            'x-component': 'Grid',
            'x-initializer': 'Grid.AddBlockItem',
            'x-uid': uid(),
            properties: {},
          },
        },
      },
    };
    return [200, response];
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
        title: 'NocoBase Admin',
      },
      {
        type: 'route',
        component: 'AuthLayout',
        routes: [
          {
            type: 'route',
            path: '/signin',
            component: 'SigninPage',
          },
          {
            type: 'route',
            path: '/signup',
            component: 'SignupPage',
          },
        ],
      },
    ],
  });
};
