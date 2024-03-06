export const routes = [
  {
    type: 'route',
    path: '/mobile/:name(.+)?',
    component: 'MApplication',
    uiSchema: {
      type: 'void',
      'x-component': 'MContainer',
      'x-designer': 'MContainer.Designer',
      'x-component-props': {},
      properties: {
        page: {
          type: 'void',
          'x-component': 'MPage',
          'x-designer': 'MPage.Designer',
          'x-component-props': {},
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'mobilePage:addBlock',
              'x-component-props': {
                showDivider: false,
              },
            },
          },
        },
      },
    },
    routes: [
      {
        type: 'route',
        path: '',
        component: 'RouteSchemaComponent',
      },
    ],
  },
];
