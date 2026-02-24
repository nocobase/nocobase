export const popupInEmbed = {
  collections: [
    {
      name: 'testEmbed',
      fields: [
        {
          name: 'title',
          interface: 'input',
        },
        {
          name: 'singleSelect',
          interface: 'select',
          uiSchema: {
            enum: [
              {
                value: 'option1',
                label: 'option1',
                color: 'red',
              },
              {
                value: 'option2',
                label: 'option2',
                color: 'magenta',
              },
              {
                value: 'option3',
                label: 'option3',
                color: 'volcano',
              },
            ],
            type: 'string',
            'x-component': 'Select',
            title: 'Single select',
          },
        },
        {
          name: 'singleSelect_sort',
          interface: 'sort',
          scopeKey: 'singleSelect',
          hidden: true,
          type: 'sort',
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
      '58wlotqs0d7': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          qmk33v0szm7: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              gzw6uh3sjh8: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  tsf8o92sjqv: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'testEmbed:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'testEmbed',
                      dataSource: 'main',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:table',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-app-version': '1.3.25-beta',
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
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          t7qr0t406zy: {
                            'x-uid': 'wmee3b4f69g',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: 'Add new table',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:addNew',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-component-props': {
                              openMode: 'drawer',
                              type: 'primary',
                              component: 'CreateRecordAction',
                              icon: 'PlusOutlined',
                              iconColor: '#1677FF',
                              danger: false,
                            },
                            'x-action-context': {
                              dataSource: 'main',
                              collection: 'testEmbed',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Add record") }}',
                                'x-component': 'Action.Container',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-initializer-props': {
                                      gridInitializer: 'popup:addNew:addBlock',
                                    },
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-app-version': '1.3.25-beta',
                                            'x-uid': '6ndssncjbjq',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '4e0hcyt90b3',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'gawyyq2fkr8',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'p3qksvmvxms',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'z0i3xqr72e2',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '8020bqwsshv': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
                        'x-component': 'TableV2',
                        'x-use-component-props': 'useTableBlockProps',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                        },
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Actions") }}',
                            'x-action-column': 'actions',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-component': 'TableV2.Column',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-initializer': 'table:configureItemActions',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-toolbar-props': {
                              initializer: 'table:configureItemActions',
                            },
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              tk7v9shfcgx: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  '89x7sfvtfeq': {
                                    'x-uid': 'glob8ps0lcg',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View table',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      iconColor: '#1677FF',
                                      danger: false,
                                    },
                                    'x-action-context': {
                                      dataSource: 'main',
                                      collection: 'testEmbed',
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
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
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'popup:addTab',
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-uid': 'agx85xurl49',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'xhemw7yg1gs',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '3xbuim1mrkt',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'ucicrhostuc',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'knm20qmje6t',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'lh35pgcl6ln',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'xwaq9kgeowg',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '5zp56w843mq',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'erzkb62gxom',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'j5d7w5af2j3',
            'x-async': false,
            'x-index': 1,
          },
          uoum5wldxz5: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              '0r4ouu3nzj6': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  rm7hfuw3y6w: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'testEmbed:view',
                    'x-decorator': 'DetailsBlockProvider',
                    'x-use-decorator-props': 'useDetailsWithPaginationDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'testEmbed',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 1,
                      },
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:detailsWithPagination',
                    'x-component': 'CardItem',
                    'x-app-version': '1.3.25-beta',
                    properties: {
                      '1zfd7kwe9a9': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Details',
                        'x-read-pretty': true,
                        'x-use-component-props': 'useDetailsWithPaginationProps',
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          '6a5i3o7n1ek': {
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
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              '1k39eg2mt8j': {
                                'x-uid': 'ijvr4phd5yt',
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: 'Edit details',
                                'x-action': 'update',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:edit',
                                'x-component': 'Action',
                                'x-component-props': {
                                  openMode: 'drawer',
                                  icon: 'EditOutlined',
                                  type: 'primary',
                                  iconColor: '#1677FF',
                                  danger: false,
                                },
                                'x-action-context': {
                                  dataSource: 'main',
                                  collection: 'testEmbed',
                                },
                                'x-decorator': 'ACLActionProvider',
                                'x-app-version': '1.3.25-beta',
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
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Edit")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.3.25-beta',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '1.3.25-beta',
                                                'x-uid': 'rkvfclyipq5',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '1ygjwdsjg48',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'b70vpdp6d04',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'q9sqer8hv8c',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '38vs46y93m9',
                            'x-async': false,
                            'x-index': 1,
                          },
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'details:configureFields',
                            'x-app-version': '1.3.25-beta',
                            'x-uid': 'kdf8ldrcj05',
                            'x-async': false,
                            'x-index': 2,
                          },
                          pagination: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Pagination',
                            'x-use-component-props': 'useDetailsPaginationProps',
                            'x-app-version': '1.3.25-beta',
                            'x-uid': 'zajn00lh8aj',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': '9n5oxrz7ryp',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'cxjow2zhubm',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'tmwk7741dkw',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'm2mjh0x7wv5',
            'x-async': false,
            'x-index': 2,
          },
          '6zqq4fy9goh': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              c7ut59tm0n4: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  '11ovnwpgyzt': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'testEmbed:view',
                    'x-decorator': 'List.Decorator',
                    'x-use-decorator-props': 'useListBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'testEmbed',
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
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:list',
                    'x-app-version': '1.3.25-beta',
                    properties: {
                      actionBar: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'list:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          dpojl94y09g: {
                            'x-uid': '3ms5h4r7w85',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: 'Add new list',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:addNew',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-component-props': {
                              openMode: 'drawer',
                              type: 'primary',
                              component: 'CreateRecordAction',
                              icon: 'PlusOutlined',
                              iconColor: '#1677FF',
                              danger: false,
                            },
                            'x-action-context': {
                              dataSource: 'main',
                              collection: 'testEmbed',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Add record") }}',
                                'x-component': 'Action.Container',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-initializer-props': {
                                      gridInitializer: 'popup:addNew:addBlock',
                                    },
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-app-version': '1.3.25-beta',
                                            'x-uid': 'e4skeigomjm',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'xizhkknviwy',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '3rxpl6mdix2',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'wabkzmdz8u1',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'gmj1nzd2lbb',
                        'x-async': false,
                        'x-index': 1,
                      },
                      list: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'List',
                        'x-use-component-props': 'useListBlockProps',
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          item: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'object',
                            'x-component': 'List.Item',
                            'x-read-pretty': true,
                            'x-use-component-props': 'useListItemProps',
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'details:configureFields',
                                'x-app-version': '1.3.25-beta',
                                'x-uid': 'vq9ori885yh',
                                'x-async': false,
                                'x-index': 1,
                              },
                              actionBar: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-align': 'left',
                                'x-initializer': 'list:configureItemActions',
                                'x-component': 'ActionBar',
                                'x-use-component-props': 'useListActionBarProps',
                                'x-component-props': {
                                  layout: 'one-column',
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  yv720q8m9ce: {
                                    'x-uid': '9onhue4tve5',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View list',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      iconColor: '#1677FF',
                                      danger: false,
                                    },
                                    'x-action-context': {
                                      dataSource: 'main',
                                      collection: 'testEmbed',
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-align': 'left',
                                    'x-app-version': '1.3.25-beta',
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
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'popup:addTab',
                                            'x-app-version': '1.3.25-beta',
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-app-version': '1.3.25-beta',
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-app-version': '1.3.25-beta',
                                                    'x-uid': '47fl1jqz36l',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '7abpo9bdwfw',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'zgh0t0fcwr2',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'x5e6qw2q6xf',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'e0ptpgobab2',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': '3xnounnjgik',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'n5cos59egpc',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'kb5veiwdkns',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'wwutaxmcriy',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'ux3qj858t0u',
            'x-async': false,
            'x-index': 3,
          },
          '5qh0zis8t75': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              w1ah6s0umy2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  tmjcb6zjalf: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'testEmbed:view',
                    'x-decorator': 'GridCard.Decorator',
                    'x-use-decorator-props': 'useGridCardBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'testEmbed',
                      dataSource: 'main',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 12,
                      },
                      runWhenParamsChanged: true,
                      rowKey: 'id',
                    },
                    'x-component': 'BlockItem',
                    'x-use-component-props': 'useGridCardBlockItemProps',
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:gridCard',
                    'x-app-version': '1.3.25-beta',
                    properties: {
                      actionBar: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'gridCard:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          '9pjmex4ipmu': {
                            'x-uid': '3xjf5m275zr',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: 'Add new grid card',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:addNew',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-component-props': {
                              openMode: 'drawer',
                              type: 'primary',
                              component: 'CreateRecordAction',
                              icon: 'PlusOutlined',
                              iconColor: '#1677FF',
                              danger: false,
                            },
                            'x-action-context': {
                              dataSource: 'main',
                              collection: 'testEmbed',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Add record") }}',
                                'x-component': 'Action.Container',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-initializer-props': {
                                      gridInitializer: 'popup:addNew:addBlock',
                                    },
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-app-version': '1.3.25-beta',
                                            'x-uid': 'lhqf0txp0g7',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'itzug0uikus',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'a4wyblefj83',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'b3h62oa2mfg',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'xh1k7k3se5k',
                        'x-async': false,
                        'x-index': 1,
                      },
                      list: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'GridCard',
                        'x-use-component-props': 'useGridCardBlockProps',
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          item: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'object',
                            'x-component': 'GridCard.Item',
                            'x-read-pretty': true,
                            'x-use-component-props': 'useGridCardItemProps',
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'details:configureFields',
                                'x-app-version': '1.3.25-beta',
                                'x-uid': 'p08isgq7yos',
                                'x-async': false,
                                'x-index': 1,
                              },
                              actionBar: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-align': 'left',
                                'x-initializer': 'gridCard:configureItemActions',
                                'x-component': 'ActionBar',
                                'x-use-component-props': 'useGridCardActionBarProps',
                                'x-component-props': {
                                  layout: 'one-column',
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  v89ej7oiu9k: {
                                    'x-uid': '2my91gnfbte',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View grid card',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      iconColor: '#1677FF',
                                      danger: false,
                                    },
                                    'x-action-context': {
                                      dataSource: 'main',
                                      collection: 'testEmbed',
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-align': 'left',
                                    'x-app-version': '1.3.25-beta',
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
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'popup:addTab',
                                            'x-app-version': '1.3.25-beta',
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-app-version': '1.3.25-beta',
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-app-version': '1.3.25-beta',
                                                    'x-uid': 'mjfwhfhly64',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'mfioxsvym5f',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ptuavayl6wj',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'm370ydz9xvu',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'cocvfw2ljeg',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'c8fl85xgns4',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'b26inm21nyj',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'viv0e8lkvcn',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '6op4joxjyne',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'smou43no4z5',
            'x-async': false,
            'x-index': 4,
          },
          jq5d2m2o3tf: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              ud4senq47vb: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  gmk9pwft22n: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'testEmbed:list',
                    'x-decorator': 'CalendarBlockProvider',
                    'x-use-decorator-props': 'useCalendarBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'testEmbed',
                      dataSource: 'main',
                      action: 'list',
                      fieldNames: {
                        id: 'id',
                        start: 'createdAt',
                        title: 'title',
                      },
                      params: {
                        paginate: false,
                      },
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:calendar',
                    'x-component': 'CardItem',
                    'x-app-version': '1.3.25-beta',
                    properties: {
                      '6atwpohun1k': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'CalendarV2',
                        'x-use-component-props': 'useCalendarBlockProps',
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          toolBar: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'CalendarV2.ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 24,
                              },
                            },
                            'x-initializer': 'calendar:configureActions',
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              qs0urxbl17o: {
                                'x-uid': 'sja45ht0xus',
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-action': 'create',
                                'x-acl-action': 'create',
                                title: 'Add new calendar',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:addNew',
                                'x-component': 'Action',
                                'x-decorator': 'ACLActionProvider',
                                'x-component-props': {
                                  openMode: 'drawer',
                                  type: 'primary',
                                  component: 'CreateRecordAction',
                                  icon: 'PlusOutlined',
                                  iconColor: '#1677FF',
                                  danger: false,
                                },
                                'x-action-context': {
                                  dataSource: 'main',
                                  collection: 'testEmbed',
                                },
                                'x-align': 'right',
                                'x-acl-action-props': {
                                  skipScopeCheck: true,
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  drawer: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Add record") }}',
                                    'x-component': 'Action.Container',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-initializer-props': {
                                          gridInitializer: 'popup:addNew:addBlock',
                                        },
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Add new")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.3.25-beta',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:addNew:addBlock',
                                                'x-app-version': '1.3.25-beta',
                                                'x-uid': 'fptvx5kysag',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'wie0k52pv2l',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '46g9d7lffkv',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'puytgjqnyuh',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'z9t2jkoaaov',
                            'x-async': false,
                            'x-index': 1,
                          },
                          event: {
                            'x-uid': '683xyqbq0m4',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'CalendarV2.Event',
                            'x-app-version': '1.3.25-beta',
                            'x-action-context': {
                              dataSource: 'main',
                              collection: 'testEmbed',
                            },
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Action.Container',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                title: "{{t('View record', { ns: 'calendar' })}}",
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-initializer-props': {
                                      gridInitializer: 'popup:common:addBlock',
                                    },
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: "{{t('Details', { ns: 'calendar' })}}",
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer-props': {
                                              actionInitializers: 'details:configureActions',
                                            },
                                            'x-initializer': 'popup:common:addBlock',
                                            'x-app-version': '1.3.25-beta',
                                            'x-uid': 'gkq3eu1lebf',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '7ud5o0zdz90',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'f945oat8ms8',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '87n6w7z0b8u',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'rngthcu1zzr',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'ysfrijicmju',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'g0in49jwz0x',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'z7gp78k8uye',
            'x-async': false,
            'x-index': 5,
          },
          '6e9u1avnwiw': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              qh9wttcxzis: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  b8rhh00ehzg: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'testEmbed:list',
                    'x-decorator': 'GanttBlockProvider',
                    'x-decorator-props': {
                      collection: 'testEmbed',
                      dataSource: 'main',
                      action: 'list',
                      fieldNames: {
                        start: 'createdAt',
                        range: 'day',
                        title: 'title',
                        end: 'updatedAt',
                      },
                      params: {
                        paginate: false,
                      },
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:gantt',
                    'x-component': 'CardItem',
                    'x-app-version': '1.3.25-beta',
                    properties: {
                      x8z4oflmcqk: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Gantt',
                        'x-use-component-props': 'useGanttBlockProps',
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          toolBar: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 24,
                              },
                            },
                            'x-initializer': 'gantt:configureActions',
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              '8yht0k9j48l': {
                                'x-uid': '1netok8opt5',
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-action': 'create',
                                'x-acl-action': 'create',
                                title: 'Add new gantt',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:addNew',
                                'x-component': 'Action',
                                'x-decorator': 'ACLActionProvider',
                                'x-component-props': {
                                  openMode: 'drawer',
                                  type: 'primary',
                                  component: 'CreateRecordAction',
                                  icon: 'PlusOutlined',
                                  iconColor: '#1677FF',
                                  danger: false,
                                },
                                'x-action-context': {
                                  dataSource: 'main',
                                  collection: 'testEmbed',
                                },
                                'x-align': 'right',
                                'x-acl-action-props': {
                                  skipScopeCheck: true,
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  drawer: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Add record") }}',
                                    'x-component': 'Action.Container',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-initializer-props': {
                                          gridInitializer: 'popup:addNew:addBlock',
                                        },
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Add new")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.3.25-beta',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:addNew:addBlock',
                                                'x-app-version': '1.3.25-beta',
                                                'x-uid': 'j4v66bt4vai',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'y4mg1j25em3',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'zptsq73i4gg',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '7xz4cqqtydf',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'xbhiw58fquo',
                            'x-async': false,
                            'x-index': 1,
                          },
                          table: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'array',
                            'x-decorator': 'div',
                            'x-decorator-props': {
                              style: {
                                float: 'left',
                                maxWidth: '35%',
                              },
                            },
                            'x-initializer': 'table:configureColumns',
                            'x-component': 'TableV2',
                            'x-use-component-props': 'useTableBlockProps',
                            'x-component-props': {
                              rowKey: 'id',
                              rowSelection: {
                                type: 'checkbox',
                              },
                              pagination: false,
                            },
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Actions") }}',
                                'x-action-column': 'actions',
                                'x-decorator': 'TableV2.Column.ActionBar',
                                'x-component': 'TableV2.Column',
                                'x-toolbar': 'TableColumnSchemaToolbar',
                                'x-initializer': 'table:configureItemActions',
                                'x-settings': 'fieldSettings:TableColumn',
                                'x-toolbar-props': {
                                  initializer: 'table:configureItemActions',
                                },
                                'x-app-version': '1.3.25-beta',
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
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      ktgiiv6v0z1: {
                                        'x-uid': '8detamb110q',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: 'View gantt',
                                        'x-action': 'view',
                                        'x-toolbar': 'ActionSchemaToolbar',
                                        'x-settings': 'actionSettings:view',
                                        'x-component': 'Action.Link',
                                        'x-component-props': {
                                          openMode: 'drawer',
                                          iconColor: '#1677FF',
                                          danger: false,
                                        },
                                        'x-action-context': {
                                          dataSource: 'main',
                                          collection: 'testEmbed',
                                        },
                                        'x-decorator': 'ACLActionProvider',
                                        'x-designer-props': {
                                          linkageAction: true,
                                        },
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
                                            properties: {
                                              tabs: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Tabs',
                                                'x-component-props': {},
                                                'x-initializer': 'popup:addTab',
                                                properties: {
                                                  tab1: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    title: '{{t("Details")}}',
                                                    'x-component': 'Tabs.TabPane',
                                                    'x-designer': 'Tabs.Designer',
                                                    'x-component-props': {},
                                                    properties: {
                                                      grid: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid',
                                                        'x-initializer': 'popup:common:addBlock',
                                                        'x-uid': 'bilshc10agx',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'b19k4estjom',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'w86610kl0rr',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'uacgk8hjlyc',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'it1g4m187aw',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'uq0te8lko91',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'x1bfgt3qiyj',
                            'x-async': false,
                            'x-index': 2,
                          },
                          detail: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Gantt.Event',
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Action.Drawer',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                title: '{{ t("View record") }}',
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Details")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:common:addBlock',
                                            'x-app-version': '1.3.25-beta',
                                            'x-uid': 'hmqhqh2dp6p',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'efy735qkgfp',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'vao9lesayo3',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '588kj3tnx47',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '28m938e8cqx',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': '8r14pjut8b9',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '1a3r273qahu',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '2spkuk32ld5',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 's1j1f6f5g4i',
            'x-async': false,
            'x-index': 6,
          },
          ig0yvpso9mq: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              scl9l6x86cd: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  zd4xqm4wnc3: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'testEmbed:list',
                    'x-decorator': 'KanbanBlockProvider',
                    'x-decorator-props': {
                      collection: 'testEmbed',
                      dataSource: 'main',
                      action: 'list',
                      groupField: 'singleSelect',
                      sortField: 'singleSelect_sort',
                      params: {
                        paginate: false,
                        sort: ['singleSelect_sort'],
                      },
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:kanban',
                    'x-component': 'CardItem',
                    'x-app-version': '1.3.25-beta',
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
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          vil8h1w26wu: {
                            'x-uid': '6zxmnsqkvys',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: 'Add new kanban',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:addNew',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-component-props': {
                              openMode: 'drawer',
                              type: 'primary',
                              component: 'CreateRecordAction',
                              icon: 'PlusOutlined',
                              iconColor: '#1677FF',
                              danger: false,
                            },
                            'x-action-context': {
                              dataSource: 'main',
                              collection: 'testEmbed',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Add record") }}',
                                'x-component': 'Action.Container',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-initializer-props': {
                                      gridInitializer: 'popup:addNew:addBlock',
                                    },
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-app-version': '1.3.25-beta',
                                            'x-uid': '1kxikqiymcp',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '31q2hpgcgfq',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'cyco8nbgu90',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '506ttb9d9jo',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'wnd8vzh89r0',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pa3xg5ednxp: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'Kanban',
                        'x-use-component-props': 'useKanbanBlockProps',
                        'x-app-version': '1.3.25-beta',
                        properties: {
                          card: {
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
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-component-props': {
                                  dndContext: false,
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  x1k5bonstcf: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    properties: {
                                      h4bqzcm1dnh: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        properties: {
                                          title: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-toolbar': 'FormItemSchemaToolbar',
                                            'x-settings': 'fieldSettings:FormItem',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'testEmbed.title',
                                            'x-component-props': {},
                                            'x-read-pretty': true,
                                            'x-uid': '1cv5d3r8nva',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '0h4stxpe634',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'b33a6mn2h9v',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'tzi4d2duy6u',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'gswhqslwvt4',
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
                            'x-app-version': '1.3.25-beta',
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
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-app-version': '1.3.25-beta',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Details")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.25-beta',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:common:addBlock',
                                            'x-app-version': '1.3.25-beta',
                                            'x-uid': 'dzar35rjddw',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'i0ivi6rys7s',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '0nqtaid24eg',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'pdbazl6zout',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'smxu8iljcjc',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'kjxlyg4aca5',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'gxs15rr1lrb',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'gnt4r7vyjiz',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '826kujlb2yr',
            'x-async': false,
            'x-index': 7,
          },
        },
        'x-uid': 'q4e0ripr3no',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'azco21q3to8',
    'x-async': true,
    'x-index': 1,
  },
  keepUid: true,
};

export const shouldCanOpenSubpageInEmbed = {
  keepUid: true,
  pageSchema: {
    "_isJSONSchemaObject": true,
    "version": "2.0",
    "type": "void",
    "x-component": "Page",
    "properties": {
      "6qaimrwtn2v": {
        "_isJSONSchemaObject": true,
        "version": "2.0",
        "type": "void",
        "x-component": "Grid",
        "x-initializer": "page:addBlock",
        "properties": {
          "pxtib747gx4": {
            "_isJSONSchemaObject": true,
            "version": "2.0",
            "type": "void",
            "x-component": "Grid.Row",
            "x-app-version": "1.3.25-beta",
            "properties": {
              "4nz2wo8bwjg": {
                "_isJSONSchemaObject": true,
                "version": "2.0",
                "type": "void",
                "x-component": "Grid.Col",
                "x-app-version": "1.3.25-beta",
                "properties": {
                  "x6mesl068he": {
                    "_isJSONSchemaObject": true,
                    "version": "2.0",
                    "type": "void",
                    "x-decorator": "TableBlockProvider",
                    "x-acl-action": "users:list",
                    "x-use-decorator-props": "useTableBlockDecoratorProps",
                    "x-decorator-props": {
                      "collection": "users",
                      "dataSource": "main",
                      "action": "list",
                      "params": {
                        "pageSize": 20
                      },
                      "rowKey": "id",
                      "showIndex": true,
                      "dragSort": false
                    },
                    "x-toolbar": "BlockSchemaToolbar",
                    "x-settings": "blockSettings:table",
                    "x-component": "CardItem",
                    "x-filter-targets": [],
                    "x-app-version": "1.3.25-beta",
                    "properties": {
                      "actions": {
                        "_isJSONSchemaObject": true,
                        "version": "2.0",
                        "type": "void",
                        "x-initializer": "table:configureActions",
                        "x-component": "ActionBar",
                        "x-component-props": {
                          "style": {
                            "marginBottom": "var(--nb-spacing)"
                          }
                        },
                        "x-app-version": "1.3.25-beta",
                        "x-uid": "g4dwa7529ad",
                        "x-async": false,
                        "x-index": 1
                      },
                      "jtq09noe4h5": {
                        "_isJSONSchemaObject": true,
                        "version": "2.0",
                        "type": "array",
                        "x-initializer": "table:configureColumns",
                        "x-component": "TableV2",
                        "x-use-component-props": "useTableBlockProps",
                        "x-component-props": {
                          "rowKey": "id",
                          "rowSelection": {
                            "type": "checkbox"
                          }
                        },
                        "x-app-version": "1.3.25-beta",
                        "properties": {
                          "actions": {
                            "_isJSONSchemaObject": true,
                            "version": "2.0",
                            "type": "void",
                            "title": "{{ t(\"Actions\") }}",
                            "x-action-column": "actions",
                            "x-decorator": "TableV2.Column.ActionBar",
                            "x-component": "TableV2.Column",
                            "x-toolbar": "TableColumnSchemaToolbar",
                            "x-initializer": "table:configureItemActions",
                            "x-settings": "fieldSettings:TableColumn",
                            "x-toolbar-props": {
                              "initializer": "table:configureItemActions"
                            },
                            "x-app-version": "1.3.25-beta",
                            "properties": {
                              "ui6sareq1ka": {
                                "_isJSONSchemaObject": true,
                                "version": "2.0",
                                "type": "void",
                                "x-decorator": "DndContext",
                                "x-component": "Space",
                                "x-component-props": {
                                  "split": "|"
                                },
                                "x-app-version": "1.3.25-beta",
                                "properties": {
                                  "dt5d19iqa6r": {
                                    "x-uid": "4v44nlyhmme",
                                    "_isJSONSchemaObject": true,
                                    "version": "2.0",
                                    "type": "void",
                                    "title": "open subpage level 1",
                                    "x-action": "view",
                                    "x-toolbar": "ActionSchemaToolbar",
                                    "x-settings": "actionSettings:view",
                                    "x-component": "Action.Link",
                                    "x-component-props": {
                                      "openMode": "page",
                                      "iconColor": "#1677FF",
                                      "danger": false
                                    },
                                    "x-action-context": {
                                      "dataSource": "main",
                                      "collection": "users"
                                    },
                                    "x-decorator": "ACLActionProvider",
                                    "x-designer-props": {
                                      "linkageAction": true
                                    },
                                    "properties": {
                                      "drawer": {
                                        "_isJSONSchemaObject": true,
                                        "version": "2.0",
                                        "type": "void",
                                        "title": "{{ t(\"View record\") }}",
                                        "x-component": "Action.Container",
                                        "x-component-props": {
                                          "className": "nb-action-popup"
                                        },
                                        "properties": {
                                          "tabs": {
                                            "_isJSONSchemaObject": true,
                                            "version": "2.0",
                                            "type": "void",
                                            "x-component": "Tabs",
                                            "x-component-props": {},
                                            "x-initializer": "popup:addTab",
                                            "properties": {
                                              "tab1": {
                                                "_isJSONSchemaObject": true,
                                                "version": "2.0",
                                                "type": "void",
                                                "title": "{{t(\"Details\")}}",
                                                "x-component": "Tabs.TabPane",
                                                "x-designer": "Tabs.Designer",
                                                "x-component-props": {},
                                                "properties": {
                                                  "grid": {
                                                    "_isJSONSchemaObject": true,
                                                    "version": "2.0",
                                                    "type": "void",
                                                    "x-component": "Grid",
                                                    "x-initializer": "popup:common:addBlock",
                                                    "properties": {
                                                      "qlwpn3visub": {
                                                        "_isJSONSchemaObject": true,
                                                        "version": "2.0",
                                                        "type": "void",
                                                        "x-component": "Grid.Row",
                                                        "x-app-version": "1.3.25-beta",
                                                        "properties": {
                                                          "ess8ma5ojfr": {
                                                            "_isJSONSchemaObject": true,
                                                            "version": "2.0",
                                                            "type": "void",
                                                            "x-component": "Grid.Col",
                                                            "x-app-version": "1.3.25-beta",
                                                            "properties": {
                                                              "v6j9dxqnimh": {
                                                                "_isJSONSchemaObject": true,
                                                                "version": "2.0",
                                                                "type": "void",
                                                                "x-decorator": "TableBlockProvider",
                                                                "x-acl-action": "users:list",
                                                                "x-use-decorator-props": "useTableBlockDecoratorProps",
                                                                "x-decorator-props": {
                                                                  "collection": "users",
                                                                  "dataSource": "main",
                                                                  "action": "list",
                                                                  "params": {
                                                                    "pageSize": 20
                                                                  },
                                                                  "rowKey": "id",
                                                                  "showIndex": true,
                                                                  "dragSort": false
                                                                },
                                                                "x-toolbar": "BlockSchemaToolbar",
                                                                "x-settings": "blockSettings:table",
                                                                "x-component": "CardItem",
                                                                "x-filter-targets": [],
                                                                "x-app-version": "1.3.25-beta",
                                                                "properties": {
                                                                  "actions": {
                                                                    "_isJSONSchemaObject": true,
                                                                    "version": "2.0",
                                                                    "type": "void",
                                                                    "x-initializer": "table:configureActions",
                                                                    "x-component": "ActionBar",
                                                                    "x-component-props": {
                                                                      "style": {
                                                                        "marginBottom": "var(--nb-spacing)"
                                                                      }
                                                                    },
                                                                    "x-app-version": "1.3.25-beta",
                                                                    "x-uid": "0eakcrr97nq",
                                                                    "x-async": false,
                                                                    "x-index": 1
                                                                  },
                                                                  "siluwoyq8kd": {
                                                                    "_isJSONSchemaObject": true,
                                                                    "version": "2.0",
                                                                    "type": "array",
                                                                    "x-initializer": "table:configureColumns",
                                                                    "x-component": "TableV2",
                                                                    "x-use-component-props": "useTableBlockProps",
                                                                    "x-component-props": {
                                                                      "rowKey": "id",
                                                                      "rowSelection": {
                                                                        "type": "checkbox"
                                                                      }
                                                                    },
                                                                    "x-app-version": "1.3.25-beta",
                                                                    "properties": {
                                                                      "actions": {
                                                                        "_isJSONSchemaObject": true,
                                                                        "version": "2.0",
                                                                        "type": "void",
                                                                        "title": "{{ t(\"Actions\") }}",
                                                                        "x-action-column": "actions",
                                                                        "x-decorator": "TableV2.Column.ActionBar",
                                                                        "x-component": "TableV2.Column",
                                                                        "x-toolbar": "TableColumnSchemaToolbar",
                                                                        "x-initializer": "table:configureItemActions",
                                                                        "x-settings": "fieldSettings:TableColumn",
                                                                        "x-toolbar-props": {
                                                                          "initializer": "table:configureItemActions"
                                                                        },
                                                                        "x-app-version": "1.3.25-beta",
                                                                        "properties": {
                                                                          "51s1mj3xj3z": {
                                                                            "_isJSONSchemaObject": true,
                                                                            "version": "2.0",
                                                                            "type": "void",
                                                                            "x-decorator": "DndContext",
                                                                            "x-component": "Space",
                                                                            "x-component-props": {
                                                                              "split": "|"
                                                                            },
                                                                            "x-app-version": "1.3.25-beta",
                                                                            "properties": {
                                                                              "6qo3eo0vy8v": {
                                                                                "x-uid": "kp2q0t1qifu",
                                                                                "_isJSONSchemaObject": true,
                                                                                "version": "2.0",
                                                                                "type": "void",
                                                                                "title": "open subpage level 2",
                                                                                "x-action": "view",
                                                                                "x-toolbar": "ActionSchemaToolbar",
                                                                                "x-settings": "actionSettings:view",
                                                                                "x-component": "Action.Link",
                                                                                "x-component-props": {
                                                                                  "openMode": "page",
                                                                                  "iconColor": "#1677FF",
                                                                                  "danger": false
                                                                                },
                                                                                "x-action-context": {
                                                                                  "dataSource": "main",
                                                                                  "collection": "users"
                                                                                },
                                                                                "x-decorator": "ACLActionProvider",
                                                                                "x-designer-props": {
                                                                                  "linkageAction": true
                                                                                },
                                                                                "properties": {
                                                                                  "drawer": {
                                                                                    "_isJSONSchemaObject": true,
                                                                                    "version": "2.0",
                                                                                    "type": "void",
                                                                                    "title": "{{ t(\"View record\") }}",
                                                                                    "x-component": "Action.Container",
                                                                                    "x-component-props": {
                                                                                      "className": "nb-action-popup"
                                                                                    },
                                                                                    "properties": {
                                                                                      "tabs": {
                                                                                        "_isJSONSchemaObject": true,
                                                                                        "version": "2.0",
                                                                                        "type": "void",
                                                                                        "x-component": "Tabs",
                                                                                        "x-component-props": {},
                                                                                        "x-initializer": "popup:addTab",
                                                                                        "properties": {
                                                                                          "tab1": {
                                                                                            "_isJSONSchemaObject": true,
                                                                                            "version": "2.0",
                                                                                            "type": "void",
                                                                                            "title": "{{t(\"Details\")}}",
                                                                                            "x-component": "Tabs.TabPane",
                                                                                            "x-designer": "Tabs.Designer",
                                                                                            "x-component-props": {},
                                                                                            "properties": {
                                                                                              "grid": {
                                                                                                "_isJSONSchemaObject": true,
                                                                                                "version": "2.0",
                                                                                                "type": "void",
                                                                                                "x-component": "Grid",
                                                                                                "x-initializer": "popup:common:addBlock",
                                                                                                "properties": {
                                                                                                  "0uvruf2ckno": {
                                                                                                    "_isJSONSchemaObject": true,
                                                                                                    "version": "2.0",
                                                                                                    "type": "void",
                                                                                                    "x-component": "Grid.Row",
                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                    "properties": {
                                                                                                      "3whjqgs3ho2": {
                                                                                                        "_isJSONSchemaObject": true,
                                                                                                        "version": "2.0",
                                                                                                        "type": "void",
                                                                                                        "x-component": "Grid.Col",
                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                        "properties": {
                                                                                                          "225pg9aamyl": {
                                                                                                            "_isJSONSchemaObject": true,
                                                                                                            "version": "2.0",
                                                                                                            "type": "void",
                                                                                                            "x-decorator": "TableBlockProvider",
                                                                                                            "x-acl-action": "users:list",
                                                                                                            "x-use-decorator-props": "useTableBlockDecoratorProps",
                                                                                                            "x-decorator-props": {
                                                                                                              "collection": "users",
                                                                                                              "dataSource": "main",
                                                                                                              "action": "list",
                                                                                                              "params": {
                                                                                                                "pageSize": 20
                                                                                                              },
                                                                                                              "rowKey": "id",
                                                                                                              "showIndex": true,
                                                                                                              "dragSort": false
                                                                                                            },
                                                                                                            "x-toolbar": "BlockSchemaToolbar",
                                                                                                            "x-settings": "blockSettings:table",
                                                                                                            "x-component": "CardItem",
                                                                                                            "x-filter-targets": [],
                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                            "properties": {
                                                                                                              "actions": {
                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                "version": "2.0",
                                                                                                                "type": "void",
                                                                                                                "x-initializer": "table:configureActions",
                                                                                                                "x-component": "ActionBar",
                                                                                                                "x-component-props": {
                                                                                                                  "style": {
                                                                                                                    "marginBottom": "var(--nb-spacing)"
                                                                                                                  }
                                                                                                                },
                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                "x-uid": "9f6bpxq1mqg",
                                                                                                                "x-async": false,
                                                                                                                "x-index": 1
                                                                                                              },
                                                                                                              "kn1h4ol5h6e": {
                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                "version": "2.0",
                                                                                                                "type": "array",
                                                                                                                "x-initializer": "table:configureColumns",
                                                                                                                "x-component": "TableV2",
                                                                                                                "x-use-component-props": "useTableBlockProps",
                                                                                                                "x-component-props": {
                                                                                                                  "rowKey": "id",
                                                                                                                  "rowSelection": {
                                                                                                                    "type": "checkbox"
                                                                                                                  }
                                                                                                                },
                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                "properties": {
                                                                                                                  "actions": {
                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                    "version": "2.0",
                                                                                                                    "type": "void",
                                                                                                                    "title": "{{ t(\"Actions\") }}",
                                                                                                                    "x-action-column": "actions",
                                                                                                                    "x-decorator": "TableV2.Column.ActionBar",
                                                                                                                    "x-component": "TableV2.Column",
                                                                                                                    "x-toolbar": "TableColumnSchemaToolbar",
                                                                                                                    "x-initializer": "table:configureItemActions",
                                                                                                                    "x-settings": "fieldSettings:TableColumn",
                                                                                                                    "x-toolbar-props": {
                                                                                                                      "initializer": "table:configureItemActions"
                                                                                                                    },
                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                    "properties": {
                                                                                                                      "j1tc8hdmr6v": {
                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                        "version": "2.0",
                                                                                                                        "type": "void",
                                                                                                                        "x-decorator": "DndContext",
                                                                                                                        "x-component": "Space",
                                                                                                                        "x-component-props": {
                                                                                                                          "split": "|"
                                                                                                                        },
                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                        "properties": {
                                                                                                                          "5bsat5ba2oe": {
                                                                                                                            "x-uid": "n29elrwl2iy",
                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                            "version": "2.0",
                                                                                                                            "type": "void",
                                                                                                                            "title": "open drawer level 3",
                                                                                                                            "x-action": "view",
                                                                                                                            "x-toolbar": "ActionSchemaToolbar",
                                                                                                                            "x-settings": "actionSettings:view",
                                                                                                                            "x-component": "Action.Link",
                                                                                                                            "x-component-props": {
                                                                                                                              "openMode": "drawer",
                                                                                                                              "iconColor": "#1677FF",
                                                                                                                              "danger": false
                                                                                                                            },
                                                                                                                            "x-action-context": {
                                                                                                                              "dataSource": "main",
                                                                                                                              "collection": "users"
                                                                                                                            },
                                                                                                                            "x-decorator": "ACLActionProvider",
                                                                                                                            "x-designer-props": {
                                                                                                                              "linkageAction": true
                                                                                                                            },
                                                                                                                            "properties": {
                                                                                                                              "drawer": {
                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                "version": "2.0",
                                                                                                                                "type": "void",
                                                                                                                                "title": "{{ t(\"View record\") }}",
                                                                                                                                "x-component": "Action.Container",
                                                                                                                                "x-component-props": {
                                                                                                                                  "className": "nb-action-popup"
                                                                                                                                },
                                                                                                                                "properties": {
                                                                                                                                  "tabs": {
                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                    "version": "2.0",
                                                                                                                                    "type": "void",
                                                                                                                                    "x-component": "Tabs",
                                                                                                                                    "x-component-props": {},
                                                                                                                                    "x-initializer": "popup:addTab",
                                                                                                                                    "properties": {
                                                                                                                                      "tab1": {
                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                        "version": "2.0",
                                                                                                                                        "type": "void",
                                                                                                                                        "title": "{{t(\"Details\")}}",
                                                                                                                                        "x-component": "Tabs.TabPane",
                                                                                                                                        "x-designer": "Tabs.Designer",
                                                                                                                                        "x-component-props": {},
                                                                                                                                        "properties": {
                                                                                                                                          "grid": {
                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                            "version": "2.0",
                                                                                                                                            "type": "void",
                                                                                                                                            "x-component": "Grid",
                                                                                                                                            "x-initializer": "popup:common:addBlock",
                                                                                                                                            "properties": {
                                                                                                                                              "bek4eblrtmd": {
                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                "version": "2.0",
                                                                                                                                                "type": "void",
                                                                                                                                                "x-component": "Grid.Row",
                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                "properties": {
                                                                                                                                                  "s5r8gg06rct": {
                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                    "version": "2.0",
                                                                                                                                                    "type": "void",
                                                                                                                                                    "x-component": "Grid.Col",
                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                    "properties": {
                                                                                                                                                      "029468pww6p": {
                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                        "version": "2.0",
                                                                                                                                                        "type": "void",
                                                                                                                                                        "x-decorator": "TableBlockProvider",
                                                                                                                                                        "x-acl-action": "users:list",
                                                                                                                                                        "x-use-decorator-props": "useTableBlockDecoratorProps",
                                                                                                                                                        "x-decorator-props": {
                                                                                                                                                          "collection": "users",
                                                                                                                                                          "dataSource": "main",
                                                                                                                                                          "action": "list",
                                                                                                                                                          "params": {
                                                                                                                                                            "pageSize": 20
                                                                                                                                                          },
                                                                                                                                                          "rowKey": "id",
                                                                                                                                                          "showIndex": true,
                                                                                                                                                          "dragSort": false
                                                                                                                                                        },
                                                                                                                                                        "x-toolbar": "BlockSchemaToolbar",
                                                                                                                                                        "x-settings": "blockSettings:table",
                                                                                                                                                        "x-component": "CardItem",
                                                                                                                                                        "x-filter-targets": [],
                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                        "properties": {
                                                                                                                                                          "actions": {
                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                            "version": "2.0",
                                                                                                                                                            "type": "void",
                                                                                                                                                            "x-initializer": "table:configureActions",
                                                                                                                                                            "x-component": "ActionBar",
                                                                                                                                                            "x-component-props": {
                                                                                                                                                              "style": {
                                                                                                                                                                "marginBottom": "var(--nb-spacing)"
                                                                                                                                                              }
                                                                                                                                                            },
                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                            "x-uid": "z9aw09nxvw5",
                                                                                                                                                            "x-async": false,
                                                                                                                                                            "x-index": 1
                                                                                                                                                          },
                                                                                                                                                          "60pexe1m4u2": {
                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                            "version": "2.0",
                                                                                                                                                            "type": "array",
                                                                                                                                                            "x-initializer": "table:configureColumns",
                                                                                                                                                            "x-component": "TableV2",
                                                                                                                                                            "x-use-component-props": "useTableBlockProps",
                                                                                                                                                            "x-component-props": {
                                                                                                                                                              "rowKey": "id",
                                                                                                                                                              "rowSelection": {
                                                                                                                                                                "type": "checkbox"
                                                                                                                                                              }
                                                                                                                                                            },
                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                            "properties": {
                                                                                                                                                              "actions": {
                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                "version": "2.0",
                                                                                                                                                                "type": "void",
                                                                                                                                                                "title": "{{ t(\"Actions\") }}",
                                                                                                                                                                "x-action-column": "actions",
                                                                                                                                                                "x-decorator": "TableV2.Column.ActionBar",
                                                                                                                                                                "x-component": "TableV2.Column",
                                                                                                                                                                "x-toolbar": "TableColumnSchemaToolbar",
                                                                                                                                                                "x-initializer": "table:configureItemActions",
                                                                                                                                                                "x-settings": "fieldSettings:TableColumn",
                                                                                                                                                                "x-toolbar-props": {
                                                                                                                                                                  "initializer": "table:configureItemActions"
                                                                                                                                                                },
                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                "properties": {
                                                                                                                                                                  "e4vt131je89": {
                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                    "type": "void",
                                                                                                                                                                    "x-decorator": "DndContext",
                                                                                                                                                                    "x-component": "Space",
                                                                                                                                                                    "x-component-props": {
                                                                                                                                                                      "split": "|"
                                                                                                                                                                    },
                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                    "properties": {
                                                                                                                                                                      "vfv5401rmmt": {
                                                                                                                                                                        "x-uid": "bruhdsatltx",
                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                        "type": "void",
                                                                                                                                                                        "title": "open subpage level 4",
                                                                                                                                                                        "x-action": "view",
                                                                                                                                                                        "x-toolbar": "ActionSchemaToolbar",
                                                                                                                                                                        "x-settings": "actionSettings:view",
                                                                                                                                                                        "x-component": "Action.Link",
                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                          "openMode": "page",
                                                                                                                                                                          "iconColor": "#1677FF",
                                                                                                                                                                          "danger": false
                                                                                                                                                                        },
                                                                                                                                                                        "x-action-context": {
                                                                                                                                                                          "dataSource": "main",
                                                                                                                                                                          "collection": "users"
                                                                                                                                                                        },
                                                                                                                                                                        "x-decorator": "ACLActionProvider",
                                                                                                                                                                        "x-designer-props": {
                                                                                                                                                                          "linkageAction": true
                                                                                                                                                                        },
                                                                                                                                                                        "properties": {
                                                                                                                                                                          "drawer": {
                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                            "type": "void",
                                                                                                                                                                            "title": "{{ t(\"View record\") }}",
                                                                                                                                                                            "x-component": "Action.Container",
                                                                                                                                                                            "x-component-props": {
                                                                                                                                                                              "className": "nb-action-popup"
                                                                                                                                                                            },
                                                                                                                                                                            "properties": {
                                                                                                                                                                              "tabs": {
                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                "type": "void",
                                                                                                                                                                                "x-component": "Tabs",
                                                                                                                                                                                "x-component-props": {},
                                                                                                                                                                                "x-initializer": "popup:addTab",
                                                                                                                                                                                "properties": {
                                                                                                                                                                                  "tab1": {
                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                    "title": "{{t(\"Details\")}}",
                                                                                                                                                                                    "x-component": "Tabs.TabPane",
                                                                                                                                                                                    "x-designer": "Tabs.Designer",
                                                                                                                                                                                    "x-component-props": {},
                                                                                                                                                                                    "properties": {
                                                                                                                                                                                      "grid": {
                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                        "x-component": "Grid",
                                                                                                                                                                                        "x-initializer": "popup:common:addBlock",
                                                                                                                                                                                        "properties": {
                                                                                                                                                                                          "uv8xrl8yshq": {
                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                            "x-component": "Grid.Row",
                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                            "properties": {
                                                                                                                                                                                              "r7gn12frzim": {
                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                "x-component": "Grid.Col",
                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                  "wtwf99hhf7m": {
                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                    "x-decorator": "TableBlockProvider",
                                                                                                                                                                                                    "x-acl-action": "users:list",
                                                                                                                                                                                                    "x-use-decorator-props": "useTableBlockDecoratorProps",
                                                                                                                                                                                                    "x-decorator-props": {
                                                                                                                                                                                                      "collection": "users",
                                                                                                                                                                                                      "dataSource": "main",
                                                                                                                                                                                                      "action": "list",
                                                                                                                                                                                                      "params": {
                                                                                                                                                                                                        "pageSize": 20
                                                                                                                                                                                                      },
                                                                                                                                                                                                      "rowKey": "id",
                                                                                                                                                                                                      "showIndex": true,
                                                                                                                                                                                                      "dragSort": false
                                                                                                                                                                                                    },
                                                                                                                                                                                                    "x-toolbar": "BlockSchemaToolbar",
                                                                                                                                                                                                    "x-settings": "blockSettings:table",
                                                                                                                                                                                                    "x-component": "CardItem",
                                                                                                                                                                                                    "x-filter-targets": [],
                                                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                      "actions": {
                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                        "x-initializer": "table:configureActions",
                                                                                                                                                                                                        "x-component": "ActionBar",
                                                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                                                          "style": {
                                                                                                                                                                                                            "marginBottom": "var(--nb-spacing)"
                                                                                                                                                                                                          }
                                                                                                                                                                                                        },
                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                        "x-uid": "m0fihgaalu9",
                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                      },
                                                                                                                                                                                                      "cs4vmqb3okl": {
                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                        "type": "array",
                                                                                                                                                                                                        "x-initializer": "table:configureColumns",
                                                                                                                                                                                                        "x-component": "TableV2",
                                                                                                                                                                                                        "x-use-component-props": "useTableBlockProps",
                                                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                                                          "rowKey": "id",
                                                                                                                                                                                                          "rowSelection": {
                                                                                                                                                                                                            "type": "checkbox"
                                                                                                                                                                                                          }
                                                                                                                                                                                                        },
                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                          "actions": {
                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                            "title": "{{ t(\"Actions\") }}",
                                                                                                                                                                                                            "x-action-column": "actions",
                                                                                                                                                                                                            "x-decorator": "TableV2.Column.ActionBar",
                                                                                                                                                                                                            "x-component": "TableV2.Column",
                                                                                                                                                                                                            "x-toolbar": "TableColumnSchemaToolbar",
                                                                                                                                                                                                            "x-initializer": "table:configureItemActions",
                                                                                                                                                                                                            "x-settings": "fieldSettings:TableColumn",
                                                                                                                                                                                                            "x-toolbar-props": {
                                                                                                                                                                                                              "initializer": "table:configureItemActions"
                                                                                                                                                                                                            },
                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                              "zi2mb69kroa": {
                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                "x-decorator": "DndContext",
                                                                                                                                                                                                                "x-component": "Space",
                                                                                                                                                                                                                "x-component-props": {
                                                                                                                                                                                                                  "split": "|"
                                                                                                                                                                                                                },
                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                  "i5efamd52hw": {
                                                                                                                                                                                                                    "x-uid": "vnlxn62n8eb",
                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                    "title": "open dialog level 5",
                                                                                                                                                                                                                    "x-action": "view",
                                                                                                                                                                                                                    "x-toolbar": "ActionSchemaToolbar",
                                                                                                                                                                                                                    "x-settings": "actionSettings:view",
                                                                                                                                                                                                                    "x-component": "Action.Link",
                                                                                                                                                                                                                    "x-component-props": {
                                                                                                                                                                                                                      "openMode": "modal",
                                                                                                                                                                                                                      "iconColor": "#1677FF",
                                                                                                                                                                                                                      "danger": false
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                    "x-action-context": {
                                                                                                                                                                                                                      "dataSource": "main",
                                                                                                                                                                                                                      "collection": "users"
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                    "x-decorator": "ACLActionProvider",
                                                                                                                                                                                                                    "x-designer-props": {
                                                                                                                                                                                                                      "linkageAction": true
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                      "drawer": {
                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                        "title": "{{ t(\"View record\") }}",
                                                                                                                                                                                                                        "x-component": "Action.Container",
                                                                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                                                                          "className": "nb-action-popup"
                                                                                                                                                                                                                        },
                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                          "tabs": {
                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                            "x-component": "Tabs",
                                                                                                                                                                                                                            "x-component-props": {},
                                                                                                                                                                                                                            "x-initializer": "popup:addTab",
                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                              "tab1": {
                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                "title": "{{t(\"Details\")}}",
                                                                                                                                                                                                                                "x-component": "Tabs.TabPane",
                                                                                                                                                                                                                                "x-designer": "Tabs.Designer",
                                                                                                                                                                                                                                "x-component-props": {},
                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                  "grid": {
                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                    "x-component": "Grid",
                                                                                                                                                                                                                                    "x-initializer": "popup:common:addBlock",
                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                      "ut3iastuqn8": {
                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                        "x-component": "Grid.Row",
                                                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                          "ucx1g87lhj0": {
                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                            "x-component": "Grid.Col",
                                                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                              "3kz9a1plgwu": {
                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                "x-decorator": "TableBlockProvider",
                                                                                                                                                                                                                                                "x-acl-action": "users:list",
                                                                                                                                                                                                                                                "x-use-decorator-props": "useTableBlockDecoratorProps",
                                                                                                                                                                                                                                                "x-decorator-props": {
                                                                                                                                                                                                                                                  "collection": "users",
                                                                                                                                                                                                                                                  "dataSource": "main",
                                                                                                                                                                                                                                                  "action": "list",
                                                                                                                                                                                                                                                  "params": {
                                                                                                                                                                                                                                                    "pageSize": 20
                                                                                                                                                                                                                                                  },
                                                                                                                                                                                                                                                  "rowKey": "id",
                                                                                                                                                                                                                                                  "showIndex": true,
                                                                                                                                                                                                                                                  "dragSort": false
                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                "x-toolbar": "BlockSchemaToolbar",
                                                                                                                                                                                                                                                "x-settings": "blockSettings:table",
                                                                                                                                                                                                                                                "x-component": "CardItem",
                                                                                                                                                                                                                                                "x-filter-targets": [],
                                                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                  "actions": {
                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                    "x-initializer": "table:configureActions",
                                                                                                                                                                                                                                                    "x-component": "ActionBar",
                                                                                                                                                                                                                                                    "x-component-props": {
                                                                                                                                                                                                                                                      "style": {
                                                                                                                                                                                                                                                        "marginBottom": "var(--nb-spacing)"
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                    "x-uid": "llprwn8ztya",
                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                  },
                                                                                                                                                                                                                                                  "hkyvgna6ed3": {
                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                    "type": "array",
                                                                                                                                                                                                                                                    "x-initializer": "table:configureColumns",
                                                                                                                                                                                                                                                    "x-component": "TableV2",
                                                                                                                                                                                                                                                    "x-use-component-props": "useTableBlockProps",
                                                                                                                                                                                                                                                    "x-component-props": {
                                                                                                                                                                                                                                                      "rowKey": "id",
                                                                                                                                                                                                                                                      "rowSelection": {
                                                                                                                                                                                                                                                        "type": "checkbox"
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                      "actions": {
                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                        "title": "{{ t(\"Actions\") }}",
                                                                                                                                                                                                                                                        "x-action-column": "actions",
                                                                                                                                                                                                                                                        "x-decorator": "TableV2.Column.ActionBar",
                                                                                                                                                                                                                                                        "x-component": "TableV2.Column",
                                                                                                                                                                                                                                                        "x-toolbar": "TableColumnSchemaToolbar",
                                                                                                                                                                                                                                                        "x-initializer": "table:configureItemActions",
                                                                                                                                                                                                                                                        "x-settings": "fieldSettings:TableColumn",
                                                                                                                                                                                                                                                        "x-toolbar-props": {
                                                                                                                                                                                                                                                          "initializer": "table:configureItemActions"
                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                          "s97h0td4v5i": {
                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                            "x-decorator": "DndContext",
                                                                                                                                                                                                                                                            "x-component": "Space",
                                                                                                                                                                                                                                                            "x-component-props": {
                                                                                                                                                                                                                                                              "split": "|"
                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                              "18qbpdmgj6d": {
                                                                                                                                                                                                                                                                "x-uid": "nl62snj5bck",
                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                "title": "open drawer level 6",
                                                                                                                                                                                                                                                                "x-action": "view",
                                                                                                                                                                                                                                                                "x-toolbar": "ActionSchemaToolbar",
                                                                                                                                                                                                                                                                "x-settings": "actionSettings:view",
                                                                                                                                                                                                                                                                "x-component": "Action.Link",
                                                                                                                                                                                                                                                                "x-component-props": {
                                                                                                                                                                                                                                                                  "openMode": "drawer",
                                                                                                                                                                                                                                                                  "iconColor": "#1677FF",
                                                                                                                                                                                                                                                                  "danger": false
                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                "x-action-context": {
                                                                                                                                                                                                                                                                  "dataSource": "main",
                                                                                                                                                                                                                                                                  "collection": "users"
                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                "x-decorator": "ACLActionProvider",
                                                                                                                                                                                                                                                                "x-designer-props": {
                                                                                                                                                                                                                                                                  "linkageAction": true
                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                  "drawer": {
                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                    "title": "{{ t(\"View record\") }}",
                                                                                                                                                                                                                                                                    "x-component": "Action.Container",
                                                                                                                                                                                                                                                                    "x-component-props": {
                                                                                                                                                                                                                                                                      "className": "nb-action-popup"
                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                      "tabs": {
                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                        "x-component": "Tabs",
                                                                                                                                                                                                                                                                        "x-component-props": {},
                                                                                                                                                                                                                                                                        "x-initializer": "popup:addTab",
                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                          "tab1": {
                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                            "title": "{{t(\"Details\")}}",
                                                                                                                                                                                                                                                                            "x-component": "Tabs.TabPane",
                                                                                                                                                                                                                                                                            "x-designer": "Tabs.Designer",
                                                                                                                                                                                                                                                                            "x-component-props": {},
                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                              "grid": {
                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                "x-component": "Grid",
                                                                                                                                                                                                                                                                                "x-initializer": "popup:common:addBlock",
                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                  "xtyssmbz5km": {
                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                    "x-component": "Grid.Row",
                                                                                                                                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                      "yppthygtlc0": {
                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                        "x-component": "Grid.Col",
                                                                                                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                          "o5fx72swwoa": {
                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                            "x-decorator": "TableBlockProvider",
                                                                                                                                                                                                                                                                                            "x-acl-action": "users:list",
                                                                                                                                                                                                                                                                                            "x-use-decorator-props": "useTableBlockDecoratorProps",
                                                                                                                                                                                                                                                                                            "x-decorator-props": {
                                                                                                                                                                                                                                                                                              "collection": "users",
                                                                                                                                                                                                                                                                                              "dataSource": "main",
                                                                                                                                                                                                                                                                                              "action": "list",
                                                                                                                                                                                                                                                                                              "params": {
                                                                                                                                                                                                                                                                                                "pageSize": 20
                                                                                                                                                                                                                                                                                              },
                                                                                                                                                                                                                                                                                              "rowKey": "id",
                                                                                                                                                                                                                                                                                              "showIndex": true,
                                                                                                                                                                                                                                                                                              "dragSort": false
                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                            "x-toolbar": "BlockSchemaToolbar",
                                                                                                                                                                                                                                                                                            "x-settings": "blockSettings:table",
                                                                                                                                                                                                                                                                                            "x-component": "CardItem",
                                                                                                                                                                                                                                                                                            "x-filter-targets": [],
                                                                                                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                              "actions": {
                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                "x-initializer": "table:configureActions",
                                                                                                                                                                                                                                                                                                "x-component": "ActionBar",
                                                                                                                                                                                                                                                                                                "x-component-props": {
                                                                                                                                                                                                                                                                                                  "style": {
                                                                                                                                                                                                                                                                                                    "marginBottom": "var(--nb-spacing)"
                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                "x-uid": "ci8tql3s30k",
                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                              },
                                                                                                                                                                                                                                                                                              "i90kgdtlko6": {
                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                "type": "array",
                                                                                                                                                                                                                                                                                                "x-initializer": "table:configureColumns",
                                                                                                                                                                                                                                                                                                "x-component": "TableV2",
                                                                                                                                                                                                                                                                                                "x-use-component-props": "useTableBlockProps",
                                                                                                                                                                                                                                                                                                "x-component-props": {
                                                                                                                                                                                                                                                                                                  "rowKey": "id",
                                                                                                                                                                                                                                                                                                  "rowSelection": {
                                                                                                                                                                                                                                                                                                    "type": "checkbox"
                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                                  "actions": {
                                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                                    "title": "{{ t(\"Actions\") }}",
                                                                                                                                                                                                                                                                                                    "x-action-column": "actions",
                                                                                                                                                                                                                                                                                                    "x-decorator": "TableV2.Column.ActionBar",
                                                                                                                                                                                                                                                                                                    "x-component": "TableV2.Column",
                                                                                                                                                                                                                                                                                                    "x-toolbar": "TableColumnSchemaToolbar",
                                                                                                                                                                                                                                                                                                    "x-initializer": "table:configureItemActions",
                                                                                                                                                                                                                                                                                                    "x-settings": "fieldSettings:TableColumn",
                                                                                                                                                                                                                                                                                                    "x-toolbar-props": {
                                                                                                                                                                                                                                                                                                      "initializer": "table:configureItemActions"
                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                                      "1gltvx1i7ny": {
                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                                        "x-decorator": "DndContext",
                                                                                                                                                                                                                                                                                                        "x-component": "Space",
                                                                                                                                                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                                                                                                                                                          "split": "|"
                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                                          "mnp2h2lcybc": {
                                                                                                                                                                                                                                                                                                            "x-uid": "kabspj7vxcy",
                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                                            "title": "open dialog level 7",
                                                                                                                                                                                                                                                                                                            "x-action": "view",
                                                                                                                                                                                                                                                                                                            "x-toolbar": "ActionSchemaToolbar",
                                                                                                                                                                                                                                                                                                            "x-settings": "actionSettings:view",
                                                                                                                                                                                                                                                                                                            "x-component": "Action.Link",
                                                                                                                                                                                                                                                                                                            "x-component-props": {
                                                                                                                                                                                                                                                                                                              "openMode": "modal",
                                                                                                                                                                                                                                                                                                              "iconColor": "#1677FF",
                                                                                                                                                                                                                                                                                                              "danger": false
                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                            "x-action-context": {
                                                                                                                                                                                                                                                                                                              "dataSource": "main",
                                                                                                                                                                                                                                                                                                              "collection": "users"
                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                            "x-decorator": "ACLActionProvider",
                                                                                                                                                                                                                                                                                                            "x-designer-props": {
                                                                                                                                                                                                                                                                                                              "linkageAction": true
                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                                              "drawer": {
                                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                                "title": "{{ t(\"View record\") }}",
                                                                                                                                                                                                                                                                                                                "x-component": "Action.Container",
                                                                                                                                                                                                                                                                                                                "x-component-props": {
                                                                                                                                                                                                                                                                                                                  "className": "nb-action-popup"
                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                                                  "tabs": {
                                                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                                                    "x-component": "Tabs",
                                                                                                                                                                                                                                                                                                                    "x-component-props": {},
                                                                                                                                                                                                                                                                                                                    "x-initializer": "popup:addTab",
                                                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                                                      "tab1": {
                                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                                                        "title": "{{t(\"Details\")}}",
                                                                                                                                                                                                                                                                                                                        "x-component": "Tabs.TabPane",
                                                                                                                                                                                                                                                                                                                        "x-designer": "Tabs.Designer",
                                                                                                                                                                                                                                                                                                                        "x-component-props": {},
                                                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                                                          "grid": {
                                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                                                            "x-component": "Grid",
                                                                                                                                                                                                                                                                                                                            "x-initializer": "popup:common:addBlock",
                                                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                                                              "e50512a760h": {
                                                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                                                "x-component": "Grid.Row",
                                                                                                                                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                                                                  "4yjedulqrwf": {
                                                                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                                                                    "x-component": "Grid.Col",
                                                                                                                                                                                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                                                                      "3lbj3a6k6gb": {
                                                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                                                                        "x-decorator": "TableBlockProvider",
                                                                                                                                                                                                                                                                                                                                        "x-acl-action": "users:list",
                                                                                                                                                                                                                                                                                                                                        "x-use-decorator-props": "useTableBlockDecoratorProps",
                                                                                                                                                                                                                                                                                                                                        "x-decorator-props": {
                                                                                                                                                                                                                                                                                                                                          "collection": "users",
                                                                                                                                                                                                                                                                                                                                          "dataSource": "main",
                                                                                                                                                                                                                                                                                                                                          "action": "list",
                                                                                                                                                                                                                                                                                                                                          "params": {
                                                                                                                                                                                                                                                                                                                                            "pageSize": 20
                                                                                                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                                                                                                          "rowKey": "id",
                                                                                                                                                                                                                                                                                                                                          "showIndex": true,
                                                                                                                                                                                                                                                                                                                                          "dragSort": false
                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                        "x-toolbar": "BlockSchemaToolbar",
                                                                                                                                                                                                                                                                                                                                        "x-settings": "blockSettings:table",
                                                                                                                                                                                                                                                                                                                                        "x-component": "CardItem",
                                                                                                                                                                                                                                                                                                                                        "x-filter-targets": [],
                                                                                                                                                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                                                                          "actions": {
                                                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                                                                            "x-initializer": "table:configureActions",
                                                                                                                                                                                                                                                                                                                                            "x-component": "ActionBar",
                                                                                                                                                                                                                                                                                                                                            "x-component-props": {
                                                                                                                                                                                                                                                                                                                                              "style": {
                                                                                                                                                                                                                                                                                                                                                "marginBottom": "var(--nb-spacing)"
                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                            "x-uid": "4esq4pvjco6",
                                                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                                                                                                          "zw07rms0lad": {
                                                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                                                            "type": "array",
                                                                                                                                                                                                                                                                                                                                            "x-initializer": "table:configureColumns",
                                                                                                                                                                                                                                                                                                                                            "x-component": "TableV2",
                                                                                                                                                                                                                                                                                                                                            "x-use-component-props": "useTableBlockProps",
                                                                                                                                                                                                                                                                                                                                            "x-component-props": {
                                                                                                                                                                                                                                                                                                                                              "rowKey": "id",
                                                                                                                                                                                                                                                                                                                                              "rowSelection": {
                                                                                                                                                                                                                                                                                                                                                "type": "checkbox"
                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                                                                              "actions": {
                                                                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                                                                "title": "{{ t(\"Actions\") }}",
                                                                                                                                                                                                                                                                                                                                                "x-action-column": "actions",
                                                                                                                                                                                                                                                                                                                                                "x-decorator": "TableV2.Column.ActionBar",
                                                                                                                                                                                                                                                                                                                                                "x-component": "TableV2.Column",
                                                                                                                                                                                                                                                                                                                                                "x-toolbar": "TableColumnSchemaToolbar",
                                                                                                                                                                                                                                                                                                                                                "x-initializer": "table:configureItemActions",
                                                                                                                                                                                                                                                                                                                                                "x-settings": "fieldSettings:TableColumn",
                                                                                                                                                                                                                                                                                                                                                "x-toolbar-props": {
                                                                                                                                                                                                                                                                                                                                                  "initializer": "table:configureItemActions"
                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                                                                                  "5s91i1gax93": {
                                                                                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                                                                                    "x-decorator": "DndContext",
                                                                                                                                                                                                                                                                                                                                                    "x-component": "Space",
                                                                                                                                                                                                                                                                                                                                                    "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                      "split": "|"
                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                                                                                      "djs40z97cxu": {
                                                                                                                                                                                                                                                                                                                                                        "x-uid": "j1icksluatg",
                                                                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                                                                                        "title": "open subpage level 8",
                                                                                                                                                                                                                                                                                                                                                        "x-action": "view",
                                                                                                                                                                                                                                                                                                                                                        "x-toolbar": "ActionSchemaToolbar",
                                                                                                                                                                                                                                                                                                                                                        "x-settings": "actionSettings:view",
                                                                                                                                                                                                                                                                                                                                                        "x-component": "Action.Link",
                                                                                                                                                                                                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                          "openMode": "page",
                                                                                                                                                                                                                                                                                                                                                          "iconColor": "#1677FF",
                                                                                                                                                                                                                                                                                                                                                          "danger": false
                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                        "x-action-context": {
                                                                                                                                                                                                                                                                                                                                                          "dataSource": "main",
                                                                                                                                                                                                                                                                                                                                                          "collection": "users"
                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                        "x-decorator": "ACLActionProvider",
                                                                                                                                                                                                                                                                                                                                                        "x-designer-props": {
                                                                                                                                                                                                                                                                                                                                                          "linkageAction": true
                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                                                                                          "drawer": {
                                                                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                                                                                            "title": "{{ t(\"View record\") }}",
                                                                                                                                                                                                                                                                                                                                                            "x-component": "Action.Container",
                                                                                                                                                                                                                                                                                                                                                            "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                              "className": "nb-action-popup"
                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                                                                                              "tabs": {
                                                                                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                                                                                "x-component": "Tabs",
                                                                                                                                                                                                                                                                                                                                                                "x-component-props": {},
                                                                                                                                                                                                                                                                                                                                                                "x-initializer": "popup:addTab",
                                                                                                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                                                                                                  "tab1": {
                                                                                                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                                                                                                    "title": "{{t(\"Details\")}}",
                                                                                                                                                                                                                                                                                                                                                                    "x-component": "Tabs.TabPane",
                                                                                                                                                                                                                                                                                                                                                                    "x-designer": "Tabs.Designer",
                                                                                                                                                                                                                                                                                                                                                                    "x-component-props": {},
                                                                                                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                                                                                                      "grid": {
                                                                                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                                                                                                        "x-component": "Grid",
                                                                                                                                                                                                                                                                                                                                                                        "x-initializer": "popup:common:addBlock",
                                                                                                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                                                                                                          "hhu104kv9vb": {
                                                                                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                                                                                                            "x-component": "Grid.Row",
                                                                                                                                                                                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                                                                                                              "po1pzapfz80": {
                                                                                                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                "x-component": "Grid.Col",
                                                                                                                                                                                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                                                                                                                  "oniwgfpj81u": {
                                                                                                                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                    "x-decorator": "TableBlockProvider",
                                                                                                                                                                                                                                                                                                                                                                                    "x-acl-action": "users:list",
                                                                                                                                                                                                                                                                                                                                                                                    "x-use-decorator-props": "useTableBlockDecoratorProps",
                                                                                                                                                                                                                                                                                                                                                                                    "x-decorator-props": {
                                                                                                                                                                                                                                                                                                                                                                                      "collection": "users",
                                                                                                                                                                                                                                                                                                                                                                                      "dataSource": "main",
                                                                                                                                                                                                                                                                                                                                                                                      "action": "list",
                                                                                                                                                                                                                                                                                                                                                                                      "params": {
                                                                                                                                                                                                                                                                                                                                                                                        "pageSize": 20
                                                                                                                                                                                                                                                                                                                                                                                      },
                                                                                                                                                                                                                                                                                                                                                                                      "rowKey": "id",
                                                                                                                                                                                                                                                                                                                                                                                      "showIndex": true,
                                                                                                                                                                                                                                                                                                                                                                                      "dragSort": false
                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                    "x-toolbar": "BlockSchemaToolbar",
                                                                                                                                                                                                                                                                                                                                                                                    "x-settings": "blockSettings:table",
                                                                                                                                                                                                                                                                                                                                                                                    "x-component": "CardItem",
                                                                                                                                                                                                                                                                                                                                                                                    "x-filter-targets": [],
                                                                                                                                                                                                                                                                                                                                                                                    "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                                                                                                                      "actions": {
                                                                                                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                        "x-initializer": "table:configureActions",
                                                                                                                                                                                                                                                                                                                                                                                        "x-component": "ActionBar",
                                                                                                                                                                                                                                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                                                          "style": {
                                                                                                                                                                                                                                                                                                                                                                                            "marginBottom": "var(--nb-spacing)"
                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                        "x-uid": "ooujczurr6b",
                                                                                                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                      },
                                                                                                                                                                                                                                                                                                                                                                                      "1ig7x7e186s": {
                                                                                                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                        "type": "array",
                                                                                                                                                                                                                                                                                                                                                                                        "x-initializer": "table:configureColumns",
                                                                                                                                                                                                                                                                                                                                                                                        "x-component": "TableV2",
                                                                                                                                                                                                                                                                                                                                                                                        "x-use-component-props": "useTableBlockProps",
                                                                                                                                                                                                                                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                                                          "rowKey": "id",
                                                                                                                                                                                                                                                                                                                                                                                          "rowSelection": {
                                                                                                                                                                                                                                                                                                                                                                                            "type": "checkbox"
                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                                                                                                                          "actions": {
                                                                                                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                            "title": "{{ t(\"Actions\") }}",
                                                                                                                                                                                                                                                                                                                                                                                            "x-action-column": "actions",
                                                                                                                                                                                                                                                                                                                                                                                            "x-decorator": "TableV2.Column.ActionBar",
                                                                                                                                                                                                                                                                                                                                                                                            "x-component": "TableV2.Column",
                                                                                                                                                                                                                                                                                                                                                                                            "x-toolbar": "TableColumnSchemaToolbar",
                                                                                                                                                                                                                                                                                                                                                                                            "x-initializer": "table:configureItemActions",
                                                                                                                                                                                                                                                                                                                                                                                            "x-settings": "fieldSettings:TableColumn",
                                                                                                                                                                                                                                                                                                                                                                                            "x-toolbar-props": {
                                                                                                                                                                                                                                                                                                                                                                                              "initializer": "table:configureItemActions"
                                                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                                                                                                                              "wns6x6f9zjj": {
                                                                                                                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                "x-decorator": "DndContext",
                                                                                                                                                                                                                                                                                                                                                                                                "x-component": "Space",
                                                                                                                                                                                                                                                                                                                                                                                                "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                                                                  "split": "|"
                                                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                                                                                                                                  "rmn79fmuc9p": {
                                                                                                                                                                                                                                                                                                                                                                                                    "x-uid": "ulnwb17q0l3",
                                                                                                                                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                    "title": "open drawer level 9",
                                                                                                                                                                                                                                                                                                                                                                                                    "x-action": "view",
                                                                                                                                                                                                                                                                                                                                                                                                    "x-toolbar": "ActionSchemaToolbar",
                                                                                                                                                                                                                                                                                                                                                                                                    "x-settings": "actionSettings:view",
                                                                                                                                                                                                                                                                                                                                                                                                    "x-component": "Action.Link",
                                                                                                                                                                                                                                                                                                                                                                                                    "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                                                                      "openMode": "drawer",
                                                                                                                                                                                                                                                                                                                                                                                                      "iconColor": "#1677FF",
                                                                                                                                                                                                                                                                                                                                                                                                      "danger": false
                                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                                    "x-action-context": {
                                                                                                                                                                                                                                                                                                                                                                                                      "dataSource": "main",
                                                                                                                                                                                                                                                                                                                                                                                                      "collection": "users"
                                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                                    "x-decorator": "ACLActionProvider",
                                                                                                                                                                                                                                                                                                                                                                                                    "x-designer-props": {
                                                                                                                                                                                                                                                                                                                                                                                                      "linkageAction": true
                                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                                                                                                                                      "drawer": {
                                                                                                                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                        "title": "{{ t(\"View record\") }}",
                                                                                                                                                                                                                                                                                                                                                                                                        "x-component": "Action.Container",
                                                                                                                                                                                                                                                                                                                                                                                                        "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                                                                          "className": "nb-action-popup"
                                                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                                                                                                                                          "tabs": {
                                                                                                                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                            "x-component": "Tabs",
                                                                                                                                                                                                                                                                                                                                                                                                            "x-component-props": {},
                                                                                                                                                                                                                                                                                                                                                                                                            "x-initializer": "popup:addTab",
                                                                                                                                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                                                                                                                                              "tab1": {
                                                                                                                                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                                "title": "{{t(\"Details\")}}",
                                                                                                                                                                                                                                                                                                                                                                                                                "x-component": "Tabs.TabPane",
                                                                                                                                                                                                                                                                                                                                                                                                                "x-designer": "Tabs.Designer",
                                                                                                                                                                                                                                                                                                                                                                                                                "x-component-props": {},
                                                                                                                                                                                                                                                                                                                                                                                                                "properties": {
                                                                                                                                                                                                                                                                                                                                                                                                                  "grid": {
                                                                                                                                                                                                                                                                                                                                                                                                                    "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                                    "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                                    "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                                    "x-component": "Grid",
                                                                                                                                                                                                                                                                                                                                                                                                                    "x-initializer": "popup:common:addBlock",
                                                                                                                                                                                                                                                                                                                                                                                                                    "properties": {
                                                                                                                                                                                                                                                                                                                                                                                                                      "ig937f1u8sf": {
                                                                                                                                                                                                                                                                                                                                                                                                                        "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                                        "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                                        "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                                        "x-component": "Grid.Row",
                                                                                                                                                                                                                                                                                                                                                                                                                        "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                                                        "properties": {
                                                                                                                                                                                                                                                                                                                                                                                                                          "41q8ice153d": {
                                                                                                                                                                                                                                                                                                                                                                                                                            "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                                            "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                                            "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                                            "x-component": "Grid.Col",
                                                                                                                                                                                                                                                                                                                                                                                                                            "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                                                            "properties": {
                                                                                                                                                                                                                                                                                                                                                                                                                              "1n90prt1yyd": {
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-uid": "qmfl30cl55x",
                                                                                                                                                                                                                                                                                                                                                                                                                                "_isJSONSchemaObject": true,
                                                                                                                                                                                                                                                                                                                                                                                                                                "version": "2.0",
                                                                                                                                                                                                                                                                                                                                                                                                                                "type": "void",
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-settings": "blockSettings:markdown",
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-decorator": "CardItem",
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-decorator-props": {
                                                                                                                                                                                                                                                                                                                                                                                                                                  "name": "markdown",
                                                                                                                                                                                                                                                                                                                                                                                                                                  "engine": "handlebars"
                                                                                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-component": "Markdown.Void",
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-editable": false,
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-component-props": {
                                                                                                                                                                                                                                                                                                                                                                                                                                  "content": "The end level."
                                                                                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-app-version": "1.3.25-beta",
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                                                                                            "x-uid": "apm3h6cjwyq",
                                                                                                                                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                                                                        "x-uid": "zhdlyq0c4rc",
                                                                                                                                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                                                    "x-uid": "b5b88hc9y5h",
                                                                                                                                                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                                                                "x-uid": "406wk2qdd4f",
                                                                                                                                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                                                                            "x-uid": "8iungl797pb",
                                                                                                                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                                                        "x-uid": "1ol1bih0v31",
                                                                                                                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                                                "x-uid": "9skiwvodkaw",
                                                                                                                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                                                            "x-uid": "p8f7b3drowv",
                                                                                                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                                        "x-uid": "zway5p37i02",
                                                                                                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                        "x-index": 2
                                                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                    "x-uid": "6dn87iv435p",
                                                                                                                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                                "x-uid": "wnnighi8afy",
                                                                                                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                                            "x-uid": "cmyjwxbhnea",
                                                                                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                        "x-uid": "ub6z2k5pzqe",
                                                                                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                    "x-uid": "sceg3nnpf1y",
                                                                                                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                "x-uid": "cf7kksy5pz6",
                                                                                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                                            "x-uid": "6cidvzubudc",
                                                                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                    "x-uid": "pnzjygjm2yc",
                                                                                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                "x-uid": "enkvukkfj5p",
                                                                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                                            "x-uid": "r175b9m0t4o",
                                                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                                                            "x-index": 2
                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                        "x-uid": "nr3t6idvmku",
                                                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                    "x-uid": "058ttwy3la5",
                                                                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                "x-uid": "62r8wjn0afk",
                                                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                                            "x-uid": "430lttgxicg",
                                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                        "x-uid": "pot412tqhgn",
                                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                    "x-uid": "xmdjckwgspr",
                                                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                "x-uid": "e4f0ckehea5",
                                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                        "x-uid": "knvbpbi8187",
                                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                    "x-uid": "a5xwab7wr9e",
                                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                "x-uid": "auorzt0px7g",
                                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                                "x-index": 2
                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                                            "x-uid": "3rnriw3imao",
                                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                        "x-uid": "yoe0xpbdfq7",
                                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                    "x-uid": "cleb54l3cmh",
                                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                "x-uid": "3mnk0vyj8rb",
                                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                                            "x-uid": "vw5c5wc4mbu",
                                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                        "x-uid": "huwkn2rpb8r",
                                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                    "x-uid": "49hrpon5536",
                                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                            "x-uid": "zd8myky396c",
                                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                        "x-uid": "rkt1m66kts4",
                                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                    "x-uid": "h4kt6v4ra5a",
                                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                                    "x-index": 2
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                "x-uid": "mt8e6xzxu50",
                                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                            "x-uid": "1ufit3nvj4z",
                                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                        "x-uid": "r5f7wlq5c60",
                                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                    "x-uid": "k6ruqkw72kx",
                                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                "x-uid": "brsffy88jj6",
                                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            },
                                                                                                                                                                                                                            "x-uid": "bg8pypcqktr",
                                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        },
                                                                                                                                                                                                                        "x-uid": "8wc594xb0kj",
                                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                },
                                                                                                                                                                                                                "x-uid": "5a2viypsi88",
                                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                                              }
                                                                                                                                                                                                            },
                                                                                                                                                                                                            "x-uid": "z1ij0fgsnnh",
                                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                                          }
                                                                                                                                                                                                        },
                                                                                                                                                                                                        "x-uid": "fojftt4llul",
                                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                                        "x-index": 2
                                                                                                                                                                                                      }
                                                                                                                                                                                                    },
                                                                                                                                                                                                    "x-uid": "o3tzthr2ppm",
                                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                                  }
                                                                                                                                                                                                },
                                                                                                                                                                                                "x-uid": "23zqhztmjwg",
                                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                                "x-index": 1
                                                                                                                                                                                              }
                                                                                                                                                                                            },
                                                                                                                                                                                            "x-uid": "mluawznytch",
                                                                                                                                                                                            "x-async": false,
                                                                                                                                                                                            "x-index": 1
                                                                                                                                                                                          }
                                                                                                                                                                                        },
                                                                                                                                                                                        "x-uid": "9jjorxdphaq",
                                                                                                                                                                                        "x-async": false,
                                                                                                                                                                                        "x-index": 1
                                                                                                                                                                                      }
                                                                                                                                                                                    },
                                                                                                                                                                                    "x-uid": "tuvviynh9nt",
                                                                                                                                                                                    "x-async": false,
                                                                                                                                                                                    "x-index": 1
                                                                                                                                                                                  }
                                                                                                                                                                                },
                                                                                                                                                                                "x-uid": "c1xqgu4wvfx",
                                                                                                                                                                                "x-async": false,
                                                                                                                                                                                "x-index": 1
                                                                                                                                                                              }
                                                                                                                                                                            },
                                                                                                                                                                            "x-uid": "ynvkjtc8b5u",
                                                                                                                                                                            "x-async": false,
                                                                                                                                                                            "x-index": 1
                                                                                                                                                                          }
                                                                                                                                                                        },
                                                                                                                                                                        "x-async": false,
                                                                                                                                                                        "x-index": 1
                                                                                                                                                                      }
                                                                                                                                                                    },
                                                                                                                                                                    "x-uid": "thbwi0c5bwm",
                                                                                                                                                                    "x-async": false,
                                                                                                                                                                    "x-index": 1
                                                                                                                                                                  }
                                                                                                                                                                },
                                                                                                                                                                "x-uid": "n1j2rolc96m",
                                                                                                                                                                "x-async": false,
                                                                                                                                                                "x-index": 1
                                                                                                                                                              }
                                                                                                                                                            },
                                                                                                                                                            "x-uid": "twcggimsu3w",
                                                                                                                                                            "x-async": false,
                                                                                                                                                            "x-index": 2
                                                                                                                                                          }
                                                                                                                                                        },
                                                                                                                                                        "x-uid": "y5m11um74qk",
                                                                                                                                                        "x-async": false,
                                                                                                                                                        "x-index": 1
                                                                                                                                                      }
                                                                                                                                                    },
                                                                                                                                                    "x-uid": "gll0n75dxi1",
                                                                                                                                                    "x-async": false,
                                                                                                                                                    "x-index": 1
                                                                                                                                                  }
                                                                                                                                                },
                                                                                                                                                "x-uid": "96kv0psnkuw",
                                                                                                                                                "x-async": false,
                                                                                                                                                "x-index": 1
                                                                                                                                              }
                                                                                                                                            },
                                                                                                                                            "x-uid": "kzynfuj8nmc",
                                                                                                                                            "x-async": false,
                                                                                                                                            "x-index": 1
                                                                                                                                          }
                                                                                                                                        },
                                                                                                                                        "x-uid": "efr48ktmyyr",
                                                                                                                                        "x-async": false,
                                                                                                                                        "x-index": 1
                                                                                                                                      }
                                                                                                                                    },
                                                                                                                                    "x-uid": "vga3xoo4anm",
                                                                                                                                    "x-async": false,
                                                                                                                                    "x-index": 1
                                                                                                                                  }
                                                                                                                                },
                                                                                                                                "x-uid": "y8t3v1mmzic",
                                                                                                                                "x-async": false,
                                                                                                                                "x-index": 1
                                                                                                                              }
                                                                                                                            },
                                                                                                                            "x-async": false,
                                                                                                                            "x-index": 1
                                                                                                                          }
                                                                                                                        },
                                                                                                                        "x-uid": "ynxbl6rhjk4",
                                                                                                                        "x-async": false,
                                                                                                                        "x-index": 1
                                                                                                                      }
                                                                                                                    },
                                                                                                                    "x-uid": "v1kq9u17qxl",
                                                                                                                    "x-async": false,
                                                                                                                    "x-index": 1
                                                                                                                  }
                                                                                                                },
                                                                                                                "x-uid": "vpmbuqo8mhu",
                                                                                                                "x-async": false,
                                                                                                                "x-index": 2
                                                                                                              }
                                                                                                            },
                                                                                                            "x-uid": "dcm6ia502o6",
                                                                                                            "x-async": false,
                                                                                                            "x-index": 1
                                                                                                          }
                                                                                                        },
                                                                                                        "x-uid": "6auwnes1vcs",
                                                                                                        "x-async": false,
                                                                                                        "x-index": 1
                                                                                                      }
                                                                                                    },
                                                                                                    "x-uid": "r431cj2ndsu",
                                                                                                    "x-async": false,
                                                                                                    "x-index": 1
                                                                                                  }
                                                                                                },
                                                                                                "x-uid": "6ut4gt5uf86",
                                                                                                "x-async": false,
                                                                                                "x-index": 1
                                                                                              }
                                                                                            },
                                                                                            "x-uid": "znjufroyfyc",
                                                                                            "x-async": false,
                                                                                            "x-index": 1
                                                                                          }
                                                                                        },
                                                                                        "x-uid": "ci4pbdvh20m",
                                                                                        "x-async": false,
                                                                                        "x-index": 1
                                                                                      }
                                                                                    },
                                                                                    "x-uid": "ddqpi13bqx1",
                                                                                    "x-async": false,
                                                                                    "x-index": 1
                                                                                  }
                                                                                },
                                                                                "x-async": false,
                                                                                "x-index": 1
                                                                              }
                                                                            },
                                                                            "x-uid": "w0s3y3v53t1",
                                                                            "x-async": false,
                                                                            "x-index": 1
                                                                          }
                                                                        },
                                                                        "x-uid": "j1inbrm45v0",
                                                                        "x-async": false,
                                                                        "x-index": 1
                                                                      }
                                                                    },
                                                                    "x-uid": "ozmv9riff2v",
                                                                    "x-async": false,
                                                                    "x-index": 2
                                                                  }
                                                                },
                                                                "x-uid": "x8nu4ar93me",
                                                                "x-async": false,
                                                                "x-index": 1
                                                              }
                                                            },
                                                            "x-uid": "113oe9rt976",
                                                            "x-async": false,
                                                            "x-index": 1
                                                          }
                                                        },
                                                        "x-uid": "2d4zbcvv2sl",
                                                        "x-async": false,
                                                        "x-index": 1
                                                      }
                                                    },
                                                    "x-uid": "e2odecwkz1y",
                                                    "x-async": false,
                                                    "x-index": 1
                                                  }
                                                },
                                                "x-uid": "kbe13re0xf9",
                                                "x-async": false,
                                                "x-index": 1
                                              }
                                            },
                                            "x-uid": "bd7thqf9dcq",
                                            "x-async": false,
                                            "x-index": 1
                                          }
                                        },
                                        "x-uid": "0bs85gf862t",
                                        "x-async": false,
                                        "x-index": 1
                                      }
                                    },
                                    "x-async": false,
                                    "x-index": 1
                                  }
                                },
                                "x-uid": "29vtce3sn7e",
                                "x-async": false,
                                "x-index": 1
                              }
                            },
                            "x-uid": "q7gr9i3lxk9",
                            "x-async": false,
                            "x-index": 1
                          }
                        },
                        "x-uid": "zurdy2onxho",
                        "x-async": false,
                        "x-index": 2
                      }
                    },
                    "x-uid": "xn9t2b42pi4",
                    "x-async": false,
                    "x-index": 1
                  }
                },
                "x-uid": "gfttu0wiztz",
                "x-async": false,
                "x-index": 1
              }
            },
            "x-uid": "insngyq2xmg",
            "x-async": false,
            "x-index": 1
          }
        },
        "x-uid": "u5flwdsxwkj",
        "x-async": false,
        "x-index": 1
      }
    },
    "x-uid": "wdbmnbtknkv",
    "x-async": true,
    "x-index": 1
  }
}
