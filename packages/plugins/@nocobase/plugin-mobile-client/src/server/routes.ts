/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
