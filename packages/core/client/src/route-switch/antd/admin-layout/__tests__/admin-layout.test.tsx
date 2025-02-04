/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACLMenuItemProvider, AdminLayout, BlockSchemaComponentPlugin, CurrentUserProvider } from '@nocobase/client';
import { renderAppOptions, screen, waitFor } from '@nocobase/test/client';
import React from 'react';

describe('AdminLayout', () => {
  // 该测试点，已有 e2e 测试，跳过
  it.skip('should render correctly', async () => {
    await renderAppOptions({
      designable: true,
      noWrapperSchema: true,
      appOptions: {
        plugins: [BlockSchemaComponentPlugin],
        components: { ACLMenuItemProvider },
        providers: [CurrentUserProvider],
        router: {
          type: 'memory',
          initialEntries: ['/admin/9zva4x7mblv'],
          routes: {
            admin: {
              path: '/admin',
              element: <AdminLayout />,
            },
            'admin.name': {
              path: '/admin/:name',
              element: <div />,
            },
          },
        },
      },
      apis: {
        'app:getInfo': {
          data: {
            database: {
              dialect: 'sqlite',
            },
            version: '0.21.0-alpha.5',
            lang: 'en-US',
            name: 'main',
            theme: 'default',
          },
        },
        '/uiSchemas:getJsonSchema/nocobase-admin-menu': {
          data: {
            type: 'void',
            'x-component': 'Menu',
            'x-designer': 'Menu.Designer',
            'x-component-props': {
              mode: 'mix',
              theme: 'dark',
              onSelect: '{{ onSelect }}',
              sideMenuRefScopeKey: 'sideMenuRef',
            },
            properties: {
              '9zva4x7mblv': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                title: 'header title',
                'x-component': 'Menu.SubMenu',
                'x-decorator': 'ACLMenuItemProvider',
                'x-component-props': {},
                'x-server-hooks': [
                  {
                    type: 'onSelfCreate',
                    method: 'bindMenuToRole',
                  },
                  {
                    type: 'onSelfSave',
                    method: 'extractTextToLocale',
                  },
                ],
                'x-app-version': '0.21.0-alpha.5',
                properties: {
                  yhk3dzb3474: {
                    'x-uid': 'qzb0p475ld3',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    title: 'side title1',
                    'x-component': 'Menu.Item',
                    'x-decorator': 'ACLMenuItemProvider',
                    'x-component-props': {},
                    'x-server-hooks': [
                      {
                        type: 'onSelfSave',
                        method: 'extractTextToLocale',
                      },
                    ],
                    'x-async': false,
                    'x-index': 1,
                  },
                  '2kudkwbme4m': {
                    'x-uid': 'u9gw7d2d3x5',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    title: 'side title2',
                    'x-component': 'Menu.Item',
                    'x-decorator': 'ACLMenuItemProvider',
                    'x-component-props': {},
                    'x-server-hooks': [
                      {
                        type: 'onSelfSave',
                        method: 'extractTextToLocale',
                      },
                    ],
                    'x-async': false,
                    'x-index': 2,
                  },
                },
                'x-uid': '4ic78z722oh',
                'x-async': false,
                'x-index': 1,
              },
            },
            name: 'pv2f6fp7r65',
            'x-uid': 'nocobase-admin-menu',
            'x-async': false,
          },
        },
        'roles:check': {
          data: {
            role: 'root',
            strategy: {},
            actions: {},
            snippets: ['pm', 'pm.*', 'ui.*'],
            availableActions: ['create', 'view', 'update', 'destroy', 'export', 'importXlsx'],
            resources: [],
            actionAlias: {},
            allowAll: true,
            allowConfigure: null,
            allowMenuItemIds: [],
            allowAnonymous: false,
          },
          meta: {
            dataSources: {},
          },
        },
        'auth:check': {
          data: {
            createdAt: '2024-04-07 06:50:37.797 +00:00',
            updatedAt: '2024-04-07 06:50:37.797 +00:00',
            appLang: null,
            createdById: null,
            email: 'xxx@nocobase.com',
            f_1gx8uyn3wva: 1,
            id: 1,
            nickname: 'Super Admin',
            password: 'xxx',
            phone: null,
            resetToken: null,
            sort: 1,
            systemSettings: '{}',
            updatedById: null,
            username: 'nocobase',
          },
        },
        'systemSettings:get/1': {
          data: {
            id: 1,
            createdAt: '2024-04-07T06:50:37.584Z',
            updatedAt: '2024-04-07T06:50:37.594Z',
            title: 'NocoBase',
            showLogoOnly: null,
            allowSignUp: true,
            smsAuthEnabled: false,
            logoId: 1,
            enabledLanguages: ['en-US'],
            appLang: 'en-US',
            options: {},
          },
          meta: {
            allowedActions: {
              view: [1],
              update: [1],
              destroy: [1],
            },
          },
        },
        'uiSchemaTemplates:list': {
          data: [],
        },
        'collectionCategories:list': {
          data: [],
        },
      },
    });

    await waitFor(() => {
      expect(screen.queryByText('header title')).toBeInTheDocument();
      expect(screen.queryByText('side title1')).toBeInTheDocument();
      expect(screen.queryByText('side title2')).toBeInTheDocument();
    });
  });
});
