import { PageConfig, generalWithMultiLevelM2oFields } from '@nocobase/test/e2e';

export const T2797: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      anaca99jfos: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          '921il71tsii': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              '6s5exwpw6k1': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  m1vdqkujhfd: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users:list',
                    'x-decorator-props': {
                      collection: 'users',
                      resource: 'users',
                      action: 'list',
                      params: {
                        pageSize: 20,
                        sort: ['id'],
                        filter: {},
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-index': 1,
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'table:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-index': 1,
                        'x-uid': 'ekut6r82rxy',
                        'x-async': false,
                      },
                      buql1oo309b: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
                        'x-component': 'TableV2',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                          useProps: '{{ useTableBlockProps }}',
                        },
                        'x-index': 2,
                        properties: {
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Actions") }}',
                            'x-action-column': 'actions',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-component': 'TableV2.Column',
                            'x-designer': 'TableV2.ActionColumnDesigner',
                            'x-initializer': 'table:configureItemActions',
                            'x-index': 1,
                            properties: {
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-index': 1,
                                properties: {
                                  xoem0ayb9dg: {
                                    'x-uid': 'x5h22i05z9y',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Popup drawer',
                                    'x-action': 'customize:popup',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
                                    },
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 1,
                                    properties: {
                                      drawer: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{ t("Popup") }}',
                                        'x-component': 'Action.Container',
                                        'x-component-props': {
                                          className: 'nb-action-popup',
                                        },
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-index': 1,
                                                    properties: {
                                                      uq6k35ibdum: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 1,
                                                        properties: {
                                                          gju15zbxua7: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-index': 1,
                                                            properties: {
                                                              '3gvctyne9ch': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'users:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: 'get',
                                                                  resource: 'users',
                                                                  collection: 'users',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                'x-index': 1,
                                                                properties: {
                                                                  rf52acn3z2h: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-index': 1,
                                                                        'x-uid': '1d3zru9pi2o',
                                                                        'x-async': false,
                                                                      },
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-index': 2,
                                                                        properties: {
                                                                          r5fvw6udpo5: {
                                                                            'x-uid': 'fhhipgvw969',
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            title: 'Popup drawer',
                                                                            'x-action': 'customize:popup',
                                                                            'x-designer': 'Action.Designer',
                                                                            'x-component': 'Action',
                                                                            'x-component-props': {
                                                                              openMode: 'drawer',
                                                                              danger: false,
                                                                              type: 'default',
                                                                            },
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              drawer: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: '{{ t("Popup") }}',
                                                                                'x-component': 'Action.Container',
                                                                                'x-component-props': {
                                                                                  className: 'nb-action-popup',
                                                                                },
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  tabs: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Tabs',
                                                                                    'x-component-props': {},
                                                                                    'x-initializer':
                                                                                      'TabPaneInitializers',
                                                                                    'x-index': 1,
                                                                                    properties: {
                                                                                      tab1: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        title: '{{t("Details")}}',
                                                                                        'x-component': 'Tabs.TabPane',
                                                                                        'x-designer': 'Tabs.Designer',
                                                                                        'x-component-props': {},
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'popup:common:addBlock',
                                                                                            'x-index': 1,
                                                                                            properties: {
                                                                                              i7919iug0zf: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                'x-index': 1,
                                                                                                properties: {
                                                                                                  fnfowdb69of: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    'x-index': 1,
                                                                                                    properties: {
                                                                                                      '7a1tbf51g8v': {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-acl-action-props':
                                                                                                          {
                                                                                                            skipScopeCheck:
                                                                                                              false,
                                                                                                          },
                                                                                                        'x-acl-action':
                                                                                                          'users:update',
                                                                                                        'x-decorator':
                                                                                                          'FormBlockProvider',
                                                                                                        'x-decorator-props':
                                                                                                          {
                                                                                                            useSourceId:
                                                                                                              '{{ useSourceIdFromParentRecord }}',
                                                                                                            useParams:
                                                                                                              '{{ useParamsFromRecord }}',
                                                                                                            action:
                                                                                                              'get',
                                                                                                            resource:
                                                                                                              'users',
                                                                                                            collection:
                                                                                                              'users',
                                                                                                          },
                                                                                                        'x-designer':
                                                                                                          'FormV2.Designer',
                                                                                                        'x-component':
                                                                                                          'CardItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-index': 1,
                                                                                                        properties: {
                                                                                                          nn34pmsspnz: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'FormV2',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                useProps:
                                                                                                                  '{{ useFormBlockProps }}',
                                                                                                              },
                                                                                                            'x-index': 1,
                                                                                                            properties:
                                                                                                              {
                                                                                                                grid: {
                                                                                                                  _isJSONSchemaObject:
                                                                                                                    true,
                                                                                                                  version:
                                                                                                                    '2.0',
                                                                                                                  type: 'void',
                                                                                                                  'x-component':
                                                                                                                    'Grid',
                                                                                                                  'x-initializer':
                                                                                                                    'form:configureFields',
                                                                                                                  'x-index': 1,
                                                                                                                  'x-uid':
                                                                                                                    'k9p2rqt49v1',
                                                                                                                  'x-async':
                                                                                                                    false,
                                                                                                                },
                                                                                                                actions:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-initializer':
                                                                                                                      'editForm:configureActions',
                                                                                                                    'x-component':
                                                                                                                      'ActionBar',
                                                                                                                    'x-component-props':
                                                                                                                      {
                                                                                                                        layout:
                                                                                                                          'one-column',
                                                                                                                        style:
                                                                                                                          {
                                                                                                                            marginTop: 24,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-index': 2,
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        m1d82kfi4wj:
                                                                                                                          {
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
                                                                                                                            'x-designer':
                                                                                                                              'Action.Designer',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                type: 'primary',
                                                                                                                                htmlType:
                                                                                                                                  'submit',
                                                                                                                                useProps:
                                                                                                                                  '{{ useUpdateActionProps }}',
                                                                                                                              },
                                                                                                                            'x-action-settings':
                                                                                                                              {
                                                                                                                                triggerWorkflows:
                                                                                                                                  [],
                                                                                                                              },
                                                                                                                            type: 'void',
                                                                                                                            'x-index': 1,
                                                                                                                            'x-uid':
                                                                                                                              '9mm8kvh4o2m',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'on41cr8zg41',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'y6uigc4n4vm',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'fnj75090iwa',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'y7t6l50j29g',
                                                                                                    'x-async': false,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'gcaxegx915j',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'oijx43exgjw',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'uss69qgzgfr',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'wo27pk5oaxl',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'ssukg1yq6xs',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'g6i2gve8d67',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'bmm6oo074xl',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': '46e0m820bo2',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': '1gvrltd8yqg',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': 'w97q3lbbsh4',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': '6l2ef5vge85',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'n4cpdx9ysfb',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'o06coc1mgwa',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': '7zj8405odj1',
                                        'x-async': false,
                                      },
                                    },
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'd72ecevv19r',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'dymj7cnulu9',
                            'x-async': false,
                          },
                          ehaaqzdovop: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-index': 2,
                            properties: {
                              id: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.id',
                                'x-component': 'CollectionField',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-index': 1,
                                'x-uid': '4xk1wkpwu0x',
                                'x-async': false,
                              },
                            },
                            'x-uid': '9kcdkg7zqss',
                            'x-async': false,
                          },
                        },
                        'x-uid': '8zzc49ye7c1',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'j5a3t93mc8y',
                    'x-async': false,
                  },
                },
                'x-uid': 'ngqxn545h2z',
                'x-async': false,
              },
            },
            'x-uid': 'qbwre8gvolh',
            'x-async': false,
          },
        },
        'x-uid': 'b9f5kb02zxd',
        'x-async': false,
      },
    },
    'x-uid': '6u34l9yf166',
    'x-async': true,
  },
};

export const T2838: PageConfig = {
  collections: generalWithMultiLevelM2oFields,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      gk0rcxdp7ci: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          ocvzef7y4nh: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              wgt31pysku3: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  e36qxkskmws: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-decorator-props': {
                      collection: 'general',
                      resource: 'general',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-index': 1,
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'table:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-index': 1,
                        'x-uid': '9g7iqgfistn',
                        'x-async': false,
                      },
                      ewrmbv48omq: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
                        'x-component': 'TableV2',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                          useProps: '{{ useTableBlockProps }}',
                        },
                        'x-index': 2,
                        properties: {
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Actions") }}',
                            'x-action-column': 'actions',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-component': 'TableV2.Column',
                            'x-designer': 'TableV2.ActionColumnDesigner',
                            'x-initializer': 'table:configureItemActions',
                            'x-index': 1,
                            properties: {
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-index': 1,
                                properties: {
                                  mxf2vugzynw: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Edit record',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'modal',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 1,
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
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Edit")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-index': 1,
                                                    properties: {
                                                      w9u8i9nzh10: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 1,
                                                        properties: {
                                                          iq0d99ing5f: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-index': 1,
                                                            properties: {
                                                              '8ng5a7gfnxu': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'general.m2oField0:get',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  resource: 'general.m2oField0',
                                                                  collection: 'm2oField1',
                                                                  association: 'general.m2oField0',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                                                'x-component': 'CardItem',
                                                                'x-index': 1,
                                                                properties: {
                                                                  xed9u6i5rke: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      actions: {
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
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          j8yl7ufxycc: {
                                                                            'x-uid': 't5zvkjpt399',
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            title: 'Edit button 1',
                                                                            'x-action': 'update',
                                                                            'x-designer': 'Action.Designer',
                                                                            'x-component': 'Action',
                                                                            'x-component-props': {
                                                                              openMode: 'modal',
                                                                              icon: 'EditOutlined',
                                                                              type: 'primary',
                                                                              danger: false,
                                                                            },
                                                                            'x-decorator': 'ACLActionProvider',
                                                                            'x-index': 1,
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
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  tabs: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Tabs',
                                                                                    'x-component-props': {},
                                                                                    'x-initializer':
                                                                                      'TabPaneInitializers',
                                                                                    'x-index': 1,
                                                                                    properties: {
                                                                                      tab1: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        title: '{{t("Edit")}}',
                                                                                        'x-component': 'Tabs.TabPane',
                                                                                        'x-designer': 'Tabs.Designer',
                                                                                        'x-component-props': {},
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'popup:common:addBlock',
                                                                                            'x-index': 1,
                                                                                            properties: {
                                                                                              nclrn6m8w40: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                'x-index': 1,
                                                                                                properties: {
                                                                                                  '986i76o9mkl': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    'x-index': 1,
                                                                                                    properties: {
                                                                                                      ofcetydqvzr: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-acl-action':
                                                                                                          'general.m2oField0:get',
                                                                                                        'x-decorator':
                                                                                                          'FormBlockProvider',
                                                                                                        'x-decorator-props':
                                                                                                          {
                                                                                                            resource:
                                                                                                              'general.m2oField0',
                                                                                                            collection:
                                                                                                              'm2oField1',
                                                                                                            association:
                                                                                                              'general.m2oField0',
                                                                                                            readPretty:
                                                                                                              true,
                                                                                                            action:
                                                                                                              'get',
                                                                                                            useParams:
                                                                                                              '{{ useParamsFromRecord }}',
                                                                                                            useSourceId:
                                                                                                              '{{ useSourceIdFromParentRecord }}',
                                                                                                          },
                                                                                                        'x-designer':
                                                                                                          'FormV2.ReadPrettyDesigner',
                                                                                                        'x-component':
                                                                                                          'CardItem',
                                                                                                        'x-index': 1,
                                                                                                        properties: {
                                                                                                          bt4u5tt1zeu: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'FormV2',
                                                                                                            'x-read-pretty':
                                                                                                              true,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                useProps:
                                                                                                                  '{{ useFormBlockProps }}',
                                                                                                              },
                                                                                                            'x-index': 1,
                                                                                                            properties:
                                                                                                              {
                                                                                                                actions:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-initializer':
                                                                                                                      'details:configureActions',
                                                                                                                    'x-component':
                                                                                                                      'ActionBar',
                                                                                                                    'x-component-props':
                                                                                                                      {
                                                                                                                        style:
                                                                                                                          {
                                                                                                                            marginBottom: 24,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-index': 1,
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        tt6sks0prnw:
                                                                                                                          {
                                                                                                                            'x-uid':
                                                                                                                              'pqbio7v3v18',
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            title:
                                                                                                                              'Edit button 2',
                                                                                                                            'x-action':
                                                                                                                              'update',
                                                                                                                            'x-designer':
                                                                                                                              'Action.Designer',
                                                                                                                            'x-component':
                                                                                                                              'Action',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                openMode:
                                                                                                                                  'drawer',
                                                                                                                                icon: 'EditOutlined',
                                                                                                                                type: 'primary',
                                                                                                                                danger:
                                                                                                                                  false,
                                                                                                                              },
                                                                                                                            'x-decorator':
                                                                                                                              'ACLActionProvider',
                                                                                                                            'x-index': 1,
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                drawer:
                                                                                                                                  {
                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                      true,
                                                                                                                                    version:
                                                                                                                                      '2.0',
                                                                                                                                    type: 'void',
                                                                                                                                    title:
                                                                                                                                      '{{ t("Edit record") }}',
                                                                                                                                    'x-component':
                                                                                                                                      'Action.Container',
                                                                                                                                    'x-component-props':
                                                                                                                                      {
                                                                                                                                        className:
                                                                                                                                          'nb-action-popup',
                                                                                                                                      },
                                                                                                                                    'x-index': 1,
                                                                                                                                    properties:
                                                                                                                                      {
                                                                                                                                        tabs: {
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'void',
                                                                                                                                          'x-component':
                                                                                                                                            'Tabs',
                                                                                                                                          'x-component-props':
                                                                                                                                            {},
                                                                                                                                          'x-initializer':
                                                                                                                                            'TabPaneInitializers',
                                                                                                                                          'x-index': 1,
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              tab1: {
                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                  true,
                                                                                                                                                version:
                                                                                                                                                  '2.0',
                                                                                                                                                type: 'void',
                                                                                                                                                title:
                                                                                                                                                  '{{t("Edit")}}',
                                                                                                                                                'x-component':
                                                                                                                                                  'Tabs.TabPane',
                                                                                                                                                'x-designer':
                                                                                                                                                  'Tabs.Designer',
                                                                                                                                                'x-component-props':
                                                                                                                                                  {},
                                                                                                                                                'x-index': 1,
                                                                                                                                                properties:
                                                                                                                                                  {
                                                                                                                                                    grid: {
                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                        true,
                                                                                                                                                      version:
                                                                                                                                                        '2.0',
                                                                                                                                                      type: 'void',
                                                                                                                                                      'x-component':
                                                                                                                                                        'Grid',
                                                                                                                                                      'x-initializer':
                                                                                                                                                        'popup:common:addBlock',
                                                                                                                                                      'x-index': 1,
                                                                                                                                                      properties:
                                                                                                                                                        {
                                                                                                                                                          '4xh2eecmles':
                                                                                                                                                            {
                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                true,
                                                                                                                                                              version:
                                                                                                                                                                '2.0',
                                                                                                                                                              type: 'void',
                                                                                                                                                              'x-component':
                                                                                                                                                                'Grid.Row',
                                                                                                                                                              'x-index': 1,
                                                                                                                                                              properties:
                                                                                                                                                                {
                                                                                                                                                                  '0lk0jurc203':
                                                                                                                                                                    {
                                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                                        true,
                                                                                                                                                                      version:
                                                                                                                                                                        '2.0',
                                                                                                                                                                      type: 'void',
                                                                                                                                                                      'x-component':
                                                                                                                                                                        'Grid.Col',
                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                      properties:
                                                                                                                                                                        {
                                                                                                                                                                          qxyhsdqsjnk:
                                                                                                                                                                            {
                                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                                true,
                                                                                                                                                                              version:
                                                                                                                                                                                '2.0',
                                                                                                                                                                              type: 'void',
                                                                                                                                                                              'x-acl-action-props':
                                                                                                                                                                                {
                                                                                                                                                                                  skipScopeCheck:
                                                                                                                                                                                    false,
                                                                                                                                                                                },
                                                                                                                                                                              'x-acl-action':
                                                                                                                                                                                'general.m2oField0:update',
                                                                                                                                                                              'x-decorator':
                                                                                                                                                                                'FormBlockProvider',
                                                                                                                                                                              'x-decorator-props':
                                                                                                                                                                                {
                                                                                                                                                                                  useSourceId:
                                                                                                                                                                                    '{{ useSourceIdFromParentRecord }}',
                                                                                                                                                                                  useParams:
                                                                                                                                                                                    '{{ useParamsFromRecord }}',
                                                                                                                                                                                  action:
                                                                                                                                                                                    'get',
                                                                                                                                                                                  resource:
                                                                                                                                                                                    'general.m2oField0',
                                                                                                                                                                                  collection:
                                                                                                                                                                                    'm2oField1',
                                                                                                                                                                                  association:
                                                                                                                                                                                    'general.m2oField0',
                                                                                                                                                                                },
                                                                                                                                                                              'x-designer':
                                                                                                                                                                                'FormV2.Designer',
                                                                                                                                                                              'x-component':
                                                                                                                                                                                'CardItem',
                                                                                                                                                                              'x-component-props':
                                                                                                                                                                                {},
                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                              properties:
                                                                                                                                                                                {
                                                                                                                                                                                  tzajxyqd9k3:
                                                                                                                                                                                    {
                                                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                                                        true,
                                                                                                                                                                                      version:
                                                                                                                                                                                        '2.0',
                                                                                                                                                                                      type: 'void',
                                                                                                                                                                                      'x-component':
                                                                                                                                                                                        'FormV2',
                                                                                                                                                                                      'x-component-props':
                                                                                                                                                                                        {
                                                                                                                                                                                          useProps:
                                                                                                                                                                                            '{{ useFormBlockProps }}',
                                                                                                                                                                                        },
                                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                                      properties:
                                                                                                                                                                                        {
                                                                                                                                                                                          grid: {
                                                                                                                                                                                            _isJSONSchemaObject:
                                                                                                                                                                                              true,
                                                                                                                                                                                            version:
                                                                                                                                                                                              '2.0',
                                                                                                                                                                                            type: 'void',
                                                                                                                                                                                            'x-component':
                                                                                                                                                                                              'Grid',
                                                                                                                                                                                            'x-initializer':
                                                                                                                                                                                              'form:configureFields',
                                                                                                                                                                                            'x-index': 1,
                                                                                                                                                                                            properties:
                                                                                                                                                                                              {
                                                                                                                                                                                                '1nzk8lmeo35':
                                                                                                                                                                                                  {
                                                                                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                                                                                      true,
                                                                                                                                                                                                    version:
                                                                                                                                                                                                      '2.0',
                                                                                                                                                                                                    type: 'void',
                                                                                                                                                                                                    'x-component':
                                                                                                                                                                                                      'Grid.Row',
                                                                                                                                                                                                    'x-index': 1,
                                                                                                                                                                                                    properties:
                                                                                                                                                                                                      {
                                                                                                                                                                                                        '0od1vb7dltp':
                                                                                                                                                                                                          {
                                                                                                                                                                                                            _isJSONSchemaObject:
                                                                                                                                                                                                              true,
                                                                                                                                                                                                            version:
                                                                                                                                                                                                              '2.0',
                                                                                                                                                                                                            type: 'void',
                                                                                                                                                                                                            'x-component':
                                                                                                                                                                                                              'Grid.Col',
                                                                                                                                                                                                            'x-index': 1,
                                                                                                                                                                                                            properties:
                                                                                                                                                                                                              {
                                                                                                                                                                                                                'm2oField1.m2oField2':
                                                                                                                                                                                                                  {
                                                                                                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                                                                                                      true,
                                                                                                                                                                                                                    version:
                                                                                                                                                                                                                      '2.0',
                                                                                                                                                                                                                    type: 'string',
                                                                                                                                                                                                                    'x-designer':
                                                                                                                                                                                                                      'FormItem.Designer',
                                                                                                                                                                                                                    'x-component':
                                                                                                                                                                                                                      'CollectionField',
                                                                                                                                                                                                                    'x-read-pretty':
                                                                                                                                                                                                                      true,
                                                                                                                                                                                                                    'x-component-props':
                                                                                                                                                                                                                      {
                                                                                                                                                                                                                        'pattern-disable':
                                                                                                                                                                                                                          true,
                                                                                                                                                                                                                        fieldNames:
                                                                                                                                                                                                                          {
                                                                                                                                                                                                                            label:
                                                                                                                                                                                                                              'id',
                                                                                                                                                                                                                            value:
                                                                                                                                                                                                                              'id',
                                                                                                                                                                                                                          },
                                                                                                                                                                                                                      },
                                                                                                                                                                                                                    'x-decorator':
                                                                                                                                                                                                                      'FormItem',
                                                                                                                                                                                                                    'x-collection-field':
                                                                                                                                                                                                                      'm2oField1.m2oField1.m2oField2',
                                                                                                                                                                                                                    'x-index': 1,
                                                                                                                                                                                                                    'x-uid':
                                                                                                                                                                                                                      'n3hj825kfud',
                                                                                                                                                                                                                    'x-async':
                                                                                                                                                                                                                      false,
                                                                                                                                                                                                                  },
                                                                                                                                                                                                              },
                                                                                                                                                                                                            'x-uid':
                                                                                                                                                                                                              '0kh8ua794y5',
                                                                                                                                                                                                            'x-async':
                                                                                                                                                                                                              false,
                                                                                                                                                                                                          },
                                                                                                                                                                                                      },
                                                                                                                                                                                                    'x-uid':
                                                                                                                                                                                                      'op5kvbrfosf',
                                                                                                                                                                                                    'x-async':
                                                                                                                                                                                                      false,
                                                                                                                                                                                                  },
                                                                                                                                                                                              },
                                                                                                                                                                                            'x-uid':
                                                                                                                                                                                              '3qpo7t4qeu1',
                                                                                                                                                                                            'x-async':
                                                                                                                                                                                              false,
                                                                                                                                                                                          },
                                                                                                                                                                                          actions:
                                                                                                                                                                                            {
                                                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                                                true,
                                                                                                                                                                                              version:
                                                                                                                                                                                                '2.0',
                                                                                                                                                                                              type: 'void',
                                                                                                                                                                                              'x-initializer':
                                                                                                                                                                                                'editForm:configureActions',
                                                                                                                                                                                              'x-component':
                                                                                                                                                                                                'ActionBar',
                                                                                                                                                                                              'x-component-props':
                                                                                                                                                                                                {
                                                                                                                                                                                                  layout:
                                                                                                                                                                                                    'one-column',
                                                                                                                                                                                                  style:
                                                                                                                                                                                                    {
                                                                                                                                                                                                      marginTop: 24,
                                                                                                                                                                                                    },
                                                                                                                                                                                                },
                                                                                                                                                                                              'x-index': 2,
                                                                                                                                                                                              properties:
                                                                                                                                                                                                {
                                                                                                                                                                                                  el9dzf2keqq:
                                                                                                                                                                                                    {
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
                                                                                                                                                                                                      'x-designer':
                                                                                                                                                                                                        'Action.Designer',
                                                                                                                                                                                                      'x-component-props':
                                                                                                                                                                                                        {
                                                                                                                                                                                                          type: 'primary',
                                                                                                                                                                                                          htmlType:
                                                                                                                                                                                                            'submit',
                                                                                                                                                                                                          useProps:
                                                                                                                                                                                                            '{{ useUpdateActionProps }}',
                                                                                                                                                                                                        },
                                                                                                                                                                                                      'x-action-settings':
                                                                                                                                                                                                        {
                                                                                                                                                                                                          triggerWorkflows:
                                                                                                                                                                                                            [],
                                                                                                                                                                                                        },
                                                                                                                                                                                                      type: 'void',
                                                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                                                      'x-uid':
                                                                                                                                                                                                        'gptcyd5atoh',
                                                                                                                                                                                                      'x-async':
                                                                                                                                                                                                        false,
                                                                                                                                                                                                    },
                                                                                                                                                                                                },
                                                                                                                                                                                              'x-uid':
                                                                                                                                                                                                'glo1qwk9c3h',
                                                                                                                                                                                              'x-async':
                                                                                                                                                                                                false,
                                                                                                                                                                                            },
                                                                                                                                                                                        },
                                                                                                                                                                                      'x-uid':
                                                                                                                                                                                        '97l65a4xla1',
                                                                                                                                                                                      'x-async':
                                                                                                                                                                                        false,
                                                                                                                                                                                    },
                                                                                                                                                                                },
                                                                                                                                                                              'x-uid':
                                                                                                                                                                                'vaa7w1uq7hz',
                                                                                                                                                                              'x-async':
                                                                                                                                                                                false,
                                                                                                                                                                            },
                                                                                                                                                                        },
                                                                                                                                                                      'x-uid':
                                                                                                                                                                        'o8ill8n44c1',
                                                                                                                                                                      'x-async':
                                                                                                                                                                        false,
                                                                                                                                                                    },
                                                                                                                                                                },
                                                                                                                                                              'x-uid':
                                                                                                                                                                '3eyyh9i881u',
                                                                                                                                                              'x-async':
                                                                                                                                                                false,
                                                                                                                                                            },
                                                                                                                                                        },
                                                                                                                                                      'x-uid':
                                                                                                                                                        'afrbgindhtc',
                                                                                                                                                      'x-async':
                                                                                                                                                        false,
                                                                                                                                                    },
                                                                                                                                                  },
                                                                                                                                                'x-uid':
                                                                                                                                                  'q45xug6fmaa',
                                                                                                                                                'x-async':
                                                                                                                                                  false,
                                                                                                                                              },
                                                                                                                                            },
                                                                                                                                          'x-uid':
                                                                                                                                            'nv8ngiz2t9g',
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                        },
                                                                                                                                      },
                                                                                                                                    'x-uid':
                                                                                                                                      'yn1oabiw8em',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'ag9hkuuvbf8',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                  },
                                                                                                                grid: {
                                                                                                                  _isJSONSchemaObject:
                                                                                                                    true,
                                                                                                                  version:
                                                                                                                    '2.0',
                                                                                                                  type: 'void',
                                                                                                                  'x-component':
                                                                                                                    'Grid',
                                                                                                                  'x-initializer':
                                                                                                                    'details:configureFields',
                                                                                                                  'x-index': 2,
                                                                                                                  'x-uid':
                                                                                                                    '1et421zrsz4',
                                                                                                                  'x-async':
                                                                                                                    false,
                                                                                                                },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'dd6b494mglm',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'ojkwzn3j25x',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '5grm3qde69i',
                                                                                                    'x-async': false,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'rnupfsm63cb',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'smqvz3oe3vp',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'kl0gn5nq2iu',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'nzvi02ku0k1',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'omhkk05odd6',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'mcb1580si22',
                                                                        'x-async': false,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        'x-index': 2,
                                                                        'x-uid': 'j4qxeoy1pqw',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'rgw0521c0xr',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': '5bjtdjcbleg',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': '83x4w7ehrui',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': '4ygad3n73lw',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'mqn8nmqjgbb',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'xv9bmd99krn',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': '08zjxet5wpu',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'aifb3prikr7',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'q8r8hehgfu2',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'gqb8kqcuxdz',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'vgh59kjigrk',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'aa4ttpf4a6q',
                        'x-async': false,
                      },
                    },
                    'x-uid': '33rp8vvjrs4',
                    'x-async': false,
                  },
                },
                'x-uid': 'c0w4ickkdgn',
                'x-async': false,
              },
            },
            'x-uid': 'yf8csupk88d',
            'x-async': false,
          },
        },
        'x-uid': 'vscfbf4v4tr',
        'x-async': false,
      },
    },
    'x-uid': 'nnrjne1lxzr',
    'x-async': true,
  },
};
