/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSchemaComponentPlugin } from '@nocobase/client';
import { renderAppOptions, waitFor, screen, userEvent } from '@nocobase/test/client';

describe('GridCard', () => {
  it('should render correctly', async () => {
    await renderAppOptions({
      designable: true,
      schema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-acl-action': 'users:view',
        'x-decorator': 'GridCard.Decorator',
        'x-use-decorator-props': 'useGridCardBlockDecoratorProps',
        'x-decorator-props': {
          collection: 'users',
          dataSource: 'main',
          readPretty: true,
          action: 'list',
          params: {
            pageSize: 12,
          },
          runWhenParamsChanged: true,
          rowKey: 'id',
        },
        'x-component': 'div',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          actionBar: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 'var(--nb-spacing)',
              },
            },
            'x-app-version': '0.21.0-alpha.10',
          },
          list: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'array',
            'x-component': 'GridCard',
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              item: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'object',
                'x-component': 'GridCard.Item',
                'x-read-pretty': true,
                'x-use-component-props': 'useGridCardItemProps',
                'x-app-version': '0.21.0-alpha.10',
                properties: {
                  grid: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid',
                    'x-app-version': '0.21.0-alpha.10',
                    properties: {
                      b8r0aisveq3: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Grid.Row',
                        'x-app-version': '0.21.0-alpha.10',
                        properties: {
                          h3ycwb9e5qv: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid.Col',
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              id: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'string',
                                'x-component': 'CollectionField',
                                'x-decorator': 'FormItem',
                                'x-collection-field': 'users.id',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-app-version': '0.21.0-alpha.10',
                              },
                            },
                          },
                        },
                      },
                      ycbv8h4ymzy: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Grid.Row',
                        'x-app-version': '0.21.0-alpha.10',
                        properties: {
                          '2bz1mvhxhsw': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid.Col',
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              nickname: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'string',
                                'x-component': 'CollectionField',
                                'x-decorator': 'FormItem',
                                'x-collection-field': 'users.nickname',
                                'x-component-props': {},
                                'x-app-version': '0.21.0-alpha.10',
                              },
                            },
                          },
                        },
                      },
                      vd06ptpdvjd: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Grid.Row',
                        'x-app-version': '0.21.0-alpha.10',
                        properties: {
                          knl514ethip: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid.Col',
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              username: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'string',
                                'x-component': 'CollectionField',
                                'x-decorator': 'FormItem',
                                'x-collection-field': 'users.username',
                                'x-component-props': {},
                                'x-app-version': '0.21.0-alpha.10',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  actionBar: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-align': 'left',
                    'x-component': 'ActionBar',
                    'x-use-component-props': 'useGridCardActionBarProps',
                    'x-component-props': {
                      layout: 'one-column',
                    },
                    'x-app-version': '0.21.0-alpha.10',
                    properties: {
                      jquyomz6ipk: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        title: '{{ t("View") }}',
                        'x-action': 'view',
                        'x-component': 'Action.Link',
                        'x-component-props': {
                          openMode: 'drawer',
                        },
                        'x-align': 'left',
                        'x-app-version': '0.21.0-alpha.10',
                        properties: {
                          drawer: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("View record") }}',
                            'x-component': 'Action.Container',
                            'x-component-props': {
                              className: 'nb-action-popup',
                            },
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              tabs: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Tabs',
                                'x-component-props': {},
                                'x-app-version': '0.21.0-alpha.10',
                                properties: {
                                  tab1: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{t("Details")}}',
                                    'x-component': 'Tabs.TabPane',
                                    'x-designer': 'Tabs.Designer',
                                    'x-component-props': {},
                                    'x-app-version': '0.21.0-alpha.10',
                                    properties: {
                                      grid: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid',
                                        'x-app-version': '0.21.0-alpha.10',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      bc60nzpw94v: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        title: '{{ t("Edit") }}',
                        'x-action': 'update',
                        'x-component': 'Action.Link',
                        'x-component-props': {
                          openMode: 'drawer',
                          icon: 'EditOutlined',
                        },
                        'x-align': 'left',
                        'x-app-version': '0.21.0-alpha.10',
                        properties: {
                          drawer: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Edit record") }}',
                            'x-component': 'Action.Container',
                            'x-component-props': {
                              className: 'nb-action-popup',
                            },
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              tabs: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Tabs',
                                'x-component-props': {},
                                'x-app-version': '0.21.0-alpha.10',
                                properties: {
                                  tab1: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{t("Edit")}}',
                                    'x-component': 'Tabs.TabPane',
                                    'x-designer': 'Tabs.Designer',
                                    'x-component-props': {},
                                    'x-app-version': '0.21.0-alpha.10',
                                    properties: {
                                      grid: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid',
                                        'x-app-version': '0.21.0-alpha.10',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      appOptions: {
        plugins: [BlockSchemaComponentPlugin],
        scopes: {},
      },
    });

    await waitFor(() => {
      expect(screen.queryByText('ID')).toBeInTheDocument();
      expect(screen.queryByText('1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Nickname')).toBeInTheDocument();
    expect(screen.queryByText('Super Admin')).toBeInTheDocument();

    expect(screen.queryByText('Username')).toBeInTheDocument();
    expect(screen.queryByText('nocobase')).toBeInTheDocument();

    expect(screen.queryByText('View')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).toBeInTheDocument();

    await userEvent.click(screen.getByText('View'));

    await waitFor(() => {
      expect(screen.queryByRole('tab')).toHaveTextContent('Details');
    });
  });
});
