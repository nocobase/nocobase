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

describe('List', () => {
  it('should render correctly', async () => {
    await renderAppOptions({
      designable: true,
      schema: {
        type: 'void',
        'x-acl-action': 'users:view',
        'x-decorator': 'List.Decorator',
        'x-use-decorator-props': 'useListBlockDecoratorProps',
        'x-decorator-props': {
          collection: 'users',
          dataSource: 'main',
          readPretty: true,
          action: 'list',
          params: {
            pageSize: 10,
          },
          runWhenParamsChanged: true,
          rowKey: 'id',
        },
        'x-component': 'CardItem',
        'x-app-version': '0.21.0-alpha.10',
        properties: {
          actionBar: {
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
            type: 'array',
            'x-component': 'List',
            'x-app-version': '0.21.0-alpha.10',
            properties: {
              item: {
                type: 'object',
                'x-component': 'List.Item',
                'x-read-pretty': true,
                'x-use-component-props': 'useListItemProps',
                'x-app-version': '0.21.0-alpha.10',
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-app-version': '0.21.0-alpha.10',
                    properties: {
                      '48x3suuacem': {
                        type: 'void',
                        'x-component': 'Grid.Row',
                        'x-app-version': '0.21.0-alpha.10',
                        properties: {
                          z48z4iekhr0: {
                            type: 'void',
                            'x-component': 'Grid.Col',
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              id: {
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
                      afcj7ty3jkw: {
                        type: 'void',
                        'x-component': 'Grid.Row',
                        'x-app-version': '0.21.0-alpha.10',
                        properties: {
                          phs2rix7vvp: {
                            type: 'void',
                            'x-component': 'Grid.Col',
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              nickname: {
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
                    },
                  },
                  actionBar: {
                    type: 'void',
                    'x-align': 'left',
                    'x-component': 'ActionBar',
                    'x-use-component-props': 'useListActionBarProps',
                    'x-component-props': {
                      layout: 'one-column',
                    },
                    'x-app-version': '0.21.0-alpha.10',
                    properties: {
                      '7se3eremb6i': {
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
                            type: 'void',
                            title: '{{ t("View record") }}',
                            'x-component': 'Action.Container',
                            'x-component-props': {
                              className: 'nb-action-popup',
                            },
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              tabs: {
                                type: 'void',
                                'x-component': 'Tabs',
                                'x-component-props': {},
                                'x-app-version': '0.21.0-alpha.10',
                                properties: {
                                  tab1: {
                                    type: 'void',
                                    title: '{{t("Details")}}',
                                    'x-component': 'Tabs.TabPane',
                                    'x-designer': 'Tabs.Designer',
                                    'x-component-props': {},
                                    'x-app-version': '0.21.0-alpha.10',
                                    properties: {
                                      grid: {
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
                      og4zgn4noul: {
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
                            type: 'void',
                            title: '{{ t("Edit record") }}',
                            'x-component': 'Action.Container',
                            'x-component-props': {
                              className: 'nb-action-popup',
                            },
                            'x-app-version': '0.21.0-alpha.10',
                            properties: {
                              tabs: {
                                type: 'void',
                                'x-component': 'Tabs',
                                'x-component-props': {},
                                'x-app-version': '0.21.0-alpha.10',
                                properties: {
                                  tab1: {
                                    type: 'void',
                                    title: '{{t("Edit")}}',
                                    'x-component': 'Tabs.TabPane',
                                    'x-designer': 'Tabs.Designer',
                                    'x-component-props': {},
                                    'x-app-version': '0.21.0-alpha.10',
                                    properties: {
                                      grid: {
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
      const spanElements = screen.getAllByText('1');
      const firstSpanElement = spanElements.find((el) => el.tagName === 'SPAN');
      expect(firstSpanElement).toBeInTheDocument();
    });

    expect(screen.queryByText('Nickname')).toBeInTheDocument();
    expect(screen.queryByText('Super Admin')).toBeInTheDocument();

    expect(screen.queryByText('View')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).toBeInTheDocument();

    await userEvent.click(screen.getByText('View'));

    await waitFor(() => {
      expect(screen.queryByRole('tab')).toHaveTextContent('Details');
    });
  });
});
