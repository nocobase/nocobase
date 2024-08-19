/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const kanbanURL = {
  collections: [
    {
      name: 'kanban',
      fields: [
        {
          name: 'select',
          interface: 'select',
          uiSchema: {
            enum: [
              {
                value: 'option1',
                label: 'Option1',
                color: 'red',
              },
              {
                value: 'option2',
                label: 'Option2',
                color: 'green',
              },
              {
                value: 'option3',
                label: 'Option3',
                color: 'blue',
              },
            ],
            type: 'string',
            'x-component': 'Select',
            title: 'Single select',
          },
        },
        {
          name: 'sort',
          interface: 'sort',
          scopeKey: 'select',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      eehnoq75dyp: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          qy13k7twlgr: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.0-alpha',
            properties: {
              z2zx32gyeno: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.0-alpha',
                properties: {
                  '6h3p53u5ek7': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'kanban:list',
                    'x-decorator': 'KanbanBlockProvider',
                    'x-decorator-props': {
                      collection: 'kanban',
                      dataSource: 'main',
                      action: 'list',
                      groupField: 'select',
                      sortField: 'sort',
                      params: {
                        paginate: false,
                        sort: ['sort'],
                      },
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:kanban',
                    'x-component': 'CardItem',
                    'x-app-version': '1.3.0-alpha',
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'kanban:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-app-version': '1.3.0-alpha',
                        'x-uid': 'zb0mo93az5z',
                        'x-async': false,
                        'x-index': 1,
                      },
                      ms2kyy843uc: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'Kanban',
                        'x-use-component-props': 'useKanbanBlockProps',
                        'x-app-version': '1.3.0-alpha',
                        properties: {
                          card: {
                            'x-uid': '1y1b9kliqui',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-read-pretty': true,
                            'x-label-disabled': true,
                            'x-decorator': 'BlockItem',
                            'x-component': 'Kanban.Card',
                            'x-component-props': {
                              openMode: 'drawer',
                            },
                            'x-designer': 'Kanban.Card.Designer',
                            'x-app-version': '1.3.0-alpha',
                            'x-action-context': {
                              dataSource: 'main',
                              collection: 'kanban',
                            },
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-component-props': {
                                  dndContext: false,
                                },
                                'x-app-version': '1.3.0-alpha',
                                properties: {
                                  '8evl3dcvt86': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    properties: {
                                      '36yop5rgpyi': {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        properties: {
                                          select: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-toolbar': 'FormItemSchemaToolbar',
                                            'x-settings': 'fieldSettings:FormItem',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'kanban.select',
                                            'x-component-props': {
                                              style: {
                                                width: '100%',
                                              },
                                            },
                                            'x-read-pretty': true,
                                            'x-uid': '8a20gaw8qdh',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'pzvcxvven6y',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'xd4gdx5j0qm',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'zx1rf8qfane',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                          cardViewer: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("View") }}',
                            'x-designer': 'Action.Designer',
                            'x-component': 'Kanban.CardViewer',
                            'x-action': 'view',
                            'x-component-props': {
                              openMode: 'drawer',
                            },
                            'x-app-version': '1.3.0-alpha',
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
                                'x-app-version': '1.3.0-alpha',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-app-version': '1.3.0-alpha',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Details")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.0-alpha',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:common:addBlock',
                                            'x-app-version': '1.3.0-alpha',
                                            properties: {
                                              '8bv7l5hiazu': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                'x-app-version': '1.3.0-alpha',
                                                properties: {
                                                  torszg5y5zd: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    'x-app-version': '1.3.0-alpha',
                                                    properties: {
                                                      d4p7lp86m03: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-acl-action': 'kanban:get',
                                                        'x-decorator': 'DetailsBlockProvider',
                                                        'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                        'x-decorator-props': {
                                                          dataSource: 'main',
                                                          collection: 'kanban',
                                                          readPretty: true,
                                                          action: 'get',
                                                        },
                                                        'x-toolbar': 'BlockSchemaToolbar',
                                                        'x-settings': 'blockSettings:details',
                                                        'x-component': 'CardItem',
                                                        'x-app-version': '1.3.0-alpha',
                                                        properties: {
                                                          '1oxl6q1ktkh': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Details',
                                                            'x-read-pretty': true,
                                                            'x-use-component-props': 'useDetailsProps',
                                                            'x-app-version': '1.3.0-alpha',
                                                            properties: {
                                                              r27t49cfoo5: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-initializer': 'details:configureActions',
                                                                'x-component': 'ActionBar',
                                                                'x-component-props': {
                                                                  style: {
                                                                    marginBottom: 24,
                                                                  },
                                                                },
                                                                'x-app-version': '1.3.0-alpha',
                                                                properties: {
                                                                  uya6ulpeavl: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    title: '{{ t("Edit") }}',
                                                                    'x-action': 'update',
                                                                    'x-toolbar': 'ActionSchemaToolbar',
                                                                    'x-settings': 'actionSettings:edit',
                                                                    'x-component': 'Action',
                                                                    'x-component-props': {
                                                                      openMode: 'drawer',
                                                                      icon: 'EditOutlined',
                                                                      type: 'primary',
                                                                    },
                                                                    'x-action-context': {
                                                                      dataSource: 'main',
                                                                      collection: 'kanban',
                                                                    },
                                                                    'x-decorator': 'ACLActionProvider',
                                                                    'x-app-version': '1.3.0-alpha',
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
                                                                        'x-app-version': '1.3.0-alpha',
                                                                        properties: {
                                                                          tabs: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Tabs',
                                                                            'x-component-props': {},
                                                                            'x-initializer': 'popup:addTab',
                                                                            'x-app-version': '1.3.0-alpha',
                                                                            properties: {
                                                                              tab1: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: '{{t("Edit")}}',
                                                                                'x-component': 'Tabs.TabPane',
                                                                                'x-designer': 'Tabs.Designer',
                                                                                'x-component-props': {},
                                                                                'x-app-version': '1.3.0-alpha',
                                                                                properties: {
                                                                                  grid: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Grid',
                                                                                    'x-initializer':
                                                                                      'popup:common:addBlock',
                                                                                    'x-app-version': '1.3.0-alpha',
                                                                                    properties: {
                                                                                      etzmlia85gh: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid.Row',
                                                                                        'x-app-version': '1.3.0-alpha',
                                                                                        properties: {
                                                                                          '6dn14wki0e5': {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Col',
                                                                                            'x-app-version':
                                                                                              '1.3.0-alpha',
                                                                                            properties: {
                                                                                              cruqx5ulnow: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-acl-action-props': {
                                                                                                  skipScopeCheck: false,
                                                                                                },
                                                                                                'x-acl-action':
                                                                                                  'kanban:update',
                                                                                                'x-decorator':
                                                                                                  'FormBlockProvider',
                                                                                                'x-use-decorator-props':
                                                                                                  'useEditFormBlockDecoratorProps',
                                                                                                'x-decorator-props': {
                                                                                                  action: 'get',
                                                                                                  dataSource: 'main',
                                                                                                  collection: 'kanban',
                                                                                                },
                                                                                                'x-toolbar':
                                                                                                  'BlockSchemaToolbar',
                                                                                                'x-settings':
                                                                                                  'blockSettings:editForm',
                                                                                                'x-component':
                                                                                                  'CardItem',
                                                                                                'x-app-version':
                                                                                                  '1.3.0-alpha',
                                                                                                properties: {
                                                                                                  y0q5ei7mma2: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'FormV2',
                                                                                                    'x-use-component-props':
                                                                                                      'useEditFormBlockProps',
                                                                                                    'x-app-version':
                                                                                                      '1.3.0-alpha',
                                                                                                    properties: {
                                                                                                      grid: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid',
                                                                                                        'x-initializer':
                                                                                                          'form:configureFields',
                                                                                                        'x-app-version':
                                                                                                          '1.3.0-alpha',
                                                                                                        properties: {
                                                                                                          rjbvqpp7xmu: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'Grid.Row',
                                                                                                            'x-app-version':
                                                                                                              '1.3.0-alpha',
                                                                                                            properties:
                                                                                                              {
                                                                                                                cxiykvzwfv1:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Grid.Col',
                                                                                                                    'x-app-version':
                                                                                                                      '1.3.0-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        select:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'string',
                                                                                                                            'x-toolbar':
                                                                                                                              'FormItemSchemaToolbar',
                                                                                                                            'x-settings':
                                                                                                                              'fieldSettings:FormItem',
                                                                                                                            'x-component':
                                                                                                                              'CollectionField',
                                                                                                                            'x-decorator':
                                                                                                                              'FormItem',
                                                                                                                            'x-collection-field':
                                                                                                                              'kanban.select',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                style:
                                                                                                                                  {
                                                                                                                                    width:
                                                                                                                                      '100%',
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-app-version':
                                                                                                                              '1.3.0-alpha',
                                                                                                                            'x-uid':
                                                                                                                              'eo2xh4adfaz',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'walnc8ivgzp',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              '3san45vkk32',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'opiixrhoo0z',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                      '5j12oi9pvf3': {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-initializer':
                                                                                                          'editForm:configureActions',
                                                                                                        'x-component':
                                                                                                          'ActionBar',
                                                                                                        'x-component-props':
                                                                                                          {
                                                                                                            layout:
                                                                                                              'one-column',
                                                                                                          },
                                                                                                        'x-app-version':
                                                                                                          '1.3.0-alpha',
                                                                                                        properties: {
                                                                                                          m9e7qxjys7o: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            title:
                                                                                                              '{{ t("Submit") }}',
                                                                                                            'x-action':
                                                                                                              'submit',
                                                                                                            'x-component':
                                                                                                              'Action',
                                                                                                            'x-use-component-props':
                                                                                                              'useUpdateActionProps',
                                                                                                            'x-toolbar':
                                                                                                              'ActionSchemaToolbar',
                                                                                                            'x-settings':
                                                                                                              'actionSettings:updateSubmit',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                type: 'primary',
                                                                                                                htmlType:
                                                                                                                  'submit',
                                                                                                              },
                                                                                                            'x-action-settings':
                                                                                                              {
                                                                                                                triggerWorkflows:
                                                                                                                  [],
                                                                                                              },
                                                                                                            type: 'void',
                                                                                                            'x-app-version':
                                                                                                              '1.3.0-alpha',
                                                                                                            'x-uid':
                                                                                                              '5sc8g3215j4',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '2v1zlgnh0lp',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 2,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'u5viek4cakp',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'z38sbx5yocb',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'y0wdbxagcre',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'dn2spxvle3x',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'fsmyjuyc0mc',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'x27vohz57u1',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'uxbmlytgowr',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'p108r8s8pjh',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'detjnjixd9n',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'i9622c7n8nv',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              grid: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Grid',
                                                                'x-initializer': 'details:configureFields',
                                                                'x-app-version': '1.3.0-alpha',
                                                                properties: {
                                                                  cylu3xjywvu: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    'x-app-version': '1.3.0-alpha',
                                                                    properties: {
                                                                      z1eb85u2n4n: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        'x-app-version': '1.3.0-alpha',
                                                                        properties: {
                                                                          select: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-toolbar': 'FormItemSchemaToolbar',
                                                                            'x-settings': 'fieldSettings:FormItem',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field': 'kanban.select',
                                                                            'x-component-props': {
                                                                              style: {
                                                                                width: '100%',
                                                                              },
                                                                            },
                                                                            'x-app-version': '1.3.0-alpha',
                                                                            'x-uid': 'mfz4c6l4ft9',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'lt4bp9emb4z',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'ny6e5q4fhww',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'yfunnpaf97c',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': 'pegqhin3s88',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'wpafritzh4d',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '2vjqy76fds6',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'avlvzb0yl0s',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'm5x3kz75nm2',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '6wb8grmdenj',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'uybfp4br16z',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '4dwpi8dug9d',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'x0dusy43fhl',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '6vpzr0nsxjs',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'f1eqli5bc07',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '4exwrzlac4i',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'edzxlnh6nx4',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 's95fpawrrle',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '57xhoz3sfzq',
    'x-async': true,
    'x-index': 1,
  },
};
