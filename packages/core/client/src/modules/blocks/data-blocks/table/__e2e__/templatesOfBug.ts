/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageConfig, tree } from '@nocobase/test/e2e';

export const T2183 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '3c1ivjciciu': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '1n5r9s23amo': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              bsmuf6ly8b2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  ppv3te8l7mo: {
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
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
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
                        properties: {
                          o8wqytvd6as: {
                            'x-uid': '9vghmn6u5eo',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Filter") }}',
                            'x-action': 'filter',
                            'x-designer': 'Filter.Action.Designer',
                            'x-component': 'Filter.Action',
                            'x-component-props': {
                              icon: 'FilterOutlined',
                              useProps: '{{ useFilterActionProps }}',
                            },
                            'x-align': 'left',
                            default: {
                              $and: [],
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'qq7hs80xlut',
                        'x-async': false,
                        'x-index': 1,
                      },
                      r02zx6qq4ql: {
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
                                'x-uid': '4fcw4u63f3p',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'pxqbve61e9i',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'kta6g2v3m9s',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'yu418id0x3t',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'xrvoeyz6uop',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'u64df000i8u',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'hofapxvp8p7',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'w7nv1c98j2g',
    'x-async': true,
    'x-index': 1,
  },
};
export const T2186 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      cglzmr757wp: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '0r1mwh6fgdj': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              kjjiumynoor: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  qzbbcmvyy7n: {
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
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
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
                        properties: {
                          '8yt1cl9miol': {
                            'x-uid': 'pcebb2lm84j',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Filter") }}',
                            'x-action': 'filter',
                            'x-designer': 'Filter.Action.Designer',
                            'x-component': 'Filter.Action',
                            'x-component-props': {
                              icon: 'FilterOutlined',
                              useProps: '{{ useFilterActionProps }}',
                            },
                            'x-align': 'left',
                            default: {
                              $and: [{}],
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'sz9p441he7c',
                        'x-async': false,
                        'x-index': 1,
                      },
                      fqmmittx9pb: {
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
                                'x-uid': 'r4m451vcj6l',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'fogxvhca4sg',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '6ywen03do22',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '47n8qnj6q20',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'xnc0acxgrxz',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '5dy05u5q2b2',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'rue5m4yfin6',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '3xce5ru15d6',
    'x-async': true,
    'x-index': 1,
  },
};
export const T2187 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      k24lhmzq1u2: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          zp24b63pujf: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              e8t2mwjafsr: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '9x571vayogf': {
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
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
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
                        'x-uid': 't2drja2eg9p',
                        'x-async': false,
                        'x-index': 1,
                      },
                      edacvuffzln: {
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
                                properties: {
                                  '2j97snwh4cx': {
                                    'x-uid': 'il7gzvmxtzu',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-action': 'duplicate',
                                    'x-acl-action': 'create',
                                    title: '{{ t("Duplicate") }}',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-decorator': 'ACLActionProvider',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      component: 'DuplicateAction',
                                      duplicateMode: 'continueduplicate',
                                      duplicateFields: ['nickname'],
                                      duplicateCollection: 'users',
                                    },
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    properties: {
                                      drawer: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{ t("Duplicate") }}',
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
                                            'x-initializer': 'TabPaneInitializers',
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Duplicate")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:addNew:addBlock',
                                                    properties: {
                                                      qvyfk3a9a2g: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          t8ooaf8oxm0: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              jo3yh728qkn: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: true,
                                                                },
                                                                'x-acl-action': 'users:create',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  resource: 'users',
                                                                  collection: 'users',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  '5o8dowro5r1': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        properties: {
                                                                          h191s1ni4am: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              twb640jbhp3: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  nickname: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'users.nickname',
                                                                                    'x-component-props': {},
                                                                                    'x-uid': 'pcw1toh7uvj',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                  roles: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'users.roles',
                                                                                    'x-component-props': {},
                                                                                    'x-uid': '197m7f208wz',
                                                                                    'x-async': false,
                                                                                    'x-index': 2,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'bbkl81w4h5e',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '1blkzui6noh',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'pcpeajmpx9k',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'createForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-uid': 'y3gbelepat8',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'rmu7uywdppl',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'kpfthrvsd4l',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'drns72r222r',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'iongy3crgdb',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'zw6jjtof2vn',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'hm4kv8gn4me',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'pztq2aledmj',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'qr43qja4p46',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '2w1e5m7at3v',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'uranm958u5v',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '38j1kvvsdtp',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'k4isiobw2ab',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'vr305f4itlf',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 't70enk0z07b',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'rjmnr89y4f6',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'kd7dz5gvdv6',
    'x-async': true,
    'x-index': 1,
  },
};

export const T3686: PageConfig = {
  collections: [
    {
      name: 'parentTargetCollection',
      fields: [
        {
          name: 'parentTargetText',
          interface: 'input',
        },
      ],
    },
    {
      name: 'childTargetCollection',
      fields: [
        {
          name: 'childTargetText',
          interface: 'input',
        },
      ],
    },
    {
      name: 'parentCollection',
      fields: [
        {
          name: 'parentAssociationField',
          interface: 'm2m',
          target: 'parentTargetCollection',
        },
      ],
    },
    {
      name: 'childCollection',
      inherits: ['parentCollection'],
      fields: [
        {
          name: 'childAssociationField',
          interface: 'm2m',
          target: 'childTargetCollection',
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
      fa2wzem9pud: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '14kr5bu1min': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              uc0jyubx2p3: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  k22vt5rvlf8: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'childCollection:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'childCollection',
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
                        'x-uid': '42xfns3215b',
                        'x-async': false,
                        'x-index': 1,
                      },
                      mv0fpgnz9x4: {
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
                            properties: {
                              '4pr5w722wko': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  '0z54f36l29g': {
                                    'x-uid': '6ga7ofdmqac',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                    'x-uid': '8isg655oydv',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'avctzq7wpne',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '8mimixsn47i',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'l491lw6ud7u',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '0y6h0doaa8s',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'cusyvu100n5',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'kp6yhoecxt4',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '6fsjzz00845',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'gbcojp8p120',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '18neqdk2pbg',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '7przcz662jy',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'teroosp0elp',
    'x-async': true,
    'x-index': 1,
  },
};

export const T3843 = {
  collections: [
    {
      name: 'collection1',
      titleField: 'singleLineText',
      fields: [
        {
          name: 'singleLineText',
          interface: 'input',
        },
      ],
    },
    {
      name: 'collection2',
      fields: [
        {
          name: 'manyToMany1',
          interface: 'm2m',
          target: 'collection1',
        },
      ],
    },
    {
      name: 'collection3',
      fields: [
        {
          name: 'manyToMany2',
          interface: 'm2m',
          target: 'collection2',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      ho5v948ioup: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          i75dexmx5m7: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              vxj362dhynn: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  scsoms5vv4t: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'collection3:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'collection3',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-index': 1,
                    properties: {
                      '38bp0zvyvsd': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-index': 1,
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-index': 1,
                            properties: {
                              xcxcmkkaf3h: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-index': 1,
                                properties: {
                                  pijw4lwpkkl: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-index': 1,
                                    properties: {
                                      manyToMany2: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'collection3.manyToMany2',
                                        'x-component-props': {
                                          fieldNames: {
                                            label: 'id',
                                            value: 'id',
                                          },
                                          mode: 'SubTable',
                                        },
                                        default: null,
                                        'x-index': 1,
                                        properties: {
                                          '6w2emsoaaad': {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.SubTable',
                                            'x-initializer': 'table:configureColumns',
                                            'x-initializer-props': {
                                              action: false,
                                            },
                                            'x-index': 1,
                                            properties: {
                                              fdyw9dk9zv8: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                properties: {
                                                  manyToMany1: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'collection2.manyToMany1',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {
                                                      fieldNames: {
                                                        value: 'id',
                                                        label: 'singleLineText',
                                                      },
                                                      ellipsis: true,
                                                      size: 'small',
                                                    },
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-uid': '8k6fqjjkjln',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'e0k1dih4fer',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'qqenvjxbrzm',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'j9fxeze864t',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'xcbv7kwjzhf',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '6ja2lhcrsds',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'vfz4dpw1bqj',
                            'x-async': false,
                          },
                          nr1ij11nsbg: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                marginTop: 24,
                              },
                            },
                            'x-index': 2,
                            'x-uid': '4ms20yxmzz4',
                            'x-async': false,
                          },
                        },
                        'x-uid': '0scq4d33l5n',
                        'x-async': false,
                      },
                    },
                    'x-uid': '0lcbpth6a9i',
                    'x-async': false,
                  },
                },
                'x-uid': '78g1ktyk4zh',
                'x-async': false,
              },
            },
            'x-uid': '2tmmrcp6t4w',
            'x-async': false,
          },
        },
        'x-uid': '6pc46vdxzuj',
        'x-async': false,
      },
    },
    'x-uid': '4gdooktjyc7',
    'x-async': true,
  },
};
export const oneTableWithRoles: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '0.21.0-alpha.5',
    properties: {
      g31hdrdqs8h: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '0.21.0-alpha.5',
        properties: {
          w3qd8et7ny1: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.5',
            properties: {
              jy1b9o63ko7: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.5',
                properties: {
                  iwtxze1jmpm: {
                    'x-uid': 'exvpbgr35zn',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'roles:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'roles',
                      dataSource: 'main',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'name',
                      showIndex: true,
                      dragSort: false,
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:table',
                    'x-component': 'CardItem',
                    'x-filter-targets': [
                      {
                        uid: 'a7n5crnwx91',
                      },
                      {
                        uid: 'z10rv1j5j7x',
                        field: 'roles.name',
                      },
                    ],
                    'x-app-version': '0.21.0-alpha.5',
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
                        'x-app-version': '0.21.0-alpha.5',
                        'x-uid': 'bz6xai67sd4',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '3r100r39y9k': {
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
                        'x-app-version': '0.21.0-alpha.5',
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
                            'x-app-version': '0.21.0-alpha.5',
                            properties: {
                              huffguvj9ju: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.5',
                                'x-uid': 'kumec65v6eo',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '0behu2op8h2',
                            'x-async': false,
                            'x-index': 1,
                          },
                          o3kdcl5v6ex: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '0.21.0-alpha.5',
                            properties: {
                              title: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'roles.title',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '0.21.0-alpha.5',
                                'x-uid': 'yga0n3a2puj',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'd452dent98m',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'byorarf2lw2',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'ousy05pzp3u',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'znu51ytf7f5',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'gvzvz05oi9h',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'mk589w74bvs',
    'x-async': true,
    'x-index': 1,
  },
};
export const T4032 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '0.21.0-alpha.7',
    properties: {
      ia9qjfjq6ut: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '0.21.0-alpha.7',
        properties: {
          vram4b0bqi3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.7',
            properties: {
              r7uz3lgyh2c: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.7',
                properties: {
                  y2df95i695g: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'users',
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
                    'x-app-version': '0.21.0-alpha.7',
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
                        'x-app-version': '0.21.0-alpha.7',
                        'x-uid': '7neytjs0okh',
                        'x-async': false,
                        'x-index': 1,
                      },
                      yqrkzme65ck: {
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
                        'x-app-version': '0.21.0-alpha.7',
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
                            'x-app-version': '0.21.0-alpha.7',
                            properties: {
                              ma3v2fqbahw: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.7',
                                properties: {
                                  nj1t0730zg4: {
                                    'x-uid': '89yj46b175h',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
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
                                                    properties: {
                                                      '0tzpts0nsqz': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '0.21.0-alpha.7',
                                                        properties: {
                                                          picgjevt3op: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '0.21.0-alpha.7',
                                                            properties: {
                                                              tgwndkbv0ec: {
                                                                'x-uid': 'k0s4o4lb2mm',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableBlockProvider',
                                                                'x-acl-action': 'undefined:list',
                                                                'x-use-decorator-props': 'useTableBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  association: 'users.roles',
                                                                  dataSource: 'main',
                                                                  action: 'list',
                                                                  params: {
                                                                    pageSize: 20,
                                                                    filter: {
                                                                      $and: [
                                                                        {
                                                                          name: {
                                                                            $includes: '{{$nParentRecord.roles.name}}',
                                                                          },
                                                                        },
                                                                      ],
                                                                    },
                                                                  },
                                                                  rowKey: 'name',
                                                                  showIndex: true,
                                                                  dragSort: false,
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:table',
                                                                'x-component': 'CardItem',
                                                                'x-filter-targets': [],
                                                                'x-app-version': '0.21.0-alpha.7',
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
                                                                    'x-app-version': '0.21.0-alpha.7',
                                                                    'x-uid': 'srqykzq3gvg',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  '2yiprrlp7xi': {
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
                                                                    'x-app-version': '0.21.0-alpha.7',
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
                                                                        'x-app-version': '0.21.0-alpha.7',
                                                                        properties: {
                                                                          hz9blh44g22: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '0.21.0-alpha.7',
                                                                            'x-uid': '2br0vnxmz9n',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '7wsmeh6k32c',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      cym3lb5sm0b: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-decorator': 'TableV2.Column.Decorator',
                                                                        'x-toolbar': 'TableColumnSchemaToolbar',
                                                                        'x-settings': 'fieldSettings:TableColumn',
                                                                        'x-component': 'TableV2.Column',
                                                                        'x-app-version': '0.21.0-alpha.7',
                                                                        properties: {
                                                                          name: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            'x-collection-field': 'roles.name',
                                                                            'x-component': 'CollectionField',
                                                                            'x-component-props': {
                                                                              ellipsis: true,
                                                                            },
                                                                            'x-read-pretty': true,
                                                                            'x-decorator': null,
                                                                            'x-decorator-props': {
                                                                              labelStyle: {
                                                                                display: 'none',
                                                                              },
                                                                            },
                                                                            'x-app-version': '0.21.0-alpha.7',
                                                                            'x-uid': 'lzsfqsbmrlw',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'lrkwqiscrd5',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': '0vmljpu5po8',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'om40j9skoi3',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '9tx487d7jnx',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'uf5mhszv8e4',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'upske4n9wvz',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'g45op4hkqfd',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '8ipxtvpkgz7',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'dkq7q7uiaoe',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '92gsuwjwj4m',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'puh6b9wk3pc',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '7zch9vwg8vf',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '8fxz2u9zf1c',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'z7raph3uxea',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'kplbtsys5d8',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'vfmzhh0sq2a',
    'x-async': true,
    'x-index': 1,
  },
};

export const T4005 = {
  collections: [
    {
      name: 'general',
      fields: [
        {
          key: '0bfwq449rbb',
          name: 'id',
          type: 'bigInt',
          interface: 'integer',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
          uiSchema: {
            type: 'number',
            title: '{{t("ID")}}',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          key: 'mmb6br9hfz7',
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          field: 'createdAt',
          uiSchema: {
            type: 'datetime',
            title: '{{t("Created at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
        {
          key: 'byrp4setnwt',
          name: 'createdBy',
          type: 'belongsTo',
          interface: 'createdBy',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          target: 'users',
          foreignKey: 'createdById',
          uiSchema: {
            type: 'object',
            title: '{{t("Created by")}}',
            'x-component': 'AssociationField',
            'x-component-props': {
              fieldNames: {
                value: 'id',
                label: 'nickname',
              },
            },
            'x-read-pretty': true,
          },
          targetKey: 'id',
        },
        {
          key: 'u2rqywynnst',
          name: 'updatedAt',
          type: 'date',
          interface: 'updatedAt',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          field: 'updatedAt',
          uiSchema: {
            type: 'string',
            title: '{{t("Last updated at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
        {
          key: 'tl3w0x0vesj',
          name: 'updatedBy',
          type: 'belongsTo',
          interface: 'updatedBy',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          target: 'users',
          foreignKey: 'updatedById',
          uiSchema: {
            type: 'object',
            title: '{{t("Last updated by")}}',
            'x-component': 'AssociationField',
            'x-component-props': {
              fieldNames: {
                value: 'id',
                label: 'nickname',
              },
            },
            'x-read-pretty': true,
          },
          targetKey: 'id',
        },
        {
          key: '5rlq8deb8qk',
          name: 'o2m',
          type: 'hasMany',
          interface: 'o2m',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          sourceKey: 'id',
          foreignKey: 'f_7aez29imfkc',
          onDelete: 'SET NULL',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: true,
            },
            title: 'o2m',
          },
          target: 'users',
          targetKey: 'id',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '0.21.0-alpha.7',
    properties: {
      zyu7hde60uz: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '0.21.0-alpha.7',
        properties: {
          jlbt63ebmok: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.7',
            properties: {
              efv31zzj7p1: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.7',
                properties: {
                  mf18e6qaubw: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'general',
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
                    'x-app-version': '0.21.0-alpha.7',
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
                        'x-app-version': '0.21.0-alpha.7',
                        'x-uid': 'culd2bkzyy9',
                        'x-async': false,
                        'x-index': 1,
                      },
                      vj1vhou3rl4: {
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
                        'x-app-version': '0.21.0-alpha.7',
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
                            'x-app-version': '0.21.0-alpha.7',
                            properties: {
                              zrma351c4yu: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.7',
                                properties: {
                                  '7vyz5e4j6hu': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
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
                                                    'x-uid': 'z5ic33l01mh',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'qqd6eoirhak',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '5xsjgcz77ms',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '56sfx8s2u6e',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'nx3xk48ekbn',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'b74lmo5dke5',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'tkfpwjmsgv7',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'aaakz5iak09',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'iubaru5djil',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'v9kas4cit4w',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'muqbdrajmi1',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'lugxpqc49hf',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'r5vegaoif74',
    'x-async': true,
    'x-index': 1,
  },
};
export const twoTableWithAuthorAndBooks = {
  collections: [
    {
      name: 'author',
      fields: [
        {
          name: 'books',
          interface: 'o2m',
          foreignKey: 'authorId',
          target: 'books',
        },
        {
          name: 'name',
          interface: 'input',
        },
      ],
    },
    {
      name: 'books',
      fields: [
        {
          name: 'authorId',
          interface: 'integer',
          target: 'author',
          isForeignKey: true,
        },
        {
          name: 'name',
          interface: 'input',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '0.21.0-alpha.13',
    'x-index': 1,
    properties: {
      '1i8ni0myw2y': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '0.21.0-alpha.13',
        'x-index': 1,
        properties: {
          '9e58y8qieln': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.13',
            'x-index': 1,
            properties: {
              i50s2rlk4ar: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.13',
                'x-index': 1,
                properties: {
                  ddk1nef97tf: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'author:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'author',
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
                    'x-app-version': '0.21.0-alpha.13',
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
                        'x-app-version': '0.21.0-alpha.13',
                        'x-index': 1,
                        'x-uid': '4yrqtiyaivp',
                        'x-async': false,
                      },
                      frdw8x1f09m: {
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
                        'x-app-version': '0.21.0-alpha.13',
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
                            'x-app-version': '0.21.0-alpha.13',
                            'x-index': 1,
                            properties: {
                              uw13f1l61js: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.13',
                                'x-index': 1,
                                'x-uid': 'pabqet5c7ct',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'zvfoxrwhxqh',
                            'x-async': false,
                          },
                          '9m5k78j7th3': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '0.21.0-alpha.13',
                            properties: {
                              name: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'author.name',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '0.21.0-alpha.13',
                                'x-uid': 'xvcufxzv8to',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '1nvi0qrq85c',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'sal6mjrumuk',
                        'x-async': false,
                      },
                    },
                    'x-uid': '6leevx6ln8m',
                    'x-async': false,
                  },
                },
                'x-uid': 'fpkthksicg6',
                'x-async': false,
              },
            },
            'x-uid': 'vymaiz1eihz',
            'x-async': false,
          },
          tje5moj54zp: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.13',
            'x-index': 2,
            properties: {
              vql8xk7icqm: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.13',
                'x-index': 1,
                properties: {
                  z8pmpx202xi: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'books:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'books',
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
                    'x-app-version': '0.21.0-alpha.13',
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
                        'x-app-version': '0.21.0-alpha.13',
                        'x-index': 1,
                        'x-uid': '3d0o79v11e8',
                        'x-async': false,
                      },
                      j8som9wt9uj: {
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
                        'x-app-version': '0.21.0-alpha.13',
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
                            'x-app-version': '0.21.0-alpha.13',
                            'x-index': 1,
                            properties: {
                              jm9u46tzak6: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.13',
                                'x-index': 1,
                                'x-uid': 'aw5jz41g7va',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'nkhmuqxiehk',
                            'x-async': false,
                          },
                          j9trhyy867k: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '0.21.0-alpha.13',
                            properties: {
                              name: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'books.name',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '0.21.0-alpha.13',
                                'x-uid': 'lopjr1lbm71',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '1ceugk5f8fj',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'x9prv8hr3a6',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'puzu4rwwxly',
                    'x-async': false,
                  },
                },
                'x-uid': 'j900c1u029s',
                'x-async': false,
              },
            },
            'x-uid': 'f165ng4ho06',
            'x-async': false,
          },
        },
        'x-uid': 'nga7wa4cmxd',
        'x-async': false,
      },
    },
    'x-uid': 'osodxd9u6vt',
    'x-async': true,
  },
};
export const oneTableWithUpdateRecord = {
  collections: [
    {
      name: 'users2',
      fields: [
        {
          name: 'nickname',
          interface: 'input',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      r9qrai28a9x: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          x83br30jhba: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.15',
            'x-index': 1,
            properties: {
              abm6suh07io: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.15',
                'x-index': 1,
                properties: {
                  ik81gciqx99: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users2:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'users2',
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
                    'x-app-version': '0.21.0-alpha.15',
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
                        'x-app-version': '0.21.0-alpha.15',
                        'x-index': 1,
                        properties: {
                          e6p6pc4i7ru: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            title: '{{ t("Refresh") }}',
                            'x-action': 'refresh',
                            'x-component': 'Action',
                            'x-use-component-props': 'useRefreshActionProps',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:refresh',
                            'x-component-props': {
                              icon: 'ReloadOutlined',
                            },
                            'x-align': 'right',
                            type: 'void',
                            'x-app-version': '0.21.0-alpha.15',
                            'x-index': 1,
                            'x-uid': 'ganipmn6wdh',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'su2i79kr385',
                        'x-async': false,
                      },
                      w3g2bnojflu: {
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
                        'x-app-version': '0.21.0-alpha.15',
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
                            'x-app-version': '0.21.0-alpha.15',
                            'x-index': 1,
                            properties: {
                              '6v6dk8utqur': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.15',
                                'x-index': 1,
                                'x-uid': 'b25k9c1ur9n',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'hso9ig0msah',
                            'x-async': false,
                          },
                          '3k0ukmw2anz': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '0.21.0-alpha.15',
                            'x-index': 2,
                            properties: {
                              nickname: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users2.nickname',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '0.21.0-alpha.15',
                                'x-index': 1,
                                'x-uid': 'roxn64e6vhx',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'xx6danutdp0',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'w3akwbj68s0',
                        'x-async': false,
                      },
                    },
                    'x-uid': '114glfljrp1',
                    'x-async': false,
                  },
                },
                'x-uid': 'w8l1aaizpwc',
                'x-async': false,
              },
            },
            'x-uid': 'ywpa5ajvacs',
            'x-async': false,
          },
        },
        'x-uid': 'x9mg721vhua',
        'x-async': false,
      },
    },
    'x-uid': 'tilp0ayvsr8',
    'x-async': true,
  },
};
export const oneTableWithInheritFields = {
  collections: [
    {
      name: 'parent',
      fields: [
        {
          name: 'parentField1',
          interface: 'input',
        },
        {
          name: 'parentField2',
          interface: 'input',
        },
      ],
    },
    {
      name: 'child',
      fields: [
        {
          name: 'childField1',
          interface: 'input',
        },
        {
          name: 'childField2',
          interface: 'input',
        },
      ],
      inherits: ['parent'],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '2c65dc2ect7': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          u6fd3y5jsw4: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.15',
            properties: {
              '0cftszpeysq': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.15',
                properties: {
                  zkqmsvk69kb: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'child:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'child',
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
                    'x-app-version': '0.21.0-alpha.15',
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
                        'x-app-version': '0.21.0-alpha.15',
                        'x-uid': 'iwm93jhfwrx',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pglwezl7vl4: {
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
                        'x-app-version': '0.21.0-alpha.15',
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
                            'x-app-version': '0.21.0-alpha.15',
                            properties: {
                              '91704g8ido3': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.15',
                                'x-uid': 'qg83y0l4rvz',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '3v1d4gomwrc',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'r3si3q9zpil',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'upsr773evx4',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'sf3i4eqykta',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 've6jepsuju1',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '89f529bg5kn',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'hfgygvnm6sc',
    'x-async': true,
    'x-index': 1,
  },
};

export const oneTableWithColumnFixed = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.0.0-alpha.10',
    properties: {
      yww8wuk4e6y: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.0.0-alpha.10',
        properties: {
          gtnfdxyqpi0: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.0.0-alpha.10',
            properties: {
              '9ba8flxjeca': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.0.0-alpha.10',
                properties: {
                  m3wh5fnv3vp: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'users',
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
                    'x-app-version': '1.0.0-alpha.10',
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
                        'x-app-version': '1.0.0-alpha.10',
                        'x-uid': 'n2y7ou2p2wa',
                        'x-async': false,
                        'x-index': 1,
                      },
                      qk5g79umr0x: {
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
                        'x-app-version': '1.0.0-alpha.10',
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
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              '8q96u8n4zk6': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'cexpfldzxtv',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'z8sbf2znupi',
                            'x-async': false,
                            'x-index': 1,
                          },
                          qs7ufydst6r: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
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
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'ofeje72uwbw',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '1l0mk3srye1',
                            'x-async': false,
                            'x-index': 2,
                          },
                          yjpcdzbv6vt: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              nickname: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.nickname',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': '8cgwhhyntsx',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'plph8lny217',
                            'x-async': false,
                            'x-index': 3,
                          },
                          u7nx3h25r5x: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              username: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.username',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'hwsuo135bc9',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'jiq66delc99',
                            'x-async': false,
                            'x-index': 4,
                          },
                          y23i0bmugmj: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              email: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.email',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'y8sgqu6yhff',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'tnumvo1muqm',
                            'x-async': false,
                            'x-index': 5,
                          },
                          gkcqigb7ha6: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              phone: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.phone',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'vedpxu2h7al',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'cwo8brhj01b',
                            'x-async': false,
                            'x-index': 6,
                          },
                          f5llvgbzfjr: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              password: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.password',
                                'x-component': 'CollectionField',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'x9w416kum84',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '9181v3qx77q',
                            'x-async': false,
                            'x-index': 7,
                          },
                          nxrbywda9he: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              createdAt: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.createdAt',
                                'x-component': 'CollectionField',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'kyeuhy1m8wf',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'd8n1jad6kbi',
                            'x-async': false,
                            'x-index': 8,
                          },
                          '9x44uvwxbz6': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              updatedAt: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.updatedAt',
                                'x-component': 'CollectionField',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'cq9ly116acz',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'iophqq5njwx',
                            'x-async': false,
                            'x-index': 9,
                          },
                          k5l3ztsblxs: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              createdBy: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.createdBy',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                properties: {
                                  viewer: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'RecordPicker.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-app-version': '1.0.0-alpha.10',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '1.0.0-alpha.10',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.0.0-alpha.10',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '1.0.0-alpha.10',
                                                'x-uid': 'apisx51sp0v',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'fi0sgiq0j5z',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'egth9jt9vfh',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'wn5g6m4ujqu',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '5ilkbnzuli2',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'eo2yfzk9140',
                            'x-async': false,
                            'x-index': 10,
                          },
                          qzsn17173e7: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            properties: {
                              updatedBy: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.updatedBy',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                properties: {
                                  viewer: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'RecordPicker.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-app-version': '1.0.0-alpha.10',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '1.0.0-alpha.10',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.0.0-alpha.10',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '1.0.0-alpha.10',
                                                'x-uid': '7p1cw61ik1a',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ftv9oucokpk',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 't4xgz4j6qyr',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'emi1u3tte2z',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'g54j812hfq9',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '1wudcamw562',
                            'x-async': false,
                            'x-index': 11,
                          },
                          '87nvcyc8blb': {
                            'x-uid': 'wlcan8llggi',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.10',
                            'x-component-props': {
                              fixed: 'left',
                            },
                            properties: {
                              roles: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.roles',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    value: 'name',
                                    label: 'name',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.10',
                                'x-uid': 'zt4te02lali',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-async': false,
                            'x-index': 12,
                          },
                        },
                        'x-uid': 'b3q8ojj6utk',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'opeua2lp943',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'bmjq8wkrds6',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '9cs52kf5con',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'vxpirluqi4j',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'bygf7rii5pb',
    'x-async': true,
    'x-index': 1,
  },
};

export const T4334 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.0.0-alpha.15',
    properties: {
      rvg8uzoyiqr: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.0.0-alpha.15',
        properties: {
          eyyuzltv82h: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.0.0-alpha.15',
            properties: {
              f93ykhxx0h0: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.0.0-alpha.15',
                properties: {
                  '0jbwl9p9cee': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'roles:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'roles',
                      dataSource: 'main',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'name',
                      showIndex: true,
                      dragSort: false,
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:table',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-app-version': '1.0.0-alpha.15',
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
                        'x-app-version': '1.0.0-alpha.15',
                        'x-uid': 'ltu1s4sftkq',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '3zd4hrtqbok': {
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
                        'x-app-version': '1.0.0-alpha.15',
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
                            'x-app-version': '1.0.0-alpha.15',
                            properties: {
                              i0541jst5v1: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.0.0-alpha.15',
                                properties: {
                                  z2u0eaesntx: {
                                    'x-uid': 'u8lmxvhihd3',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Edit") }}',
                                    'x-action': 'update',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:edit',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      icon: 'EditOutlined',
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-linkage-rules': [
                                      {
                                        condition: {
                                          $and: [
                                            {
                                              name: {
                                                $includes: 'root',
                                              },
                                            },
                                          ],
                                        },
                                        actions: [
                                          {
                                            operator: 'hidden',
                                          },
                                        ],
                                      },
                                    ],
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
                                                title: '{{t("Edit")}}',
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
                                                    'x-uid': 'm44q6lmbk36',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'fh5wb0w6orc',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'nygmtp0bvk8',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 't0xdl10gs6u',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': '45pu2cds91r',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'dwe4sbx1z9u',
                            'x-async': false,
                            'x-index': 1,
                          },
                          i3vbcsnk9j2: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.15',
                            properties: {
                              name: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'roles.name',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.15',
                                'x-uid': 'b5rhf9kykg4',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'jwdxdtq3o7c',
                            'x-async': false,
                            'x-index': 2,
                          },
                          jk6q4wha3s7: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.0.0-alpha.15',
                            properties: {
                              title: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'roles.title',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.15',
                                'x-uid': '211txpri1j5',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'rbndx2vuu67',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': 's8vb1dd5i6h',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'gg6xhjb5cl9',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '99jqghgowlk',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'j3i2en7cbx0',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'ribk031tkp8',
        'x-async': false,
        'x-index': 1,
      },
    },
  },
};

export const ordinaryBlockTemplatesCannotBeUsedToCreateAssociationBlocksAndViceVersa = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.2.12-alpha',
    'x-index': 1,
    properties: {
      vp18xr4s94r: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.2.12-alpha',
        'x-index': 1,
        properties: {
          '48xijrvwe7f': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.12-alpha',
            'x-index': 1,
            properties: {
              a01jv0ma085: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.12-alpha',
                'x-index': 1,
                properties: {
                  nkjq9mnwl3t: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'users',
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
                    'x-app-version': '1.2.12-alpha',
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
                        'x-app-version': '1.2.12-alpha',
                        'x-index': 1,
                        'x-uid': 'lo4ajp7tg96',
                        'x-async': false,
                      },
                      r6045g8do83: {
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
                        'x-app-version': '1.2.12-alpha',
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
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-initializer': 'table:configureItemActions',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-toolbar-props': {
                              initializer: 'table:configureItemActions',
                            },
                            'x-app-version': '1.2.12-alpha',
                            'x-index': 1,
                            properties: {
                              kw1qyuhqrnx: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.12-alpha',
                                'x-index': 1,
                                properties: {
                                  '53cdeamnxph': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
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
                                        title: '{{ t("View record") }}',
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
                                            'x-initializer': 'popup:addTab',
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
                                                      '1pwkkpqufg4': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.12-alpha',
                                                        'x-index': 1,
                                                        properties: {
                                                          '410gicqpds5': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.12-alpha',
                                                            'x-index': 1,
                                                            properties: {
                                                              vbb6lo1bnqc: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableBlockProvider',
                                                                'x-acl-action': 'users.roles:list',
                                                                'x-use-decorator-props': 'useTableBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  association: 'users.roles',
                                                                  dataSource: 'main',
                                                                  action: 'list',
                                                                  params: {
                                                                    pageSize: 20,
                                                                  },
                                                                  rowKey: 'name',
                                                                  showIndex: true,
                                                                  dragSort: false,
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:table',
                                                                'x-component': 'CardItem',
                                                                'x-filter-targets': [],
                                                                'x-app-version': '1.2.12-alpha',
                                                                'x-component-props': {
                                                                  title: '关系区块的模板，不能用于创建普通区块',
                                                                },
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
                                                                    'x-app-version': '1.2.12-alpha',
                                                                    'x-index': 1,
                                                                    'x-uid': '89jsznsarlc',
                                                                    'x-async': false,
                                                                  },
                                                                  '5mevwu3x22a': {
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
                                                                    'x-app-version': '1.2.12-alpha',
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
                                                                        'x-toolbar': 'TableColumnSchemaToolbar',
                                                                        'x-initializer': 'table:configureItemActions',
                                                                        'x-settings': 'fieldSettings:TableColumn',
                                                                        'x-toolbar-props': {
                                                                          initializer: 'table:configureItemActions',
                                                                        },
                                                                        'x-app-version': '1.2.12-alpha',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          lobrzqzg75z: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.12-alpha',
                                                                            'x-index': 1,
                                                                            'x-uid': 't9lq3pqh9h1',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': '8aph6mvtbaw',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': '55dwvglgnmi',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'mwxf08z03rr',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': '62g2wjaszmy',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': '6g3vj6hb2lg',
                                                        'x-async': false,
                                                      },
                                                      r3lzmtigz5q: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.12-alpha',
                                                        'x-index': 2,
                                                        properties: {
                                                          rmopf61sxaz: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.12-alpha',
                                                            'x-index': 1,
                                                            properties: {
                                                              '03ilzp6slqk': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'users.roles:view',
                                                                'x-decorator': 'DetailsBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useDetailsWithPaginationDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  association: 'users.roles',
                                                                  readPretty: true,
                                                                  action: 'list',
                                                                  params: {
                                                                    pageSize: 1,
                                                                  },
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:detailsWithPagination',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.2.12-alpha',
                                                                'x-component-props': {
                                                                  title:
                                                                    '关系详情区块模板，应该显示在 Current record 不显示在 Other records',
                                                                },
                                                                'x-index': 1,
                                                                properties: {
                                                                  cdskpgjl62l: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Details',
                                                                    'x-read-pretty': true,
                                                                    'x-use-component-props':
                                                                      'useDetailsWithPaginationProps',
                                                                    'x-app-version': '1.2.12-alpha',
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      q8kra0mo3on: {
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
                                                                        'x-app-version': '1.2.12-alpha',
                                                                        'x-index': 1,
                                                                        'x-uid': 'dbcwxoi2byj',
                                                                        'x-async': false,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        'x-app-version': '1.2.12-alpha',
                                                                        'x-index': 2,
                                                                        'x-uid': 'gb7bawzlsa3',
                                                                        'x-async': false,
                                                                      },
                                                                      pagination: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Pagination',
                                                                        'x-use-component-props':
                                                                          'useDetailsPaginationProps',
                                                                        'x-app-version': '1.2.12-alpha',
                                                                        'x-index': 3,
                                                                        'x-uid': '97u0q2xu0py',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'khwmfni4kxq',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'siec695mn67',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': 'vphskdrk6yl',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': 'vgsps35j6we',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': '0hvmphl4vke',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'zmlej955vyh',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': '0ljl5s1wrv4',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'u9dly44dmb5',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'fdfbyibqlt9',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'dxqtinx68eu',
                                'x-async': false,
                              },
                            },
                            'x-uid': '8quw3whqnlu',
                            'x-async': false,
                          },
                          iejl76kjob6: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.2.12-alpha',
                            properties: {
                              roles: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.roles',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    value: 'name',
                                    label: 'name',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.2.12-alpha',
                                properties: {
                                  '1bvhtfs19vo': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'AssociationField.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-index': 1,
                                    'x-app-version': '1.2.12-alpha',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '1.2.12-alpha',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.2.12-alpha',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '1.2.12-alpha',
                                                properties: {
                                                  '7y164ln4t02': {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    'x-app-version': '1.2.12-alpha',
                                                    properties: {
                                                      xvah1ee6t1s: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        'x-app-version': '1.2.12-alpha',
                                                        properties: {
                                                          '9s7dkj8074h': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-acl-action': 'users.roles:get',
                                                            'x-decorator': 'DetailsBlockProvider',
                                                            'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                            'x-decorator-props': {
                                                              dataSource: 'main',
                                                              association: 'users.roles',
                                                              readPretty: true,
                                                              action: 'get',
                                                            },
                                                            'x-toolbar': 'BlockSchemaToolbar',
                                                            'x-settings': 'blockSettings:details',
                                                            'x-component': 'CardItem',
                                                            'x-is-current': true,
                                                            'x-app-version': '1.2.12-alpha',
                                                            properties: {
                                                              '531zk0xnik4': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Details',
                                                                'x-read-pretty': true,
                                                                'x-use-component-props': 'useDetailsProps',
                                                                'x-app-version': '1.2.12-alpha',
                                                                properties: {
                                                                  '3omnlflcggh': {
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
                                                                    'x-app-version': '1.2.12-alpha',
                                                                    'x-uid': 'ym6lh2x98dj',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  grid: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid',
                                                                    'x-initializer': 'details:configureFields',
                                                                    'x-app-version': '1.2.12-alpha',
                                                                    'x-uid': 'qqtgr6x5ymn',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'rb5nttjwcvw',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'vl2i6hfkkl8',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'r02zci8a2b9',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'h7944lifss1',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'folxpxboig0',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'lj3p0oeb0mp',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '0tl5555ulg9',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'layx1foi3xz',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '084q5ucj2hg',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'uag0rx0s4j3',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'rf2ulrqfw0r',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'd7c6p0kxuga',
                    'x-async': false,
                  },
                },
                'x-uid': 'ufl6l2izdx8',
                'x-async': false,
              },
            },
            'x-uid': 'o2nc3g5be81',
            'x-async': false,
          },
          maf7gojs1zc: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.12-alpha',
            'x-index': 2,
            properties: {
              '6trihtcvyik': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.12-alpha',
                'x-index': 1,
                properties: {
                  wjj8dg4gupk: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'roles:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'roles',
                      dataSource: 'main',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'name',
                      showIndex: true,
                      dragSort: false,
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:table',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-app-version': '1.2.12-alpha',
                    'x-component-props': {
                      title: '普通区块的模板，不能用于创建关系区块',
                    },
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
                        'x-app-version': '1.2.12-alpha',
                        'x-index': 1,
                        'x-uid': '93zayim5y7t',
                        'x-async': false,
                      },
                      '1uuqwvjlji9': {
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
                        'x-app-version': '1.2.12-alpha',
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
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-initializer': 'table:configureItemActions',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-toolbar-props': {
                              initializer: 'table:configureItemActions',
                            },
                            'x-app-version': '1.2.12-alpha',
                            'x-index': 1,
                            properties: {
                              '5n2lezgtg4q': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.12-alpha',
                                'x-index': 1,
                                'x-uid': 't9o0l4b3jjf',
                                'x-async': false,
                              },
                            },
                            'x-uid': '834ecrjnrz7',
                            'x-async': false,
                          },
                        },
                        'x-uid': '9argmfxe42w',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'bakwhqmelgh',
                    'x-async': false,
                  },
                },
                'x-uid': 't5tifk4xmwz',
                'x-async': false,
              },
            },
            'x-uid': 'g8r6sibh2yq',
            'x-async': false,
          },
        },
        'x-uid': 'j0lfty8wr99',
        'x-async': false,
      },
    },
    'x-uid': 'mratid7w4zu',
    'x-async': true,
  },
};

export const T4942 = {
  collections: [
    {
      name: 'collection1',
      fields: [
        {
          interface: 'm2o',
          name: 'manyToOne1',
          target: 'collection2',
        },
      ],
    },
    {
      name: 'collection2',
      fields: [
        {
          interface: 'm2o',
          name: 'manyToOne2',
          target: 'collection3',
        },
      ],
    },
    {
      name: 'collection3',
      fields: [{ interface: 'input', name: 'field1' }],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      gietupulya5: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          gyp6czp73wk: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.34-alpha',
            properties: {
              '1ajolx72bp5': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.34-alpha',
                properties: {
                  wgwjrzpjb46: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'collection1:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'collection1',
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
                    'x-app-version': '1.2.34-alpha',
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
                        'x-app-version': '1.2.34-alpha',
                        'x-uid': 'vt14g7yqceq',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '4g4v3tfs2ml': {
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
                        'x-app-version': '1.2.34-alpha',
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
                            'x-app-version': '1.2.34-alpha',
                            properties: {
                              c9kah38ersq: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.34-alpha',
                                'x-uid': 'mjg0y0l542i',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'qltvfj6o636',
                            'x-async': false,
                            'x-index': 1,
                          },
                          q89848gjz6w: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.2.34-alpha',
                            properties: {
                              'manyToOne1.manyToOne2': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-component': 'CollectionField',
                                'x-read-pretty': true,
                                'x-collection-field': 'collection1.manyToOne1.manyToOne2',
                                'x-component-props': {
                                  fieldNames: {
                                    value: 'id',
                                    label: 'id',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                },
                                'x-app-version': '1.2.34-alpha',
                                properties: {
                                  '5j1v2ecmxni': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'AssociationField.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-index': 1,
                                    'x-app-version': '1.2.34-alpha',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '1.2.34-alpha',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.2.34-alpha',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '1.2.34-alpha',
                                                properties: {
                                                  s0p3nt7zhyw: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    'x-app-version': '1.2.34-alpha',
                                                    properties: {
                                                      gf3b29ty19n: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        'x-app-version': '1.2.34-alpha',
                                                        properties: {
                                                          u8jzln7uovy: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-acl-action': 'collection2.manyToOne2:get',
                                                            'x-decorator': 'DetailsBlockProvider',
                                                            'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                            'x-decorator-props': {
                                                              dataSource: 'main',
                                                              association: 'collection2.manyToOne2',
                                                              readPretty: true,
                                                              action: 'get',
                                                            },
                                                            'x-toolbar': 'BlockSchemaToolbar',
                                                            'x-settings': 'blockSettings:details',
                                                            'x-component': 'CardItem',
                                                            'x-is-current': true,
                                                            'x-app-version': '1.2.34-alpha',
                                                            properties: {
                                                              '3zqugaam6ef': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Details',
                                                                'x-read-pretty': true,
                                                                'x-use-component-props': 'useDetailsProps',
                                                                'x-app-version': '1.2.34-alpha',
                                                                properties: {
                                                                  zviz7m97b07: {
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
                                                                    'x-app-version': '1.2.34-alpha',
                                                                    'x-uid': 'nkqso1gzv6p',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  grid: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid',
                                                                    'x-initializer': 'details:configureFields',
                                                                    'x-app-version': '1.2.34-alpha',
                                                                    properties: {
                                                                      '36mth0l7n2v': {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Row',
                                                                        'x-app-version': '1.2.34-alpha',
                                                                        properties: {
                                                                          zpykwlwos9l: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Col',
                                                                            'x-app-version': '1.2.34-alpha',
                                                                            properties: {
                                                                              field1: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'string',
                                                                                'x-toolbar': 'FormItemSchemaToolbar',
                                                                                'x-settings': 'fieldSettings:FormItem',
                                                                                'x-component': 'CollectionField',
                                                                                'x-decorator': 'FormItem',
                                                                                'x-collection-field':
                                                                                  'collection3.field1',
                                                                                'x-component-props': {},
                                                                                'x-app-version': '1.2.34-alpha',
                                                                                'x-uid': 'gboyi91blj1',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'xqrhqfr6e8q',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'v0uyq6az6fb',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': '14xzvjcg5hq',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'k0ipmlnr0lo',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'h3mag8s3uet',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'p19iz8ia0my',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'halz5ecr26k',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'lnpz1z5fd0h',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'gli9nxpltqb',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'bvhk6mb3zar',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'qk4acu33rbi',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'mm8y0ky3qaz',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '6iep94y4qgb',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'l6c1rntmsly',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'u0o05lk778c',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'lki6ivvlzs2',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'nd5k4x2fn3a',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'qe16f8am538',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'jlc3g38jakh',
    'x-async': true,
    'x-index': 1,
  },
};

export const testingWithPageMode = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '4hkzwf7xiwx': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '8876jkmbc0j': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.8-alpha',
            properties: {
              '8hg0vhy0tz0': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.8-alpha',
                properties: {
                  ejbnvzcacpb: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'users',
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
                    'x-app-version': '1.2.8-alpha',
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
                        'x-app-version': '1.2.8-alpha',
                        'x-uid': 'hb16vet3e9h',
                        'x-async': false,
                        'x-index': 1,
                      },
                      b1fkx7l3lqk: {
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
                        'x-app-version': '1.2.8-alpha',
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
                            'x-app-version': '1.2.8-alpha',
                            properties: {
                              '9d3q7flbesh': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.8-alpha',
                                properties: {
                                  md90hk6dgga: {
                                    'x-uid': 'ud03p691p2i',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      iconColor: '#1677FF',
                                      danger: false,
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
                                                    properties: {
                                                      sl3cha2cvm9: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.8-alpha',
                                                        properties: {
                                                          efcxs5deb11: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.8-alpha',
                                                            properties: {
                                                              cq3c4x58uv8: {
                                                                'x-uid': '48ndgvjusx0',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'users:get',
                                                                'x-decorator': 'DetailsBlockProvider',
                                                                'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  collection: 'users',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:details',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.2.8-alpha',
                                                                'x-component-props': {
                                                                  title: 'Details',
                                                                },
                                                                properties: {
                                                                  qzudlhn0oci: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Details',
                                                                    'x-read-pretty': true,
                                                                    'x-use-component-props': 'useDetailsProps',
                                                                    'x-app-version': '1.2.8-alpha',
                                                                    properties: {
                                                                      hhuvprt9qkx: {
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
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        'x-uid': 't532hppuhhd',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        properties: {
                                                                          rcqh876sdp3: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.2.8-alpha',
                                                                            properties: {
                                                                              '399yhxj2n3k': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.2.8-alpha',
                                                                                properties: {
                                                                                  nickname: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'users.nickname',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.2.8-alpha',
                                                                                    'x-uid': '0jxfoc7hndh',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': '4qljzi4ndyv',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'ne81cyfsbjb',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'hk6i6c12h3i',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'ztg6637y1ne',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '9adrj3pcevi',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'cl10ahmo9by',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                      ldd6v9tyucb: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.8-alpha',
                                                        properties: {
                                                          pstw5adsq5o: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.8-alpha',
                                                            properties: {
                                                              zz234wka6vz: {
                                                                'x-uid': 'te1we7isnhz',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'users.roles:view',
                                                                'x-decorator': 'DetailsBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useDetailsWithPaginationDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  association: 'users.roles',
                                                                  readPretty: true,
                                                                  action: 'list',
                                                                  params: {
                                                                    pageSize: 1,
                                                                  },
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:detailsWithPagination',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.2.8-alpha',
                                                                'x-component-props': {
                                                                  title: 'Association block',
                                                                },
                                                                properties: {
                                                                  l9udri1zsv7: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Details',
                                                                    'x-read-pretty': true,
                                                                    'x-use-component-props':
                                                                      'useDetailsWithPaginationProps',
                                                                    'x-app-version': '1.2.8-alpha',
                                                                    properties: {
                                                                      grvze9sdawq: {
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
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        'x-uid': 'wk0gfg70k0c',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        properties: {
                                                                          v8bvtnoja3x: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.2.8-alpha',
                                                                            properties: {
                                                                              e2vli230fql: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.2.8-alpha',
                                                                                properties: {
                                                                                  name: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'roles.name',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.2.8-alpha',
                                                                                    'x-uid': 'leeamsjfgqn',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'usgby9v925w',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '69c6wchsh5b',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'cfbf2ty6rhz',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                      pagination: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Pagination',
                                                                        'x-use-component-props':
                                                                          'useDetailsPaginationProps',
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        'x-uid': 'ap394y0ezco',
                                                                        'x-async': false,
                                                                        'x-index': 3,
                                                                      },
                                                                    },
                                                                    'x-uid': 'g7bo1djalz6',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'p6pjlaeabar',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'vt1zgkhdrl8',
                                                        'x-async': false,
                                                        'x-index': 2,
                                                      },
                                                      row_e36fkny8odp: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 3,
                                                        properties: {
                                                          qmc56j0ey82: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              xkykwl13upy: {
                                                                'x-uid': 'witajgm9436',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-settings': 'blockSettings:markdown',
                                                                'x-decorator': 'CardItem',
                                                                'x-decorator-props': {
                                                                  name: 'markdown',
                                                                },
                                                                'x-component': 'Markdown.Void',
                                                                'x-editable': false,
                                                                'x-component-props': {
                                                                  content:
                                                                    '--- \n\nThe following blocks all use variables.',
                                                                },
                                                                'x-app-version': '1.2.8-alpha',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'u9slxyqyjva',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'c15ckwf9bfh',
                                                        'x-async': false,
                                                      },
                                                      '7ek9blpx7sw': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.8-alpha',
                                                        properties: {
                                                          s3djmoa1kdm: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.8-alpha',
                                                            properties: {
                                                              t4yomnfik7v: {
                                                                'x-uid': '2ntepquubp8',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: true,
                                                                },
                                                                'x-acl-action': 'users.roles:create',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useCreateFormBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  association: 'users.roles',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:createForm',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.2.8-alpha',
                                                                'x-component-props': {
                                                                  title: 'Variable: Current role',
                                                                },
                                                                properties: {
                                                                  gpegyxxlg9s: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useCreateFormBlockProps',
                                                                    'x-app-version': '1.2.8-alpha',
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        properties: {
                                                                          '8rcj0xfttuu': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.2.8-alpha',
                                                                            properties: {
                                                                              '0v4kqye0ibq': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.2.8-alpha',
                                                                                properties: {
                                                                                  title: {
                                                                                    'x-uid': 'u2s2tzdej9l',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'roles.title',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.2.8-alpha',
                                                                                    default: '{{$nRole}}',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'jjw69unhi73',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'dos9kkrtudw',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '87bd6es8q0u',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      '27pckgxgpfj': {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'createForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 'var(--nb-spacing)',
                                                                          },
                                                                        },
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        'x-uid': 'dkfshq47o8i',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': '4gz0unx7rya',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'wr8env9e30j',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'mcmyeg3147y',
                                                        'x-async': false,
                                                        'x-index': 4,
                                                      },
                                                      rjt3znbrf3q: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.8-alpha',
                                                        properties: {
                                                          '4uxjny23hm5': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.8-alpha',
                                                            properties: {
                                                              e93x4mhkui9: {
                                                                'x-uid': '1ppi52hawn4',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: true,
                                                                },
                                                                'x-acl-action': 'users:create',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useCreateFormBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  collection: 'users',
                                                                  isCusomeizeCreate: true,
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:createForm',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.2.8-alpha',
                                                                'x-component-props': {
                                                                  title: 'Variable: Current popup record',
                                                                },
                                                                properties: {
                                                                  szglhz28rug: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useCreateFormBlockProps',
                                                                    'x-app-version': '1.2.8-alpha',
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        properties: {
                                                                          j6yhv8x9v6m: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.2.8-alpha',
                                                                            properties: {
                                                                              '0vb82er0zyq': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.2.8-alpha',
                                                                                properties: {
                                                                                  nickname: {
                                                                                    'x-uid': '35o8hx997k2',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'users.nickname',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.2.8-alpha',
                                                                                    default:
                                                                                      '{{$nPopupRecord.nickname}}',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'lywj2998nly',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'lin5pq4bpex',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'p6x3vd3fhez',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      dvj11mlfnah: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'createForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 'var(--nb-spacing)',
                                                                          },
                                                                        },
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        'x-uid': 'gma9mwzv4dr',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'l5a4ychqmrs',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '9168tscxqr0',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '610enru817y',
                                                        'x-async': false,
                                                        'x-index': 5,
                                                      },
                                                      '6vt3eg1fdkf': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.8-alpha',
                                                        properties: {
                                                          ukqk042qbtz: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.8-alpha',
                                                            'x-uid': 'ejjhbc28t3p',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'q3j2vgv8gfg',
                                                        'x-async': false,
                                                        'x-index': 6,
                                                      },
                                                      h7pk2zbtoe2: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.8-alpha',
                                                        properties: {
                                                          '9cnceetg9e3': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.8-alpha',
                                                            properties: {
                                                              xnp9sk5bp8n: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableBlockProvider',
                                                                'x-acl-action': 'users.roles:list',
                                                                'x-use-decorator-props': 'useTableBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  association: 'users.roles',
                                                                  dataSource: 'main',
                                                                  action: 'list',
                                                                  params: {
                                                                    pageSize: 20,
                                                                  },
                                                                  rowKey: 'name',
                                                                  showIndex: true,
                                                                  dragSort: false,
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:table',
                                                                'x-component': 'CardItem',
                                                                'x-filter-targets': [],
                                                                'x-app-version': '1.2.8-alpha',
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
                                                                    'x-app-version': '1.2.8-alpha',
                                                                    'x-uid': '1q67rp6unjp',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  msso4r8x4u3: {
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
                                                                    'x-app-version': '1.2.8-alpha',
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
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        properties: {
                                                                          vrn0nxktd4u: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.8-alpha',
                                                                            properties: {
                                                                              kpqrl0kgpyb: {
                                                                                'x-uid': 'obkauwgfgq7',
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: 'View role',
                                                                                'x-action': 'view',
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings': 'actionSettings:view',
                                                                                'x-component': 'Action.Link',
                                                                                'x-component-props': {
                                                                                  openMode: 'drawer',
                                                                                  iconColor: '#1677FF',
                                                                                  danger: false,
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
                                                                                            'x-component':
                                                                                              'Tabs.TabPane',
                                                                                            'x-designer':
                                                                                              'Tabs.Designer',
                                                                                            'x-component-props': {},
                                                                                            properties: {
                                                                                              grid: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component': 'Grid',
                                                                                                'x-initializer':
                                                                                                  'popup:common:addBlock',
                                                                                                properties: {
                                                                                                  heliwtqu3eq: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.8-alpha',
                                                                                                    properties: {
                                                                                                      jbt07chbalw: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.8-alpha',
                                                                                                        properties: {
                                                                                                          i437g06welg: {
                                                                                                            'x-uid':
                                                                                                              'edf63ztrbxq',
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-acl-action':
                                                                                                              'users.roles:get',
                                                                                                            'x-decorator':
                                                                                                              'DetailsBlockProvider',
                                                                                                            'x-use-decorator-props':
                                                                                                              'useDetailsDecoratorProps',
                                                                                                            'x-decorator-props':
                                                                                                              {
                                                                                                                dataSource:
                                                                                                                  'main',
                                                                                                                association:
                                                                                                                  'users.roles',
                                                                                                                readPretty:
                                                                                                                  true,
                                                                                                                action:
                                                                                                                  'get',
                                                                                                              },
                                                                                                            'x-toolbar':
                                                                                                              'BlockSchemaToolbar',
                                                                                                            'x-settings':
                                                                                                              'blockSettings:details',
                                                                                                            'x-component':
                                                                                                              'CardItem',
                                                                                                            'x-is-current':
                                                                                                              true,
                                                                                                            'x-app-version':
                                                                                                              '1.2.8-alpha',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                title:
                                                                                                                  'Details',
                                                                                                              },
                                                                                                            properties:
                                                                                                              {
                                                                                                                u0gd3xb9lu3:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Details',
                                                                                                                    'x-read-pretty':
                                                                                                                      true,
                                                                                                                    'x-use-component-props':
                                                                                                                      'useDetailsProps',
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.8-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        b8zdned1saz:
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
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.8-alpha',
                                                                                                                            'x-uid':
                                                                                                                              'plxpukolwn4',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
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
                                                                                                                          'x-app-version':
                                                                                                                            '1.2.8-alpha',
                                                                                                                          properties:
                                                                                                                            {
                                                                                                                              mz536stgwkv:
                                                                                                                                {
                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                    true,
                                                                                                                                  version:
                                                                                                                                    '2.0',
                                                                                                                                  type: 'void',
                                                                                                                                  'x-component':
                                                                                                                                    'Grid.Row',
                                                                                                                                  'x-app-version':
                                                                                                                                    '1.2.8-alpha',
                                                                                                                                  properties:
                                                                                                                                    {
                                                                                                                                      '8yutqqodl7q':
                                                                                                                                        {
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'void',
                                                                                                                                          'x-component':
                                                                                                                                            'Grid.Col',
                                                                                                                                          'x-app-version':
                                                                                                                                            '1.2.8-alpha',
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              title:
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
                                                                                                                                                    'roles.title',
                                                                                                                                                  'x-component-props':
                                                                                                                                                    {},
                                                                                                                                                  'x-app-version':
                                                                                                                                                    '1.2.8-alpha',
                                                                                                                                                  'x-uid':
                                                                                                                                                    'oll0umtp7tn',
                                                                                                                                                  'x-async':
                                                                                                                                                    false,
                                                                                                                                                  'x-index': 1,
                                                                                                                                                },
                                                                                                                                            },
                                                                                                                                          'x-uid':
                                                                                                                                            '75ns4lofnq7',
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                          'x-index': 1,
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                  'x-uid':
                                                                                                                                    'tytsnjz1iji',
                                                                                                                                  'x-async':
                                                                                                                                    false,
                                                                                                                                  'x-index': 1,
                                                                                                                                },
                                                                                                                            },
                                                                                                                          'x-uid':
                                                                                                                            'q9wcv2kt2n2',
                                                                                                                          'x-async':
                                                                                                                            false,
                                                                                                                          'x-index': 2,
                                                                                                                        },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'qyzoxdhemtt',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '1v4p33jtwx0',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'i8qn6tn2etg',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                  f0ugu63rh9c: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.8-alpha',
                                                                                                    properties: {
                                                                                                      skrtxdw11vg: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.8-alpha',
                                                                                                        properties: {
                                                                                                          b6wpu86agsn: {
                                                                                                            'x-uid':
                                                                                                              'fkcab93zwgk',
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-decorator':
                                                                                                              'TableBlockProvider',
                                                                                                            'x-acl-action':
                                                                                                              'roles:list',
                                                                                                            'x-use-decorator-props':
                                                                                                              'useTableBlockDecoratorProps',
                                                                                                            'x-decorator-props':
                                                                                                              {
                                                                                                                collection:
                                                                                                                  'roles',
                                                                                                                dataSource:
                                                                                                                  'main',
                                                                                                                action:
                                                                                                                  'list',
                                                                                                                params:
                                                                                                                  {
                                                                                                                    pageSize: 20,
                                                                                                                    filter:
                                                                                                                      {
                                                                                                                        $and: [
                                                                                                                          {
                                                                                                                            name: {
                                                                                                                              $includes:
                                                                                                                                '{{$nParentPopupRecord.roles.name}}',
                                                                                                                            },
                                                                                                                          },
                                                                                                                        ],
                                                                                                                      },
                                                                                                                  },
                                                                                                                rowKey:
                                                                                                                  'name',
                                                                                                                showIndex:
                                                                                                                  true,
                                                                                                                dragSort:
                                                                                                                  false,
                                                                                                              },
                                                                                                            'x-toolbar':
                                                                                                              'BlockSchemaToolbar',
                                                                                                            'x-settings':
                                                                                                              'blockSettings:table',
                                                                                                            'x-component':
                                                                                                              'CardItem',
                                                                                                            'x-filter-targets':
                                                                                                              [],
                                                                                                            'x-app-version':
                                                                                                              '1.2.8-alpha',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                title:
                                                                                                                  "Use 'Parent popup recor' in data scope",
                                                                                                              },
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
                                                                                                                      'table:configureActions',
                                                                                                                    'x-component':
                                                                                                                      'ActionBar',
                                                                                                                    'x-component-props':
                                                                                                                      {
                                                                                                                        style:
                                                                                                                          {
                                                                                                                            marginBottom:
                                                                                                                              'var(--nb-spacing)',
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.8-alpha',
                                                                                                                    'x-uid':
                                                                                                                      'n45qyt4l7p8',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                                pld27iksvjt:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'array',
                                                                                                                    'x-initializer':
                                                                                                                      'table:configureColumns',
                                                                                                                    'x-component':
                                                                                                                      'TableV2',
                                                                                                                    'x-use-component-props':
                                                                                                                      'useTableBlockProps',
                                                                                                                    'x-component-props':
                                                                                                                      {
                                                                                                                        rowKey:
                                                                                                                          'id',
                                                                                                                        rowSelection:
                                                                                                                          {
                                                                                                                            type: 'checkbox',
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.8-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        actions:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            title:
                                                                                                                              '{{ t("Actions") }}',
                                                                                                                            'x-action-column':
                                                                                                                              'actions',
                                                                                                                            'x-decorator':
                                                                                                                              'TableV2.Column.ActionBar',
                                                                                                                            'x-component':
                                                                                                                              'TableV2.Column',
                                                                                                                            'x-toolbar':
                                                                                                                              'TableColumnSchemaToolbar',
                                                                                                                            'x-initializer':
                                                                                                                              'table:configureItemActions',
                                                                                                                            'x-settings':
                                                                                                                              'fieldSettings:TableColumn',
                                                                                                                            'x-toolbar-props':
                                                                                                                              {
                                                                                                                                initializer:
                                                                                                                                  'table:configureItemActions',
                                                                                                                              },
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.8-alpha',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                pgr25kbm5zw:
                                                                                                                                  {
                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                      true,
                                                                                                                                    version:
                                                                                                                                      '2.0',
                                                                                                                                    type: 'void',
                                                                                                                                    'x-decorator':
                                                                                                                                      'DndContext',
                                                                                                                                    'x-component':
                                                                                                                                      'Space',
                                                                                                                                    'x-component-props':
                                                                                                                                      {
                                                                                                                                        split:
                                                                                                                                          '|',
                                                                                                                                      },
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.2.8-alpha',
                                                                                                                                    'x-uid':
                                                                                                                                      'f0cusyi0qg3',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'vg540gtmup2',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                        '9kuhit9axbf':
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-decorator':
                                                                                                                              'TableV2.Column.Decorator',
                                                                                                                            'x-toolbar':
                                                                                                                              'TableColumnSchemaToolbar',
                                                                                                                            'x-settings':
                                                                                                                              'fieldSettings:TableColumn',
                                                                                                                            'x-component':
                                                                                                                              'TableV2.Column',
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.8-alpha',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                title:
                                                                                                                                  {
                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                      true,
                                                                                                                                    version:
                                                                                                                                      '2.0',
                                                                                                                                    'x-collection-field':
                                                                                                                                      'roles.title',
                                                                                                                                    'x-component':
                                                                                                                                      'CollectionField',
                                                                                                                                    'x-component-props':
                                                                                                                                      {
                                                                                                                                        ellipsis:
                                                                                                                                          true,
                                                                                                                                      },
                                                                                                                                    'x-read-pretty':
                                                                                                                                      true,
                                                                                                                                    'x-decorator':
                                                                                                                                      null,
                                                                                                                                    'x-decorator-props':
                                                                                                                                      {
                                                                                                                                        labelStyle:
                                                                                                                                          {
                                                                                                                                            display:
                                                                                                                                              'none',
                                                                                                                                          },
                                                                                                                                      },
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.2.8-alpha',
                                                                                                                                    'x-uid':
                                                                                                                                      'w8tgvckzkgc',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'bj9txs37q50',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 2,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'cfpfvp6acu3',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 2,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'zxcdynph3qu',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '0obzkof2agt',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 2,
                                                                                                  },
                                                                                                  '9zm7fz6qs11': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.8-alpha',
                                                                                                    properties: {
                                                                                                      xn7xjfcea4f: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.8-alpha',
                                                                                                        properties: {
                                                                                                          h8iybxqo68a: {
                                                                                                            'x-uid':
                                                                                                              'ybylt4pirzc',
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-acl-action-props':
                                                                                                              {
                                                                                                                skipScopeCheck:
                                                                                                                  true,
                                                                                                              },
                                                                                                            'x-acl-action':
                                                                                                              'users:create',
                                                                                                            'x-decorator':
                                                                                                              'FormBlockProvider',
                                                                                                            'x-use-decorator-props':
                                                                                                              'useCreateFormBlockDecoratorProps',
                                                                                                            'x-decorator-props':
                                                                                                              {
                                                                                                                dataSource:
                                                                                                                  'main',
                                                                                                                collection:
                                                                                                                  'users',
                                                                                                                isCusomeizeCreate:
                                                                                                                  true,
                                                                                                              },
                                                                                                            'x-toolbar':
                                                                                                              'BlockSchemaToolbar',
                                                                                                            'x-settings':
                                                                                                              'blockSettings:createForm',
                                                                                                            'x-component':
                                                                                                              'CardItem',
                                                                                                            'x-app-version':
                                                                                                              '1.2.8-alpha',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                title:
                                                                                                                  "Use 'Current popup record' and 'Parent popup record' in linkage rules",
                                                                                                              },
                                                                                                            properties:
                                                                                                              {
                                                                                                                v515rcx3gq9:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'FormV2',
                                                                                                                    'x-use-component-props':
                                                                                                                      'useCreateFormBlockProps',
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.8-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        grid: {
                                                                                                                          'x-uid':
                                                                                                                            'rcl4n8ekgkc',
                                                                                                                          _isJSONSchemaObject:
                                                                                                                            true,
                                                                                                                          version:
                                                                                                                            '2.0',
                                                                                                                          type: 'void',
                                                                                                                          'x-component':
                                                                                                                            'Grid',
                                                                                                                          'x-initializer':
                                                                                                                            'form:configureFields',
                                                                                                                          'x-app-version':
                                                                                                                            '1.2.8-alpha',
                                                                                                                          'x-linkage-rules':
                                                                                                                            [
                                                                                                                              {
                                                                                                                                condition:
                                                                                                                                  {
                                                                                                                                    $and: [],
                                                                                                                                  },
                                                                                                                                actions:
                                                                                                                                  [
                                                                                                                                    {
                                                                                                                                      targetFields:
                                                                                                                                        [
                                                                                                                                          'nickname',
                                                                                                                                        ],
                                                                                                                                      operator:
                                                                                                                                        'value',
                                                                                                                                      value:
                                                                                                                                        {
                                                                                                                                          mode: 'express',
                                                                                                                                          value:
                                                                                                                                            '{{$nPopupRecord.name}}',
                                                                                                                                          result:
                                                                                                                                            '{{$nPopupRecord.name}}',
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                    {
                                                                                                                                      targetFields:
                                                                                                                                        [
                                                                                                                                          'username',
                                                                                                                                        ],
                                                                                                                                      operator:
                                                                                                                                        'value',
                                                                                                                                      value:
                                                                                                                                        {
                                                                                                                                          mode: 'express',
                                                                                                                                          value:
                                                                                                                                            '{{$nParentPopupRecord.username}}',
                                                                                                                                          result:
                                                                                                                                            '{{$nParentPopupRecord.username}}',
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                  ],
                                                                                                                              },
                                                                                                                            ],
                                                                                                                          properties:
                                                                                                                            {
                                                                                                                              mwpb4y1xvwc:
                                                                                                                                {
                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                    true,
                                                                                                                                  version:
                                                                                                                                    '2.0',
                                                                                                                                  type: 'void',
                                                                                                                                  'x-component':
                                                                                                                                    'Grid.Row',
                                                                                                                                  'x-app-version':
                                                                                                                                    '1.2.8-alpha',
                                                                                                                                  properties:
                                                                                                                                    {
                                                                                                                                      lznos2z04u7:
                                                                                                                                        {
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'void',
                                                                                                                                          'x-component':
                                                                                                                                            'Grid.Col',
                                                                                                                                          'x-app-version':
                                                                                                                                            '1.2.8-alpha',
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              nickname:
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
                                                                                                                                                    'users.nickname',
                                                                                                                                                  'x-component-props':
                                                                                                                                                    {},
                                                                                                                                                  'x-app-version':
                                                                                                                                                    '1.2.8-alpha',
                                                                                                                                                  'x-uid':
                                                                                                                                                    'i6av2tkto6l',
                                                                                                                                                  'x-async':
                                                                                                                                                    false,
                                                                                                                                                  'x-index': 1,
                                                                                                                                                },
                                                                                                                                            },
                                                                                                                                          'x-uid':
                                                                                                                                            '6cu6oi5rwle',
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                          'x-index': 1,
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                  'x-uid':
                                                                                                                                    'jzdbzph6mk7',
                                                                                                                                  'x-async':
                                                                                                                                    false,
                                                                                                                                  'x-index': 1,
                                                                                                                                },
                                                                                                                              avpc9774lpj:
                                                                                                                                {
                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                    true,
                                                                                                                                  version:
                                                                                                                                    '2.0',
                                                                                                                                  type: 'void',
                                                                                                                                  'x-component':
                                                                                                                                    'Grid.Row',
                                                                                                                                  'x-app-version':
                                                                                                                                    '1.2.8-alpha',
                                                                                                                                  properties:
                                                                                                                                    {
                                                                                                                                      '48k53nm8op9':
                                                                                                                                        {
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'void',
                                                                                                                                          'x-component':
                                                                                                                                            'Grid.Col',
                                                                                                                                          'x-app-version':
                                                                                                                                            '1.2.8-alpha',
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              username:
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
                                                                                                                                                    'users.username',
                                                                                                                                                  'x-component-props':
                                                                                                                                                    {},
                                                                                                                                                  'x-app-version':
                                                                                                                                                    '1.2.8-alpha',
                                                                                                                                                  'x-uid':
                                                                                                                                                    'gaunuwoypii',
                                                                                                                                                  'x-async':
                                                                                                                                                    false,
                                                                                                                                                  'x-index': 1,
                                                                                                                                                },
                                                                                                                                            },
                                                                                                                                          'x-uid':
                                                                                                                                            'kq6lpqn7sl4',
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                          'x-index': 1,
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                  'x-uid':
                                                                                                                                    'j8a0hpc8q38',
                                                                                                                                  'x-async':
                                                                                                                                    false,
                                                                                                                                  'x-index': 2,
                                                                                                                                },
                                                                                                                            },
                                                                                                                          'x-async':
                                                                                                                            false,
                                                                                                                          'x-index': 1,
                                                                                                                        },
                                                                                                                        ck43uehl6sb:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-initializer':
                                                                                                                              'createForm:configureActions',
                                                                                                                            'x-component':
                                                                                                                              'ActionBar',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                layout:
                                                                                                                                  'one-column',
                                                                                                                                style:
                                                                                                                                  {
                                                                                                                                    marginTop:
                                                                                                                                      'var(--nb-spacing)',
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.8-alpha',
                                                                                                                            'x-uid':
                                                                                                                              '8ypx0en4tuh',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 2,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'euep38x5ww3',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '5tm9p7yp7yw',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'pgkloesa9q5',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 3,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'zo0dy988kb8',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '9onrofp42n0',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '4ry5hqrw816',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '23ivl7e4cwd',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'hyx52cjis9q',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'y3oz74k0sde',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      u62b74oeoa3: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-decorator': 'TableV2.Column.Decorator',
                                                                        'x-toolbar': 'TableColumnSchemaToolbar',
                                                                        'x-settings': 'fieldSettings:TableColumn',
                                                                        'x-component': 'TableV2.Column',
                                                                        'x-app-version': '1.2.8-alpha',
                                                                        properties: {
                                                                          name: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            'x-collection-field': 'roles.name',
                                                                            'x-component': 'CollectionField',
                                                                            'x-component-props': {
                                                                              ellipsis: true,
                                                                            },
                                                                            'x-read-pretty': true,
                                                                            'x-decorator': null,
                                                                            'x-decorator-props': {
                                                                              labelStyle: {
                                                                                display: 'none',
                                                                              },
                                                                            },
                                                                            'x-app-version': '1.2.8-alpha',
                                                                            'x-uid': 'j62s7fv2rz1',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'vkh30z3hub8',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'o5aa8m8sv9y',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': '1c0ppas5bkq',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'ch4po0mfhpc',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'qzou4f5uq00',
                                                        'x-async': false,
                                                        'x-index': 7,
                                                      },
                                                    },
                                                    'x-uid': 'y3m6fzw3vxm',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'lzrgy21qagb',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '2d9k3mjqq5o',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'wqzj6suh29r',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '5ls6p9ujrlt',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ko8gsxd2z04',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'zds12bomc53',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '0dya4p8vlqd',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'ts6uc46oogs',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'owznkqli9c2',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mhh5qraws7m',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '0cdb9slpkvt',
    'x-async': true,
    'x-index': 1,
  },
};

export const testingOfOpenModeForAddChild = {
  collections: tree,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      euelf5zhr9q: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          tt9ipsm1wb7: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              '84prsw2twys': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  xfm61n5c4ml: {
                    'x-uid': 'niqn7muvetp',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'treeCollection:list',
                    'x-decorator-props': {
                      collection: 'treeCollection',
                      resource: 'treeCollection',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                      treeTable: true,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-index': 1,
                    'x-async': false,
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
                        properties: {
                          '14rxh3ytw3c': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: "{{t('Add new')}}",
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:addNew',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-component-props': {
                              openMode: 'drawer',
                              type: 'primary',
                              component: 'CreateRecordAction',
                              icon: 'PlusOutlined',
                            },
                            'x-action-context': {
                              dataSource: 'main',
                              collection: 'treeCollection',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-app-version': '1.2.11-alpha',
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
                                'x-app-version': '1.2.11-alpha',
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
                                    'x-app-version': '1.2.11-alpha',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.2.11-alpha',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-app-version': '1.2.11-alpha',
                                            properties: {
                                              '722yyrv7m98': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                'x-app-version': '1.2.11-alpha',
                                                properties: {
                                                  '7vy82xvhbzv': {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    'x-app-version': '1.2.11-alpha',
                                                    properties: {
                                                      ojcfptdk0c0: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-acl-action-props': {
                                                          skipScopeCheck: true,
                                                        },
                                                        'x-acl-action': 'treeCollection:create',
                                                        'x-decorator': 'FormBlockProvider',
                                                        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                                                        'x-decorator-props': {
                                                          dataSource: 'main',
                                                          collection: 'treeCollection',
                                                        },
                                                        'x-toolbar': 'BlockSchemaToolbar',
                                                        'x-settings': 'blockSettings:createForm',
                                                        'x-component': 'CardItem',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          etmgtwb4474: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'FormV2',
                                                            'x-use-component-props': 'useCreateFormBlockProps',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              grid: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Grid',
                                                                'x-initializer': 'form:configureFields',
                                                                'x-app-version': '1.2.11-alpha',
                                                                'x-uid': 'qyfkgumnv90',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              zrbty8toodw: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-initializer': 'createForm:configureActions',
                                                                'x-component': 'ActionBar',
                                                                'x-component-props': {
                                                                  layout: 'one-column',
                                                                },
                                                                'x-app-version': '1.2.11-alpha',
                                                                properties: {
                                                                  kpw3o1spzj1: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    title: '{{ t("Submit") }}',
                                                                    'x-action': 'submit',
                                                                    'x-component': 'Action',
                                                                    'x-use-component-props': 'useCreateActionProps',
                                                                    'x-toolbar': 'ActionSchemaToolbar',
                                                                    'x-settings': 'actionSettings:createSubmit',
                                                                    'x-component-props': {
                                                                      type: 'primary',
                                                                      htmlType: 'submit',
                                                                    },
                                                                    'x-action-settings': {
                                                                      triggerWorkflows: [],
                                                                    },
                                                                    type: 'void',
                                                                    'x-app-version': '1.2.11-alpha',
                                                                    'x-uid': 'nrk908wqbts',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'igr9k3h7t7k',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': 'ma5rlhv9dum',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '0wnvhgf9n8d',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'e35bul8clzk',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'kq2ogpqu4br',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'fhwssrh6vew',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'k1qre6axckx',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '8zoopsn9t1c',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'v0b2ve58b9n',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '0oy33akilo9',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'moycl7oeq4d',
                        'x-async': false,
                      },
                      hls18lynxej: {
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
                                  gc1mzfhtmdl: {
                                    'x-uid': '6vxfbkfht31',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Add child") }}',
                                    'x-action': 'create',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:addChild',
                                    'x-component': 'Action.Link',
                                    'x-visible': '{{treeTable}}',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      type: 'link',
                                      addChild: true,
                                      style: {
                                        height: 'auto',
                                        lineHeight: 'normal',
                                      },
                                      component: 'CreateRecordAction',
                                    },
                                    'x-action-context': {
                                      dataSource: 'main',
                                      collection: 'treeCollection',
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
                                        title: '{{ t("Add record") }}',
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
                                            'x-initializer-props': {
                                              gridInitializer: 'popup:addNew:addBlock',
                                            },
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Add new")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:addNew:addBlock',
                                                    properties: {
                                                      qbw17tsgocv: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          '9bpqpmy2l8c': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              yf0mn75iodr: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: true,
                                                                },
                                                                'x-acl-action': 'treeCollection:create',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useCreateFormBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  collection: 'treeCollection',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:createForm',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.2.11-alpha',
                                                                properties: {
                                                                  vnb4zilj1s6: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useCreateFormBlockProps',
                                                                    'x-app-version': '1.2.11-alpha',
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '1.2.11-alpha',
                                                                        properties: {
                                                                          '5bepa3nxiwi': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            properties: {
                                                                              '65hydfrna86': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.2.11-alpha',
                                                                                properties: {
                                                                                  parent: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'treeCollection.parent',
                                                                                    'x-component-props': {
                                                                                      fieldNames: {
                                                                                        label: 'id',
                                                                                        value: 'id',
                                                                                      },
                                                                                    },
                                                                                    'x-app-version': '1.2.11-alpha',
                                                                                    'x-uid': 'x0pqhzn0dfu',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'g1131ruon9u',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 't690n5j1if6',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'nuf1hbm4uqf',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      vyza1c3iq0t: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'createForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                        },
                                                                        'x-app-version': '1.2.11-alpha',
                                                                        properties: {
                                                                          zsf1ou7k1y1: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            title: '{{ t("Submit") }}',
                                                                            'x-action': 'submit',
                                                                            'x-component': 'Action',
                                                                            'x-use-component-props':
                                                                              'useCreateActionProps',
                                                                            'x-toolbar': 'ActionSchemaToolbar',
                                                                            'x-settings': 'actionSettings:createSubmit',
                                                                            'x-component-props': {
                                                                              type: 'primary',
                                                                              htmlType: 'submit',
                                                                            },
                                                                            'x-action-settings': {
                                                                              triggerWorkflows: [],
                                                                            },
                                                                            type: 'void',
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            'x-uid': 'a2t0bdb0c23',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'ddakb17iwlm',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'vjd5wufu5l2',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'ro5s0kuk1kq',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '683qh1ldrxs',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '31v1l2j2tfy',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '1nd9ovqqned',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '58hcwivcxbj',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ahgw09yxsac',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '08m47skufh8',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'umteghuduih',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'epu2ma0vdqt',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'sv212245quv',
                        'x-async': false,
                      },
                    },
                  },
                },
                'x-uid': '4rxdrz9ssqx',
                'x-async': false,
              },
            },
            'x-uid': 'ectsxs7va4s',
            'x-async': false,
          },
        },
        'x-uid': 'lvmtg2dpaob',
        'x-async': false,
      },
    },
    'x-uid': '3fgd1qvr2x0',
    'x-async': true,
  },
};

export const differentURL_DifferentPopupContent = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      xlwpsefi0rw: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '5ppc11ecj4o': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.11-alpha',
            properties: {
              '6m75zwnvf57': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.11-alpha',
                properties: {
                  y4j5sib2mj7: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'users',
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
                    'x-app-version': '1.2.11-alpha',
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
                        'x-app-version': '1.2.11-alpha',
                        'x-uid': '1v5mhoefk6r',
                        'x-async': false,
                        'x-index': 1,
                      },
                      gnksak514yy: {
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
                        'x-app-version': '1.2.11-alpha',
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
                            'x-app-version': '1.2.11-alpha',
                            properties: {
                              blcb280on5l: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.11-alpha',
                                'x-uid': 'bigkwfds2y0',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'p7sl3dgapk4',
                            'x-async': false,
                            'x-index': 1,
                          },
                          lpmbjh4vu7z: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.2.11-alpha',
                            properties: {
                              roles: {
                                'x-uid': 'y607x1mlam5',
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.roles',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    value: 'name',
                                    label: 'name',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.2.11-alpha',
                                'x-action-context': {
                                  dataSource: 'main',
                                  association: 'users.roles',
                                },
                                properties: {
                                  nyz6eol31kg: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'AssociationField.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-index': 1,
                                    'x-app-version': '1.2.11-alpha',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '1.2.11-alpha',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.2.11-alpha',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '1.2.11-alpha',
                                                properties: {
                                                  wptknu6oaiw: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    'x-app-version': '1.2.11-alpha',
                                                    properties: {
                                                      '4o0w0ra5udx': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          ons7cm6wx74: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-acl-action': 'users.roles:get',
                                                            'x-decorator': 'DetailsBlockProvider',
                                                            'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                            'x-decorator-props': {
                                                              dataSource: 'main',
                                                              association: 'users.roles',
                                                              readPretty: true,
                                                              action: 'get',
                                                            },
                                                            'x-toolbar': 'BlockSchemaToolbar',
                                                            'x-settings': 'blockSettings:details',
                                                            'x-component': 'CardItem',
                                                            'x-is-current': true,
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              hn9oo2pqzdg: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Details',
                                                                'x-read-pretty': true,
                                                                'x-use-component-props': 'useDetailsProps',
                                                                'x-app-version': '1.2.11-alpha',
                                                                properties: {
                                                                  '44jhb7929ge': {
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
                                                                    'x-app-version': '1.2.11-alpha',
                                                                    'x-uid': 'p9w2xkmyiqz',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  grid: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid',
                                                                    'x-initializer': 'details:configureFields',
                                                                    'x-app-version': '1.2.11-alpha',
                                                                    properties: {
                                                                      qz72rmz3j7a: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Row',
                                                                        'x-app-version': '1.2.11-alpha',
                                                                        properties: {
                                                                          ymlwg8c019i: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Col',
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            properties: {
                                                                              title: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'string',
                                                                                'x-toolbar': 'FormItemSchemaToolbar',
                                                                                'x-settings': 'fieldSettings:FormItem',
                                                                                'x-component': 'CollectionField',
                                                                                'x-decorator': 'FormItem',
                                                                                'x-collection-field': 'roles.title',
                                                                                'x-component-props': {},
                                                                                'x-app-version': '1.2.11-alpha',
                                                                                'x-uid': 'b0i1l8qjki2',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'tmlen2jdqtz',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'q4qla1h0ciz',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 't5lhb9lyqzd',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'qzkb571h6au',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'ec3pjx5jdgh',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'tjzydiqwzei',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'xn2ojcclhdb',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'zj95rvpdl8m',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'yd9r3rwzqz9',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'hlyzt008fie',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'hovitmmznab',
                                    'x-async': false,
                                  },
                                },
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '1es2wdkd7wf',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'nt8zdcc6ip8',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'gqxvz4sro7p',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'yuemdlkv69p',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '3e20t3pao9u',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'fgis7ejmluj',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 't8y55nmqpqt',
    'x-async': true,
    'x-index': 1,
  },
};
export const subTableDefaultValue = {
  collections: [
    {
      name: 'people',
      fields: [
        {
          name: 'group',
          interface: 'o2m',
          target: 'group',
          targetKey: 'id',
        },
      ],
    },
    {
      name: 'group',
      fields: [
        {
          name: 'staff',
          interface: 'm2o',
          target: 'users',
          targetKey: 'id',
        },
        {
          name: 'timeStart',
          interface: 'datetime',
        },
        {
          name: 'timeEnd',
          interface: 'datetime',
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
      gxs8yrx2r0h: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '823g8sd0un5': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.46-beta',
            properties: {
              s8gra6scztq: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.46-beta',
                properties: {
                  k0hmoift98n: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'people:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'people',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-app-version': '1.3.46-beta',
                    properties: {
                      qj7mcan7daw: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.3.46-beta',
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.3.46-beta',
                            properties: {
                              zx4nzvdjpzq: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.3.46-beta',
                                properties: {
                                  osnr82axoai: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.3.46-beta',
                                    properties: {
                                      group: {
                                        'x-uid': '001ix5hsr0t',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'people.group',
                                        'x-component-props': {
                                          fieldNames: {
                                            label: 'id',
                                            value: 'id',
                                          },
                                          mode: 'SubTable',
                                        },
                                        'x-app-version': '1.3.46-beta',
                                        default: null,
                                        properties: {
                                          '2go92pz3q7s': {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.SubTable',
                                            'x-initializer': 'table:configureColumns',
                                            'x-initializer-props': {
                                              action: false,
                                            },
                                            'x-index': 1,
                                            'x-app-version': '1.3.46-beta',
                                            properties: {
                                              '9e59ms847h0': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                'x-app-version': '1.3.46-beta',
                                                properties: {
                                                  staff: {
                                                    'x-uid': 'qfin4x5otua',
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'group.staff',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {
                                                      fieldNames: {
                                                        label: 'nickname',
                                                        value: 'id',
                                                      },
                                                      ellipsis: true,
                                                      size: 'small',
                                                    },
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-app-version': '1.3.46-beta',
                                                    default: '{{$user}}',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'gg09b3sv8p7',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                              kd80mzx281w: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                'x-app-version': '1.3.46-beta',
                                                properties: {
                                                  timeStart: {
                                                    'x-uid': 'sm3t7czuvu1',
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'group.timeStart',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {},
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-app-version': '1.3.46-beta',
                                                    default: '2024-11-06T16:00:00.000Z',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'ojxw1dbkoi0',
                                                'x-async': false,
                                                'x-index': 2,
                                              },
                                              st8bezxhvax: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                'x-app-version': '1.3.46-beta',
                                                properties: {
                                                  timeEnd: {
                                                    'x-uid': '0nks9kfq38u',
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'group.timeEnd',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {},
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-app-version': '1.3.46-beta',
                                                    default: '{{$iteration.timeStart}}',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '8lynj1uxlbv',
                                                'x-async': false,
                                                'x-index': 3,
                                              },
                                            },
                                            'x-uid': 'bsd9l4pl5by',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 't9bhhahpuln',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'm94ti0kcqqh',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '9po3njajeii',
                            'x-async': false,
                            'x-index': 1,
                          },
                          gr2fjadfkef: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            'x-app-version': '1.3.46-beta',
                            'x-uid': 'v5zhsmloels',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'o9fcw2oo6vi',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '7361xvr7amv',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'an5bhgxdio8',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '0hixaaou1xh',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'nfot2l93mkp',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '3lfdt8s5cay',
    'x-async': true,
    'x-index': 1,
  },
};
export const hideColumnBasic = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.4.0-alpha.1',
    properties: {
      bfc254m95nt: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.4.0-alpha.1',
        properties: {
          '4e61hstsu6e': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.4.0-alpha.1',
            properties: {
              j9xovyw5nce: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.4.0-alpha.1',
                properties: {
                  '9ivpaiunf9y': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'users',
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
                    'x-app-version': '1.4.0-alpha.1',
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
                        'x-app-version': '1.4.0-alpha.1',
                        'x-uid': '51wc0e6u31j',
                        'x-async': false,
                        'x-index': 1,
                      },
                      bs7p8uu830m: {
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
                        'x-app-version': '1.4.0-alpha.1',
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
                            'x-app-version': '1.4.0-alpha.1',
                            properties: {
                              jw80rplhox4: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.4.0-alpha.1',
                                'x-uid': 'u06c9tleqou',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '9s1pfakz0om',
                            'x-async': false,
                            'x-index': 1,
                          },
                          aph2w5uiev9: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.4.0-alpha.1',
                            properties: {
                              nickname: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.nickname',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.4.0-alpha.1',
                                'x-uid': '3w3zou3ceb3',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '4m9sepacwvm',
                            'x-async': false,
                            'x-index': 2,
                          },
                          wpmysa656gq: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.4.0-alpha.1',
                            properties: {
                              username: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.username',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.4.0-alpha.1',
                                'x-uid': '38dn4mm3hr5',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '9ed6nyhlgzi',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': 'sc4a347zrvr',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'z8gp6wsukkv',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '60rzu0t7mm9',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'po4tzdbip1j',
            'x-async': false,
            'x-index': 1,
          },
          h9rg0fz8izl: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.4.0-alpha.1',
            properties: {
              acu1j5bgeeh: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.4.0-alpha.1',
                properties: {
                  azoaet9funq: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'users:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'users',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-app-version': '1.4.0-alpha.1',
                    properties: {
                      pfltqojjolr: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.4.0-alpha.1',
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.4.0-alpha.1',
                            properties: {
                              y4g2q6tyb0a: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.4.0-alpha.1',
                                properties: {
                                  thgbnha840e: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.4.0-alpha.1',
                                    properties: {
                                      roles: {
                                        'x-uid': 'ivyzmc9lc21',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.roles',
                                        'x-component-props': {
                                          fieldNames: {
                                            label: 'name',
                                            value: 'name',
                                          },
                                          mode: 'SubTable',
                                        },
                                        'x-app-version': '1.4.0-alpha.1',
                                        default: null,
                                        properties: {
                                          eoizayhit92: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.SubTable',
                                            'x-initializer': 'table:configureColumns',
                                            'x-initializer-props': {
                                              action: false,
                                            },
                                            'x-index': 1,
                                            'x-app-version': '1.4.0-alpha.1',
                                            properties: {
                                              nhe3d7uuyur: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                'x-app-version': '1.4.0-alpha.1',
                                                properties: {
                                                  name: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'roles.name',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {
                                                      ellipsis: true,
                                                    },
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-app-version': '1.4.0-alpha.1',
                                                    'x-uid': 'e89fxf1mg7i',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'kxbrpz5jmc7',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                              jgnjc800er5: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                'x-app-version': '1.4.0-alpha.1',
                                                properties: {
                                                  title: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'roles.title',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {
                                                      ellipsis: true,
                                                    },
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-app-version': '1.4.0-alpha.1',
                                                    'x-uid': 'bankqu2es91',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'uwyyk7ix2lb',
                                                'x-async': false,
                                                'x-index': 2,
                                              },
                                            },
                                            'x-uid': 'ff16rxs8lbo',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '4nagabglobc',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'noqp2jcfp2j',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'a330n90aoyf',
                            'x-async': false,
                            'x-index': 1,
                          },
                          vpwq72gj933: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            'x-app-version': '1.4.0-alpha.1',
                            'x-uid': '1nauytag1dh',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '342ktwn88zo',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '84tmhiuph4u',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'j70955c17aq',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'vtz6tq8n0mx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-uid': '1f4xbt4prbg',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'ifb5nqtgnng',
    'x-async': true,
    'x-index': 1,
  },
};
