import { PageConfig } from './e2eUtils';
import { generalWithM2oSingleSelect } from './templatesOfCollection';

/**
 * 一个空的 group 页面
 */
export const groupPageEmpty: PageConfig = {
  type: 'group',
  name: 'Empty group',
  pageSchema: {
    type: 'void',
  },
};

export const linkPage: PageConfig = {
  type: 'link',
  name: 'Link',
  url: '/',
  pageSchema: {
    type: 'void',
  },
};

/**
 * 一个空的且启用 tabs 的 page 页面
 */
export const tabPageEmpty: PageConfig = {
  pageSchema: {
    'x-uid': 'esny2dg7yz8',
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-component-props': {
      enablePageTabs: true,
    },
    properties: {
      '66azy7h1rj0': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-uid': 'ir8tvhr1xqi',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-async': true,
    'x-index': 1,
  },
};

/**
 * 1. 一个数据表，且拥有一个对一的关系字段
 * 2. 一个 Table 区块，且基于上面的 collection
 */
export const oneEmptyTable: PageConfig = {
  collections: [
    {
      name: 't_unp4scqamw9',
      title: 'schemaInitializerTable',
      fields: [
        {
          name: 'f_glmx57v26jp',
          interface: 'integer',
        },
        {
          name: 'f_zcrjd5yzin4',
          interface: 'integer',
        },
        {
          name: 'f_pw7uiecc8uc',
          interface: 'obo',
          foreignKey: 'f_glmx57v26jp',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: false,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
            title: 'One to one (belongs to)',
          },
          target: 'users',
          targetKey: 'id',
        },
        {
          name: 'f_nlag88n4f22',
          interface: 'oho',
          foreignKey: 'f_90fy41an7i7',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: false,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
            title: 'One to one (has one)',
          },
          target: 'users',
          sourceKey: 'id',
        },
        {
          name: 'f_mpzuntgzwhp',
          interface: 'm2o',
          foreignKey: 'f_zcrjd5yzin4',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: false,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
            title: 'Many to one',
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
    properties: {
      i9tltxwy1zd: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          fdkznek8n9o: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              qqjb1h3wfw8: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '2tguu2tfldr': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 't_unp4scqamw9:list',
                    'x-decorator-props': {
                      collection: 't_unp4scqamw9',
                      resource: 't_unp4scqamw9',
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
                        'x-initializer': 'TableActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'yua2ss66y9j',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pdv91sygvv8: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'TableColumnInitializers',
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
                            'x-initializer': 'TableActionColumnInitializers',
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
                                'x-uid': 'hn2sfhtqhoh',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '6ibzk6jzhxm',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'ys113qin9xn',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '2mbwbsomp3t',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'uqznz647hoa',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'cm64yzy59qh',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'w26ak58jtka',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '24ajc4tx11u',
    'x-async': true,
    'x-index': 1,
  },
};

/**
 * 1. 页面中有一个空的 Form 区块
 */
export const oneEmptyForm: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          cxk2aa058lc: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '4ulo13u15kt': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '5mflo02rgff': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-decorator-props': {
                      resource: 'general',
                      collection: 'general',
                    },
                    'x-designer': 'FormV2.Designer',
                    'x-component': 'CardItem',
                    'x-component-props': {},
                    properties: {
                      ucvfcgnna36: {
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
                            'x-initializer': 'FormItemInitializers',
                            'x-uid': 'y6qzidbf0lm',
                            'x-async': false,
                            'x-index': 1,
                          },
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'FormActionInitializers',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                marginTop: 24,
                              },
                            },
                            'x-uid': 'feed03avbqu',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '3vfc39kpoy3',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'e1r2h19m8se',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'p4g703ynv35',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '7mi1lml5o3h',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mdgtorpxh0m',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'xfb86y93hgb',
    'x-async': true,
    'x-index': 1,
  },
};

/**
 * 1. 页面中有一个空的 Details 区块
 */
export const oneEmptyDetailsBlock: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          cnp4fnntodr: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '30d05n8wp4e': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  lohbenudbu6: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'general:view',
                    'x-decorator': 'DetailsBlockProvider',
                    'x-decorator-props': {
                      resource: 'general',
                      collection: 'general',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 1,
                      },
                      rowKey: 'id',
                    },
                    'x-designer': 'DetailsDesigner',
                    'x-component': 'CardItem',
                    properties: {
                      yxj280qh2y3: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Details',
                        'x-read-pretty': true,
                        'x-component-props': {
                          useProps: '{{ useDetailsBlockProps }}',
                        },
                        properties: {
                          vec57ijdiz5: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'DetailsActionInitializers',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 24,
                              },
                            },
                            'x-uid': '9cmaepe5ljp',
                            'x-async': false,
                            'x-index': 1,
                          },
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'ReadPrettyFormItemInitializers',
                            'x-uid': 'sldwwd6jq6g',
                            'x-async': false,
                            'x-index': 2,
                          },
                          pagination: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Pagination',
                            'x-component-props': {
                              useProps: '{{ useDetailsPaginationProps }}',
                            },
                            'x-uid': '25uppxx8e3w',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': '5wlbdp83m9t',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'r0jfts120n1',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'ohpzbfpov91',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'b0t5u8kg3r4',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};

/**
 * 1. 页面中有一个空的 List 区块
 */
export const oneEmptyListBlock: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          wpm7v8svnpo: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              f2m84g3sa74: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  klvncx1etre: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'general:view',
                    'x-decorator': 'List.Decorator',
                    'x-decorator-props': {
                      resource: 'general',
                      collection: 'general',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 10,
                      },
                      runWhenParamsChanged: true,
                      rowKey: 'id',
                    },
                    'x-component': 'CardItem',
                    'x-designer': 'List.Designer',
                    properties: {
                      actionBar: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'ListActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'aqn0xjnaxfk',
                        'x-async': false,
                        'x-index': 1,
                      },
                      list: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'List',
                        'x-component-props': {
                          props: '{{ useListBlockProps }}',
                        },
                        properties: {
                          item: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'object',
                            'x-component': 'List.Item',
                            'x-read-pretty': true,
                            'x-component-props': {
                              useProps: '{{ useListItemProps }}',
                            },
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'ReadPrettyFormItemInitializers',
                                'x-initializer-props': {
                                  useProps: '{{ useListItemInitializerProps }}',
                                },
                                'x-uid': 'f7qieru91pl',
                                'x-async': false,
                                'x-index': 1,
                              },
                              actionBar: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-align': 'left',
                                'x-initializer': 'ListItemActionInitializers',
                                'x-component': 'ActionBar',
                                'x-component-props': {
                                  useProps: '{{ useListActionBarProps }}',
                                  layout: 'one-column',
                                },
                                'x-uid': 'khzowioajj4',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'igic6juk89e',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'vd0pn4qdf9h',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'zcax3fsu9c1',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'g65v6zwii0r',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'zrndkor7fb7',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};

/**
 * 1. 页面中有一个空的 Grid Card 区块
 */
export const oneEmptyGridCardBlock: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          x22u60kld4t: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              tmj9j2dm9g2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  g5dnrvukbf3: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'general:view',
                    'x-decorator': 'GridCard.Decorator',
                    'x-decorator-props': {
                      resource: 'general',
                      collection: 'general',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 12,
                      },
                      runWhenParamsChanged: true,
                      rowKey: 'id',
                    },
                    'x-component': 'BlockItem',
                    'x-component-props': {
                      useProps: '{{ useGridCardBlockItemProps }}',
                    },
                    'x-designer': 'GridCard.Designer',
                    properties: {
                      actionBar: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'GridCardActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'anvxx86mh91',
                        'x-async': false,
                        'x-index': 1,
                      },
                      list: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'GridCard',
                        'x-component-props': {
                          useProps: '{{ useGridCardBlockProps }}',
                        },
                        properties: {
                          item: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'object',
                            'x-component': 'GridCard.Item',
                            'x-read-pretty': true,
                            'x-component-props': {
                              useProps: '{{ useGridCardItemProps }}',
                            },
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'ReadPrettyFormItemInitializers',
                                'x-initializer-props': {
                                  useProps: '{{ useGridCardItemInitializerProps }}',
                                },
                                'x-uid': 'xtnpbuw8xwn',
                                'x-async': false,
                                'x-index': 1,
                              },
                              actionBar: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-align': 'left',
                                'x-initializer': 'GridCardItemActionInitializers',
                                'x-component': 'ActionBar',
                                'x-component-props': {
                                  useProps: '{{ useGridCardActionBarProps }}',
                                  layout: 'one-column',
                                },
                                'x-uid': 'a104tk6foz5',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'l736qwugnby',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'aqrg3in5woc',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'hb1d0zzc5ta',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'bhmzdricslf',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'oagtetw4j4q',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};

/**
 * 1. 页面中有一个空的 Filter Form 区块
 */
export const oneEmptyFilterFormBlock: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          mk7wdkfacfo: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              qf7iimu1b3z: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  imucxdqjnz7: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'FilterFormBlockProvider',
                    'x-decorator-props': {
                      resource: 'general',
                      collection: 'general',
                    },
                    'x-designer': 'FormV2.FilterDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-filter-operators': {},
                    properties: {
                      mtcs5p2wlgz: {
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
                            'x-initializer': 'FilterFormItemInitializers',
                            'x-uid': 'yls3c6j92ex',
                            'x-async': false,
                            'x-index': 1,
                          },
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'FilterFormActionInitializers',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                float: 'right',
                              },
                            },
                            'x-uid': 'h633le1snu3',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'k8nlhvr6ek0',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'a1irioiq97n',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'wmqoca6ja3e',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'krlbcsvu3g2',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};

/**
 * 1. 页面中有一个空的 Filter Collapse 区块
 */
export const oneEmptyFilterCollapseBlock: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          vnikc8bt477: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              ldy0krtd577: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  rssegnstkxk: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'AssociationFilter.Provider',
                    'x-decorator-props': {
                      collection: 'general',
                      blockType: 'filter',
                      associationFilterStyle: {
                        width: '100%',
                      },
                      name: 'filter-collapse',
                    },
                    'x-designer': 'AssociationFilter.BlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    properties: {
                      d3htwhxi5o2: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-action': 'associateFilter',
                        'x-initializer': 'AssociationFilter.FilterBlockInitializer',
                        'x-component': 'AssociationFilter',
                        'x-uid': 'ir10wbyxxom',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'evh26bsoj76',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'l86xyvbl09q',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'hzwfh9gdt86',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};

/**
 * 页面中有一个空的 Table 区块，并且有这些按钮：Add new / Delete / Refresh / Add record / Filter / view / edit / delete / duplicate
 */
export const oneEmptyTableBlockWithActions: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          '1m4gz110aaw': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '695oy51236d': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  twtgsvrdmn1: {
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
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'TableActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        properties: {
                          aswbjti3hxb: {
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
                            'x-uid': '36mffhavp45',
                            'x-async': false,
                            'x-index': 1,
                          },
                          v6bxhqgx3kb: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: "{{t('Add new')}}",
                            'x-designer': 'Action.Designer',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-component-props': {
                              openMode: 'drawer',
                              type: 'primary',
                              component: 'CreateRecordAction',
                              icon: 'PlusOutlined',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
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
                                    'x-initializer': 'TabPaneInitializersForCreateFormBlock',
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
                                            'x-initializer': 'CreateFormBlockInitializers',
                                            'x-uid': 'k0zm3uifn6v',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'v6isbw9hlpw',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'xpc7b8g56wm',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'w4vqog8d6fc',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'e5u73mjhbpv',
                            'x-async': false,
                            'x-index': 2,
                          },
                          zpykqmzkmw7: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            title: '{{ t("Delete") }}',
                            'x-action': 'destroy',
                            'x-component': 'Action',
                            'x-designer': 'Action.Designer',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-component-props': {
                              icon: 'DeleteOutlined',
                              confirm: {
                                title: "{{t('Delete record')}}",
                                content: "{{t('Are you sure you want to delete it?')}}",
                              },
                              useProps: '{{ useBulkDestroyActionProps }}',
                            },
                            'x-acl-action': 'general:destroy',
                            'x-align': 'right',
                            type: 'void',
                            'x-uid': 'j60v3wukp5h',
                            'x-async': false,
                            'x-index': 3,
                          },
                          hf2fgfr0wz1: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            title: '{{ t("Refresh") }}',
                            'x-action': 'refresh',
                            'x-component': 'Action',
                            'x-designer': 'Action.Designer',
                            'x-component-props': {
                              icon: 'ReloadOutlined',
                              useProps: '{{ useRefreshActionProps }}',
                            },
                            'x-align': 'right',
                            type: 'void',
                            'x-uid': '7bzjyrm8cny',
                            'x-async': false,
                            'x-index': 4,
                          },
                          '6sdojhdg3h6': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{t("Add record")}}',
                            'x-designer': 'Action.Designer',
                            'x-component': 'Action',
                            'x-action': 'customize:create',
                            'x-component-props': {
                              openMode: 'drawer',
                              icon: 'PlusOutlined',
                            },
                            'x-align': 'right',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action': 'create',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{t("Add record")}}',
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
                                    'x-initializer': 'TabPaneInitializersForCreateFormBlock',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add record")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'CusomeizeCreateFormBlockInitializers',
                                            'x-uid': '60wmk833o7b',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'ofax7npcr4k',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'azqoktw9foa',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'shq3svoccnv',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '8uzuhlxfvpp',
                            'x-async': false,
                            'x-index': 5,
                          },
                        },
                        'x-uid': 'znrsshrlsna',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '1xnl1d9j48o': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'TableColumnInitializers',
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
                            'x-initializer': 'TableActionColumnInitializers',
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
                                  t178jp349gk: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-designer': 'Action.Designer',
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
                                                    'x-initializer': 'RecordBlockInitializers',
                                                    'x-uid': '1m4fg88bmp6',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'c0n2xlny379',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ypgdhts0juc',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 't4jjs8tcpjs',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'bccdn30vjbq',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  '55iskt5f5xh': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Edit") }}',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      icon: 'EditOutlined',
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                    'x-initializer': 'RecordBlockInitializers',
                                                    'x-uid': 'zjv8mf85knj',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '69ddzuimuul',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '35bowqd8pix',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '2v9ejxzzlkk',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'w83bfahd4x8',
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                  j1idayf6ll4: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    title: '{{ t("Delete") }}',
                                    'x-action': 'destroy',
                                    'x-component': 'Action.Link',
                                    'x-designer': 'Action.Designer',
                                    'x-component-props': {
                                      icon: 'DeleteOutlined',
                                      confirm: {
                                        title: "{{t('Delete record')}}",
                                        content: "{{t('Are you sure you want to delete it?')}}",
                                      },
                                      useProps: '{{ useDestroyActionProps }}',
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    type: 'void',
                                    'x-uid': 'f9ojdap4hvw',
                                    'x-async': false,
                                    'x-index': 3,
                                  },
                                  '659x6w2yydk': {
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
                                                    'x-initializer': 'CreateFormBlockInitializers',
                                                    'x-uid': 'vtcnkzcaeec',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'kbq4w0dmexr',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '1v4k1kjpbi5',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'ok9iw50ycdh',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'sjg3udjdnc1',
                                    'x-async': false,
                                    'x-index': 4,
                                  },
                                },
                                'x-uid': 'ijgo5usyzbp',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '5tnwpodzirq',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'k8t01z9qna3',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'c29q4s49svw',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '9pe6fpnq33f',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'j6g551r7tbp',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};

/**
 * 一个空的 Table 区块，并且有这些按钮：Bulk edit
 */
export const oneEmptyTableBlockWithCustomizeActions: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          '1m4gz110aaw': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '695oy51236d': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  twtgsvrdmn1: {
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
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'TableActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        properties: {
                          yt5ua92rqvb: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{t("Bulk edit")}}',
                            'x-designer': 'Action.Designer',
                            'x-component': 'Action',
                            'x-action': 'customize:bulkEdit',
                            'x-action-settings': {
                              updateMode: 'selected',
                            },
                            'x-component-props': {
                              openMode: 'drawer',
                              icon: 'EditOutlined',
                            },
                            'x-align': 'right',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action': 'update',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{t("Bulk edit")}}',
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
                                    'x-initializer': 'TabPaneInitializersForBulkEditFormBlock',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Bulk edit")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'CreateFormBulkEditBlockInitializers',
                                            'x-uid': '3gjmo60w4de',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '2q284n9l6w2',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 's07s8zva7id',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '0n86l5rtgpb',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'k8sk9wa8sv6',
                            'x-async': false,
                            'x-index': 6,
                          },
                        },
                        'x-uid': 'znrsshrlsna',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '1xnl1d9j48o': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'TableColumnInitializers',
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
                            'x-initializer': 'TableActionColumnInitializers',
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
                                'x-uid': 'ijgo5usyzbp',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '5tnwpodzirq',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'k8t01z9qna3',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'c29q4s49svw',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '9pe6fpnq33f',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'j6g551r7tbp',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};

/**
 * 一个基于 Users 表的 Form 区块，且有一个 Roles 字段，并且是数据选择器模式
 */
export const oneFormBlockWithRolesFieldBasedUsers: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          f998lh2qg2h: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              vawilp2p75e: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '6jj7ds3wgxu': {
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
                      dxzaeom6sns: {
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
                            'x-initializer': 'FormItemInitializers',
                            properties: {
                              '91d8jzkh9r5': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '0co1a3w97fp': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      roles: {
                                        'x-uid': 'w92sq7e4p6p',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.roles',
                                        'x-component-props': {
                                          mode: 'Picker',
                                        },
                                        properties: {
                                          '2n626oyn2zo': {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.Selector',
                                            title: '{{ t("Select record") }}',
                                            'x-component-props': {
                                              className: 'nb-record-picker-selector',
                                            },
                                            'x-index': 1,
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'TableSelectorInitializers',
                                                'x-uid': 'lzt548tlewj',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                              footer: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                'x-component': 'Action.Container.Footer',
                                                'x-component-props': {},
                                                properties: {
                                                  actions: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'ActionBar',
                                                    'x-component-props': {},
                                                    properties: {
                                                      submit: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        title: '{{ t("Submit") }}',
                                                        'x-action': 'submit',
                                                        'x-component': 'Action',
                                                        'x-designer': 'Action.Designer',
                                                        'x-component-props': {
                                                          type: 'primary',
                                                          htmlType: 'submit',
                                                          useProps: '{{ usePickActionProps }}',
                                                        },
                                                        'x-uid': 'xtph978ht0s',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'cbdymjkmo9v',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'uim54xgvmgv',
                                                'x-async': false,
                                                'x-index': 2,
                                              },
                                            },
                                            'x-uid': 'm4wlzzzeb67',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '2b4q1hv7jv0',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'kdcuwpsusme',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'mujrljjt31w',
                            'x-async': false,
                            'x-index': 1,
                          },
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'FormActionInitializers',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                marginTop: 24,
                              },
                            },
                            'x-uid': 'ep3pwhun5ku',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '9tp1p5vf46m',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'lhqa53scz9i',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'bhvto9yuvct',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '918rirwa7qu',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};

/**
 * 页面中有一个详情区块，且有一个名为 toGeneral 的关系字段（m2o），指向 General 表
 */
export const oneDetailBlockWithM2oFieldToGeneral: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      yxmahmlh8o5: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          '40g1gedv1hg': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              mxhw6wlhgc4: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '5o5axia74l4': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'targetToGeneral:view',
                    'x-decorator': 'DetailsBlockProvider',
                    'x-decorator-props': {
                      resource: 'targetToGeneral',
                      collection: 'targetToGeneral',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 1,
                      },
                      rowKey: 'id',
                    },
                    'x-designer': 'DetailsDesigner',
                    'x-component': 'CardItem',
                    properties: {
                      '7dqm8cyv75w': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Details',
                        'x-read-pretty': true,
                        'x-component-props': {
                          useProps: '{{ useDetailsBlockProps }}',
                        },
                        properties: {
                          m0k3c7eifes: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'DetailsActionInitializers',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 24,
                              },
                            },
                            'x-uid': 'm1xeg7mvm1a',
                            'x-async': false,
                            'x-index': 1,
                          },
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'ReadPrettyFormItemInitializers',
                            properties: {
                              rp7rbwiym41: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  ior8lf4w5gf: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      toGeneral: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'targetToGeneral.toGeneral',
                                        'x-component-props': {},
                                        'x-uid': 'l5h0d3oaa8e',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'wwuo805yebc',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'oksxa8by2wg',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'asrxyva98lw',
                            'x-async': false,
                            'x-index': 2,
                          },
                          pagination: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Pagination',
                            'x-component-props': {
                              useProps: '{{ useDetailsPaginationProps }}',
                            },
                            'x-uid': 'wjxgz8a9t8b',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': 'iqpn46h8u32',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'vzk3p6iebpy',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'cqg2o7ll6os',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'ux1de9di7wc',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'ldw6jqzvx10',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'jvs9rrb5ifu',
    'x-async': true,
    'x-index': 1,
  },
};
